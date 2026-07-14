from pathlib import Path
import traceback
import numpy as np
import pandas as pd

from fastapi import (
    FastAPI,
    UploadFile,
    File,
)

from fastapi.middleware.cors import (
    CORSMiddleware,
)

from app.load_parser import (
    process_load_file,
)

from app.counters_parser import (
    process_counters_file,
    detect_memory_leaks,
)

from app.report_generator import (
    generate_action_report,
    generate_action_summary_report,
)

from app.chart_service import (
    action_trend,
    memory_trend,
)

from app.run_service import (
    get_runs,
    create_run,
)

from app.kpi_service import (
    init_kpi_database,
    seed_default_kpis,
    get_all_kpis,
    upsert_kpi,
)

from app.run_files_service import (
    ensure_run_folders,
    get_run_load_folder,
    get_run_counters_folder,
    list_run_files,
    process_run_load_files,
    process_run_counters_files,
    detect_run_memory_leaks,
)


app = FastAPI()


# =========================
# DATABASE INIT
# =========================

init_kpi_database()
seed_default_kpis()


# =========================
# CORS
# =========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# HEALTH
# =========================

@app.get("/health")
def health():
    return {
        "status": "UP"
    }


# =========================
# HELPERS
# =========================

def dataframe_to_clean_records(df):
    """
    Converts a Pandas DataFrame into JSON-safe records.

    This avoids FastAPI 500 errors caused by:
    - NaN
    - inf
    - -inf
    - pandas NA values
    """

    if df is None or df.empty:
        return []

    clean_df = df.copy()

    clean_df = clean_df.replace(
        [float("inf"), float("-inf")],
        pd.NA,
    )

    clean_df = clean_df.astype(object).where(
        pd.notnull(clean_df),
        None,
    )

    return clean_df.to_dict(
        orient="records"
    )


def safe_average_response_time(actions):
    if actions is None or actions.empty:
        return 0

    if "Duration" not in actions.columns:
        return 0

    values = pd.to_numeric(
        actions["Duration"],
        errors="coerce",
    ).dropna()

    if values.empty:
        return 0

    return float(
        values.mean()
    )


def safe_max_response_time(actions):
    if actions is None or actions.empty:
        return 0

    if "Duration" not in actions.columns:
        return 0

    values = pd.to_numeric(
        actions["Duration"],
        errors="coerce",
    ).dropna()

    if values.empty:
        return 0

    return float(
        values.max()
    )


# =========================
# UPLOADS DEFAULT
# =========================

@app.post("/upload-load")
async def upload_load(
    file: UploadFile = File(...),
):
    uploads_folder = Path("uploads")

    uploads_folder.mkdir(
        parents=True,
        exist_ok=True,
    )

    file_path = (
        uploads_folder
        / "load.csv"
    )

    contents = await file.read()

    with open(file_path, "wb") as buffer:
        buffer.write(contents)

    load_data = process_load_file(
        str(file_path)
    )

    report = generate_action_report(
        load_data
    )

    return {
        "message": "Load file uploaded successfully",
        "file": "uploads/load.csv",
        "records": dataframe_to_clean_records(
            report
        ),
    }


@app.post("/upload-counters")
async def upload_counters(
    file: UploadFile = File(...),
):
    uploads_folder = Path("uploads")

    uploads_folder.mkdir(
        parents=True,
        exist_ok=True,
    )

    file_path = (
        uploads_folder
        / "counters.csv"
    )

    contents = await file.read()

    with open(file_path, "wb") as buffer:
        buffer.write(contents)

    counters_report = process_counters_file(
        str(file_path)
    )

    memory_leaks_result = detect_memory_leaks(
        str(file_path)
    )

    return {
        "message": "Counters file uploaded successfully",
        "file": "uploads/counters.csv",
        "counters": dataframe_to_clean_records(
            counters_report
        ),
        "memory_leaks": memory_leaks_result,
    }


# =========================
# TESTES
# =========================

@app.get("/test-counters")
def test_counters():
    df = pd.read_csv(
        "uploads/counters.csv"
    )

    return {
        "columns": list(df.columns)
    }


# =========================
# DASHBOARD DEFAULT
# =========================

@app.get("/dashboard")
def dashboard():
    actions = process_load_file(
        "uploads/load.csv"
    )

    counters = process_counters_file(
        "uploads/counters.csv"
    )

    return {
        "total_actions": len(actions),
        "total_counters": len(counters),
        "average_response_time": safe_average_response_time(
            actions
        ),
        "max_response_time": safe_max_response_time(
            actions
        ),
    }


