from pathlib import Path
from typing import Annotated

from fastapi import (
    FastAPI,
    UploadFile,
    File
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

from fastapi.middleware.cors import (
    CORSMiddleware
)

import pandas as pd

from app.load_parser import process_load_file

from app.report_generator import (
    generate_action_report
)

from app.counters_parser import (
    process_counters_file,
    detect_memory_leaks
)

from app.chart_service import (
    action_trend,
    memory_trend
)

from app.run_service import (
    get_runs,
    create_run
)

from app.kpi_service import (
    init_kpi_database,
    seed_default_kpis,
    get_all_kpis,
    upsert_kpi
)


app = FastAPI()

init_kpi_database()
seed_default_kpis()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174"
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
# UPLOADS TRADICIONAIS
# =========================

@app.post("/upload-load")
async def upload_load(
    file: UploadFile = File(...)
):
    uploads_folder = Path("uploads")

    uploads_folder.mkdir(
        parents=True,
        exist_ok=True
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
        "records": report.to_dict(
            orient="records"
        )
    }

@app.post("/upload-counters")
async def upload_counters(
    file: UploadFile = File(...)
):
    uploads_folder = Path("uploads")

    uploads_folder.mkdir(
        parents=True,
        exist_ok=True
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

    memory_leaks = detect_memory_leaks(
        str(file_path)
    )

    return {
        "message": "Counters file uploaded successfully",
        "file": "uploads/counters.csv",
        "counters": counters_report.to_dict(
            orient="records"
        ),
        "memory_leaks": memory_leaks
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
        "columns":
        list(df.columns)
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

        "total_actions":
        len(actions),

        "total_counters":
        len(counters),

        "average_response_time":
        float(
            actions["Duration"]
            .mean()
        ),

        "max_response_time":
        float(
            actions["Duration"]
            .max()
        )
    }

@app.get("/dashboard/full")
def full_dashboard():

    actions = process_load_file(
        "uploads/load.csv"
    )

    action_report = (
        generate_action_report(
            actions
        )
    )

    counters_report = (
        process_counters_file(
            "uploads/counters.csv"
        )
    )

    memory_leaks = (
        detect_memory_leaks(
            "uploads/counters.csv"
        )
    )

    return {

        "summary": {

            "total_actions":
            len(actions),

            "average_response_time":
            float(
                actions["Duration"]
                .mean()
            ),

            "max_response_time":
            float(
                actions["Duration"]
                .max()
            )
        },

        "actions":
        action_report.to_dict(
            orient="records"
        ),

        "counters":
        counters_report.to_dict(
            orient="records"
        ),

        "memory_leaks":
        memory_leaks
    }

# =========================
# REPORTS DEFAULT
# =========================

@app.get("/reports/actions")
def actions_report():

    load_data = process_load_file(
        "uploads/load.csv"
    )

    report = (
        generate_action_report(
            load_data
        )
    )

    return report.to_dict(
        orient="records"
    )

@app.get("/reports/counters")
def counters_report():

    report = process_counters_file(
        "uploads/counters.csv"
    )

    return report.to_dict(
        orient="records"
    )

@app.get("/reports/memory-leaks")
def memory_leaks():

    return detect_memory_leaks(
        "uploads/counters.csv"
    )

# =========================
# CHARTS
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
# RUNS
# =========================

@app.get("/runs")
def list_runs():

    return get_runs()

@app.post("/runs/create")
def create_new_run():

    run_id = create_run()

    return {
        "run_id": run_id
    }

# =========================
# UPLOAD LOAD POR RUN
# =========================

@app.post(
    "/runs/{run_id}/upload/load"
)
async def upload_run_load(
    run_id: str,
    file: UploadFile
):

    run_folder = Path(
        f"uploads/{run_id}"
    )

    run_folder.mkdir(
        parents=True,
        exist_ok=True
    )

    path = (
        run_folder
        / "load.csv"
    )

    contents = await file.read()

    with open(path, "wb") as f:
        f.write(contents)

    return {

        "message":
        "Load uploaded",

        "run_id":
        run_id
    }

# =========================
# UPLOAD COUNTERS POR RUN
# =========================

@app.post(
    "/runs/{run_id}/upload/counters"
)
async def upload_run_counters(
    run_id: str,
    file: UploadFile
):

    run_folder = Path(
        f"uploads/{run_id}"
    )

    run_folder.mkdir(
        parents=True,
        exist_ok=True
    )

    path = (
        run_folder
        / "counters.csv"
    )

    contents = await file.read()

    with open(path, "wb") as f:
        f.write(contents)

    return {

        "message":
        "Counters uploaded",

        "run_id":
        run_id
    }

# =========================
# DASHBOARD POR RUN
# =========================

@app.get("/dashboard/{run_id}")
def dashboard_by_run(
    run_id: str
):
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

    average_response_time = 0
    max_response_time = 0

    if actions is not None and not actions.empty:
        if "Duration" in actions.columns:
            average_response_time = float(
                actions["Duration"].mean()
            )

            max_response_time = float(
                actions["Duration"].max()
            )

    return {
        "summary": {
            "total_actions": len(actions),
            "total_counters": len(counters),
            "average_response_time": average_response_time,
            "max_response_time": max_response_time,
        },
        "actions": action_report.to_dict(
            orient="records"
        ),
        "counters": counters.to_dict(
            orient="records"
        ),
        "memory_leaks": leaks,
        "files": list_run_files(
            run_id
        ),
    }

# =========================
# ACTIONS POR RUN
# =========================

@app.get("/reports/actions/{run_id}")
def actions_by_run(
    run_id: str
):
    actions = process_run_load_files(
        run_id
    )

    report = generate_action_report(
        actions
    )

    return report.to_dict(
        orient="records"
    )

# =========================
# COUNTERS POR RUN
# =========================

@app.get("/reports/counters/{run_id}")
def counters_by_run(
    run_id: str
):
    report = process_run_counters_files(
        run_id
    )

    return report.to_dict(
        orient="records"
    )


# =========================
# KPIS
# =========================

@app.get("/kpis")
def list_kpis():
    return get_all_kpis()


@app.post("/kpis")
def save_kpi(action_name: str, kpi_ms: float):
    upsert_kpi(action_name, kpi_ms)

    return {
        "message": "KPI saved successfully",
        "Action": action_name,
        "KPI": kpi_ms
    }

@app.get("/runs/{run_id}/files")
def get_files_by_run(
    run_id: str
):
    return list_run_files(
        run_id
    )

@app.post("/runs/{run_id}/upload/load-file")
async def upload_run_load_file(
    run_id: str,
    file: UploadFile = File(...)
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
    file: UploadFile = File(...)
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

@app.get("/reports/memory-leaks/{run_id}")
def memory_leaks_by_run(
    run_id: str
):
    return detect_run_memory_leaks(
        run_id
    )