@app.get("/dashboard/full")
def full_dashboard():
    actions = process_load_file(
        "uploads/load.csv"
    )

    action_report = generate_action_report(
        actions
    )

    counters_report = process_counters_file(
        "uploads/counters.csv"
    )

    memory_leaks_result = detect_memory_leaks(
        "uploads/counters.csv"
    )

    return {
        "summary": {
            "total_actions": len(actions),
            "average_response_time": safe_average_response_time(
                actions
            ),
            "max_response_time": safe_max_response_time(
                actions
            ),
        },
        "actions": dataframe_to_clean_records(
            action_report
        ),
        "counters": dataframe_to_clean_records(
            counters_report
        ),
        "memory_leaks": memory_leaks_result,
    }


# =========================
# REPORTS DEFAULT
# =========================

@app.get("/reports/actions")
def actions_report():
    load_data = process_load_file(
        "uploads/load.csv"
    )

    report = generate_action_report(
        load_data
    )

    return dataframe_to_clean_records(
        report
    )


@app.get("/reports/counters")
def counters_report():
    report = process_counters_file(
        "uploads/counters.csv"
    )

    return dataframe_to_clean_records(
        report
    )


@app.get("/reports/memory-leaks")
def memory_leaks():
    return detect_memory_leaks(
        "uploads/counters.csv"
    )


# =========================
# CHARTS DEFAULT
# =========================

@app.get("/charts/action-trend")
def get_action_trend():
    return action_trend(
        "uploads/load.csv"
    )


@app.get("/charts/memory-trend")
def get_memory_trend():
    return memory_trend(
        "uploads/counters.csv"
    )


# =========================
# KPIS
# =========================

@app.get("/kpis")
def list_kpis():
    return get_all_kpis()


@app.post("/kpis")
def save_kpi(
    action_name: str,
    kpi_ms: float,
):
    upsert_kpi(
        action_name,
        kpi_ms,
    )

    return {
        "message": "KPI saved successfully",
        "Action": action_name,
        "KPI": kpi_ms,
    }


# =========================
# RUNS
# =========================

@app.get("/runs")
def list_runs():
    return get_runs()


@app.post("/runs/create")
def create_new_run():
    run_id = create_run()

    ensure_run_folders(
        run_id
    )

    return {
        "run_id": run_id
    }


@app.get("/runs/{run_id}/files")
def get_files_by_run(
    run_id: str,
):
    return list_run_files(
        run_id
    )


# =========================
# UPLOAD POR RUN - ARQUIVO ÚNICO
# O frontend envia vários arquivos um por um.
# =========================

@app.post("/runs/{run_id}/upload/load-file")
async def upload_run_load_file(
    run_id: str,
    file: UploadFile = File(...),
):
    ensure_run_folders(
        run_id
    )

    load_folder = get_run_load_folder(
        run_id
    )

    file_path = (
        load_folder
        / file.filename
    )

    contents = await file.read()

    with open(file_path, "wb") as buffer:
        buffer.write(contents)

    return {
        "message": "Load file uploaded successfully",
        "run_id": run_id,
        "file": file.filename,
    }


@app.post("/runs/{run_id}/upload/counters-file")
async def upload_run_counters_file(
    run_id: str,
    file: UploadFile = File(...),
):
    ensure_run_folders(
        run_id
    )

    counters_folder = get_run_counters_folder(
        run_id
    )

    file_path = (
        counters_folder
        / file.filename
    )

    contents = await file.read()

    with open(file_path, "wb") as buffer:
        buffer.write(contents)

    return {
        "message": "Counters file uploaded successfully",
        "run_id": run_id,
        "file": file.filename,
    }


# =========================
# ENDPOINTS LEGADOS POR RUN
# Mantidos para compatibilidade.
# Salvam como load.csv e counters.csv direto na pasta da run.
# =========================

@app.post("/runs/{run_id}/upload/load")
async def upload_run_load(
    run_id: str,
    file: UploadFile = File(...),
):
    run_folder = Path(
        f"uploads/{run_id}"
    )

    run_folder.mkdir(
        parents=True,
        exist_ok=True,
    )

    path = (
        run_folder
        / "load.csv"
    )

    contents = await file.read()

    with open(path, "wb") as buffer:
        buffer.write(contents)

    return {
        "message": "Load uploaded",
        "run_id": run_id,
    }


@app.post("/runs/{run_id}/upload/counters")
async def upload_run_counters(
    run_id: str,
    file: UploadFile = File(...),
):
    run_folder = Path(
        f"uploads/{run_id}"
    )

    run_folder.mkdir(
        parents=True,
        exist_ok=True,
    )

    path = (
        run_folder
        / "counters.csv"
    )

    contents = await file.read()

    with open(path, "wb") as buffer:
        buffer.write(contents)

    return {
        "message": "Counters uploaded",
        "run_id": run_id,
    }


# =========================
# DASHBOARD POR RUN
# Este endpoint lê vários arquivos:
# uploads/{run_id}/load/*.csv
# uploads/{run_id}/counters/*.csv
# =========================

@app.get("/dashboard/{run_id}")
def dashboard_by_run(
    run_id: str,
):
    try:
        actions = process_run_load_files(
            run_id
        )

        counters = process_run_counters_files(
            run_id
        )

        leaks = detect_run_memory_leaks(
            run_id
        )

        action_report = generate_action_report(
            actions
        )

        return {
            "summary": {
                "total_actions": len(actions),
                "total_counters": len(counters),
                "average_response_time": safe_average_response_time(
                    actions
                ),
                "max_response_time": safe_max_response_time(
                    actions
                ),
            },
            "actions": dataframe_to_clean_records(
                action_report
            ),
            "counters": dataframe_to_clean_records(
                counters
            ),
            "memory_leaks": leaks,
            "files": list_run_files(
                run_id
            ),
        }

    except Exception as error:
        return {
            "run_id": run_id,
            "error": str(error),
            "traceback": traceback.format_exc(),
        }


# =========================
# ACTIONS POR RUN - DETALHADO
# Diagnóstico incluído para descobrir o erro 500.
# =========================

@app.get("/reports/actions/{run_id}")
def actions_by_run(
    run_id: str,
):
    try:
        files_info = list_run_files(
            run_id
        )

        actions = process_run_load_files(
            run_id
        )

        if actions is None or actions.empty:
            return {
                "run_id": run_id,
                "message": "No load data generated from run files.",
                "files": files_info,
                "records": [],
            }

        report = generate_action_report(
            actions
        )

        return dataframe_to_clean_records(
            report
        )

    except Exception as error:
        return {
            "run_id": run_id,
            "error": str(error),
            "traceback": traceback.format_exc(),
        }


# =========================
# ACTIONS POR RUN - SUMMARY COMPILADO
# =========================

@app.get("/reports/actions/{run_id}/summary")
def actions_summary_by_run(
    run_id: str,
):
    try:
        actions = process_run_load_files(
            run_id
        )

        if actions is None or actions.empty:
            return {
                "run_id": run_id,
                "message": "No load data found for this run.",
                "details_count": 0,
                "summary_count": 0,
                "summary": [],
            }

        action_report = generate_action_report(
            actions
        )

        if action_report is None or action_report.empty:
            return {
                "run_id": run_id,
                "message": "Load files were found, but no action report was generated.",
                "details_count": 0,
                "summary_count": 0,
                "summary": [],
            }

        summary_report = generate_action_summary_report(
            action_report
        )

        return {
            "run_id": run_id,
            "message": "Summary generated successfully.",
            "details_count": len(action_report),
            "summary_count": len(summary_report),
            "summary": dataframe_to_clean_records(
                summary_report
            ),
        }

    except Exception as error:
        return {
            "run_id": run_id,
            "error": str(error),
            "traceback": traceback.format_exc(),
        }


# =========================
# COUNTERS POR RUN
# =========================

@app.get("/reports/counters/{run_id}")
def counters_by_run(
    run_id: str,
):
    try:
        report = process_run_counters_files(
            run_id
        )

        return dataframe_to_clean_records(
            report
        )

    except Exception as error:
        return {
            "run_id": run_id,
            "error": str(error),
            "traceback": traceback.format_exc(),
        }


# =========================
# MEMORY LEAKS POR RUN
# =========================

@app.get("/reports/memory-leaks/{run_id}")
def memory_leaks_by_run(
    run_id: str,
):
    try:
        return detect_run_memory_leaks(
            run_id
        )

    except Exception as error:
        return {
            "run_id": run_id,
            "error": str(error),
            "traceback": traceback.format_exc(),
        }

@app.get("/debug/run-load/{run_id}")
def debug_run_load(
    run_id: str,
):
    files_info = list_run_files(
        run_id
    )

    actions = process_run_load_files(
        run_id
    )

    action_report = generate_action_report(
        actions
    )

    return {
        "run_id": run_id,
        "files": files_info,
        "actions_rows": 0 if actions is None else len(actions),
        "actions_columns": [] if actions is None or actions.empty else list(actions.columns),
        "action_report_rows": 0 if action_report is None else len(action_report),
        "action_report_columns": [] if action_report is None or action_report.empty else list(action_report.columns),
        "action_report_sample": [] if action_report is None or action_report.empty else action_report.head(5).to_dict(
            orient="records"
        ),
    }

@app.get("/debug/run-load/{run_id}")
def debug_run_load(
    run_id: str,
):
    actions = process_run_load_files(
        run_id
    )

    if actions is None or actions.empty:
        return {
            "run_id": run_id,
            "message": "No load data returned by process_run_load_files.",
            "rows": 0,
            "columns": [],
            "sample": []
        }

    return {
        "run_id": run_id,
        "message": "Load data found.",
        "rows": len(actions),
        "columns": list(actions.columns),
        "sample": actions.head(5).to_dict(
            orient="records"
        )
    }