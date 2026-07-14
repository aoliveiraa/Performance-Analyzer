from pathlib import Path
import traceback

import pandas as pd

from fastapi import (
    FastAPI,
    UploadFile,
    File,
)

from fastapi.middleware.cors import (
    CORSMiddleware,
)

from app.processes_service import (
    extract_processes_from_json,
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
    get_memory_trend_by_run,
    get_cpu_trend_by_run,
    get_top_memory_consumers_by_run,
    get_performance_counters_trend_by_run,
)

from app.run_service import (
    get_runs,
    create_run,
    delete_run,
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
    save_run_metadata_from_filename,
)

from app.reports_service import (
    get_reports,
    compare_reports,
)


# ============================================================
# APP CONFIGURATION
# ============================================================

app = FastAPI(
    title="Performance Analyzer API",
    description="Backend API for Performance Analyzer reports, KPIs, charts and comparisons.",
    version="1.0.0",
)


# ============================================================
# DATABASE INITIALIZATION
# ============================================================
# Initializes the KPI database and seeds default KPI values.
# This keeps the application ready to calculate PASS/FAIL results.

init_kpi_database()
seed_default_kpis()


# ============================================================
# CORS CONFIGURATION
# ============================================================
# Allows the React frontend running on Vite ports to call the backend.

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


# ============================================================
# HELPERS
# ============================================================

def dataframe_to_clean_records(df):
    """
    Converts a Pandas DataFrame into JSON-safe records.

    This prevents FastAPI serialization errors caused by:
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
        None,
    )

    clean_df = clean_df.astype(object).where(
        pd.notnull(clean_df),
        None,
    )

    return clean_df.to_dict(
        orient="records"
    )


def safe_average_response_time(actions):
    """
    Safely calculates the average response time from a DataFrame.
    """

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
    """
    Safely calculates the maximum response time from a DataFrame.
    """

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


def build_error_response(
    context: str,
    error: Exception,
    extra_data: dict | None = None,
):
    """
    Standard error response used by endpoints.

    The traceback is returned intentionally because this project is still
    under development and debugging from the frontend/Swagger is useful.
    """

    response = {
        "context": context,
        "error": str(error),
        "traceback": traceback.format_exc(),
    }

    if extra_data:
        response.update(extra_data)

    return response


# ============================================================
# HEALTH
# ============================================================

@app.get("/health")
def health():
    """
    Health check endpoint used to confirm that the backend is running.
    """

    return {
        "status": "UP"
    }


# ============================================================
# DEFAULT UPLOAD ENDPOINTS
# ============================================================
# These endpoints are kept for the original single-file flow.
# New report-based flow uses /runs/{run_id}/upload/*.

@app.post("/upload-load")
async def upload_load(
    file: UploadFile = File(...),
):
    """
    Uploads a default Load CSV file to uploads/load.csv.
    """

    uploads_folder = Path("uploads")

    uploads_folder.mkdir(
        parents=True,
        exist_ok=True,
    )

    file_path = uploads_folder / "load.csv"

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
    """
    Uploads a default Counters CSV file to uploads/counters.csv.
    """

    uploads_folder = Path("uploads")

    uploads_folder.mkdir(
        parents=True,
        exist_ok=True,
    )

    file_path = uploads_folder / "counters.csv"

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


# ============================================================
# DEFAULT DASHBOARD ENDPOINTS
# ============================================================
# These endpoints use the default local files:
# uploads/load.csv
# uploads/counters.csv

@app.get("/dashboard")
def dashboard():
    """
    Returns a simple dashboard using default uploaded files.
    """

    try:
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

    except Exception as error:
        return build_error_response(
            "dashboard",
            error,
        )


@app.get("/dashboard/full")
def full_dashboard():
    """
    Returns the original full dashboard using default uploaded files.
    """

    try:
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

    except Exception as error:
        return build_error_response(
            "dashboard/full",
            error,
        )


# ============================================================
# DEFAULT REPORT ENDPOINTS
# ============================================================
# These endpoints use the original default files and are kept
# for compatibility with the older dashboard.

@app.get("/reports/actions")
def actions_report():
    """
    Returns the action report from uploads/load.csv.
    """

    try:
        load_data = process_load_file(
            "uploads/load.csv"
        )

        report = generate_action_report(
            load_data
        )

        return dataframe_to_clean_records(
            report
        )

    except Exception as error:
        return build_error_response(
            "reports/actions",
            error,
        )


@app.get("/reports/counters")
def counters_report():
    """
    Returns the counters report from uploads/counters.csv.
    """

    try:
        report = process_counters_file(
            "uploads/counters.csv"
        )

        return dataframe_to_clean_records(
            report
        )

    except Exception as error:
        return build_error_response(
            "reports/counters",
            error,
        )


@app.get("/reports/memory-leaks")
def memory_leaks():
    """
    Returns possible memory leak indicators from uploads/counters.csv.
    """

    try:
        return detect_memory_leaks(
            "uploads/counters.csv"
        )

    except Exception as error:
        return build_error_response(
            "reports/memory-leaks",
            error,
        )


# ============================================================
# DEFAULT CHART ENDPOINTS
# ============================================================

@app.get("/charts/action-trend")
def get_action_trend():
    """
    Returns the original action trend chart data.
    """

    try:
        return action_trend(
            "uploads/load.csv"
        )

    except Exception as error:
        return build_error_response(
            "charts/action-trend",
            error,
        )


@app.get("/charts/memory-trend")
def get_memory_trend():
    """
    Returns the original memory trend chart data.
    """

    try:
        return memory_trend(
            "uploads/counters.csv"
        )

    except Exception as error:
        return build_error_response(
            "charts/memory-trend",
            error,
        )


# ============================================================
# KPI ENDPOINTS
# ============================================================

@app.get("/kpis")
def list_kpis():
    """
    Lists all registered KPIs.
    """

    return get_all_kpis()


@app.post("/kpis")
def save_kpi(
    action_name: str,
    kpi_ms: float,
):
    """
    Creates or updates a KPI value for an action.
    """

    upsert_kpi(
        action_name,
        kpi_ms,
    )

    return {
        "message": "KPI saved successfully",
        "Action": action_name,
        "KPI": kpi_ms,
    }


# ============================================================
# REPORTS / RUNS ENDPOINTS
# ============================================================
# Important:
# There must be only ONE /reports endpoint.
# This avoids route duplication and fixes the Compare page loading issue.

@app.get("/runs")
def list_runs():
    """
    Lists all technical run folders.
    """

    return get_runs()


@app.get("/reports")
def reports():
    """
    Lists all user-facing reports with metadata.

    This endpoint is used by:
    - ReportsList.jsx
    - CompareReportsPage.jsx
    """

    return get_reports()


@app.get("/reports/compare")
def compare_reports_endpoint(
    report_a: str,
    report_b: str,
):
    """
    Compares KPI summaries between two reports.

    The comparison is based on the report/run IDs received from the frontend.
    """

    try:
        return compare_reports(
            report_a,
            report_b,
        )

    except Exception as error:
        return build_error_response(
            "reports/compare",
            error,
            {
                "report_a": report_a,
                "report_b": report_b,
            },
        )


@app.post("/runs/create")
def create_new_run():
    """
    Creates a new run/report folder.
    """

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
    """
    Lists files and metadata for a specific run.
    """

    return list_run_files(
        run_id
    )


@app.delete("/runs/{run_id}")
def remove_run(
    run_id: str,
):
    """
    Deletes a run/report folder.
    """

    return delete_run(
        run_id
    )


# ============================================================
# RUN FILE UPLOAD ENDPOINTS
# ============================================================
# These are the main upload endpoints used by RunUploadPanel.jsx.
# The frontend uploads multiple files one by one.

@app.post("/runs/{run_id}/upload/load-file")
async def upload_run_load_file(
    run_id: str,
    file: UploadFile = File(...),
):
    """
    Uploads one Load CSV file into:
    uploads/{run_id}/load/
    """

    ensure_run_folders(
        run_id
    )

    load_folder = get_run_load_folder(
        run_id
    )

    file_path = load_folder / file.filename

    contents = await file.read()

    with open(file_path, "wb") as buffer:
        buffer.write(contents)

    save_run_metadata_from_filename(
        run_id,
        file.filename,
    )

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
    """
    Uploads one Counters CSV file into:
    uploads/{run_id}/counters/
    """

    ensure_run_folders(
        run_id
    )

    counters_folder = get_run_counters_folder(
        run_id
    )

    file_path = counters_folder / file.filename

    contents = await file.read()

    with open(file_path, "wb") as buffer:
        buffer.write(contents)

    save_run_metadata_from_filename(
        run_id,
        file.filename,
    )

    return {
        "message": "Counters file uploaded successfully",
        "run_id": run_id,
        "file": file.filename,
    }


# ============================================================
# LEGACY RUN UPLOAD ENDPOINTS
# ============================================================
# Kept for compatibility.
# These save files directly as load.csv and counters.csv
# inside uploads/{run_id}/.

@app.post("/runs/{run_id}/upload/load")
async def upload_run_load(
    run_id: str,
    file: UploadFile = File(...),
):
    """
    Legacy endpoint for uploading a single load.csv file to a run folder.
    """

    run_folder = Path(
        f"uploads/{run_id}"
    )

    run_folder.mkdir(
        parents=True,
        exist_ok=True,
    )

    path = run_folder / "load.csv"

    contents = await file.read()

    with open(path, "wb") as buffer:
        buffer.write(contents)

    save_run_metadata_from_filename(
        run_id,
        file.filename,
    )

    return {
        "message": "Load uploaded",
        "run_id": run_id,
    }


@app.post("/runs/{run_id}/upload/counters")
async def upload_run_counters(
    run_id: str,
    file: UploadFile = File(...),
):
    """
    Legacy endpoint for uploading a single counters.csv file to a run folder.
    """

    run_folder = Path(
        f"uploads/{run_id}"
    )

    run_folder.mkdir(
        parents=True,
        exist_ok=True,
    )

    path = run_folder / "counters.csv"

    contents = await file.read()

    with open(path, "wb") as buffer:
        buffer.write(contents)

    save_run_metadata_from_filename(
        run_id,
        file.filename,
    )

    return {
        "message": "Counters uploaded",
        "run_id": run_id,
    }


# ============================================================
# DASHBOARD BY RUN
# ============================================================

@app.get("/dashboard/{run_id}")
def dashboard_by_run(
    run_id: str,
):
    """
    Returns dashboard data for a specific run.

    Reads:
    - uploads/{run_id}/load/*.csv
    - uploads/{run_id}/counters/*.csv
    """

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
        return build_error_response(
            "dashboard/{run_id}",
            error,
            {
                "run_id": run_id,
            },
        )


# ============================================================
# ACTION REPORTS BY RUN
# ============================================================

@app.get("/reports/actions/{run_id}")
def actions_by_run(
    run_id: str,
):
    """
    Returns detailed action report grouped by Hardware + Action.
    """

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
        return build_error_response(
            "reports/actions/{run_id}",
            error,
            {
                "run_id": run_id,
            },
        )


@app.get("/reports/actions/{run_id}/summary")
def actions_summary_by_run(
    run_id: str,
):
    """
    Returns compiled action summary grouped by Action.

    This endpoint is used by ReportSummary.jsx.
    """

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
        return build_error_response(
            "reports/actions/{run_id}/summary",
            error,
            {
                "run_id": run_id,
            },
        )


# ============================================================
# COUNTERS AND MEMORY LEAKS BY RUN
# ============================================================

@app.get("/reports/counters/{run_id}")
def counters_by_run(
    run_id: str,
):
    """
    Returns counters report for a specific run.
    """

    try:
        report = process_run_counters_files(
            run_id
        )

        return dataframe_to_clean_records(
            report
        )

    except Exception as error:
        return build_error_response(
            "reports/counters/{run_id}",
            error,
            {
                "run_id": run_id,
            },
        )


@app.get("/reports/memory-leaks/{run_id}")
def memory_leaks_by_run(
    run_id: str,
):
    """
    Returns memory leak indicators for a specific run.
    """

    try:
        return detect_run_memory_leaks(
            run_id
        )

    except Exception as error:
        return build_error_response(
            "reports/memory-leaks/{run_id}",
            error,
            {
                "run_id": run_id,
            },
        )


# ============================================================
# DEBUG ENDPOINTS
# ============================================================

@app.get("/debug/run-load/{run_id}")
def debug_run_load(
    run_id: str,
):
    """
    Debug endpoint to inspect loaded run data and generated action report.
    """

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
                "message": "No load data returned by process_run_load_files.",
                "files": files_info,
                "rows": 0,
                "columns": [],
                "sample": [],
            }

        action_report = generate_action_report(
            actions
        )

        return {
            "run_id": run_id,
            "message": "Load data found.",
            "files": files_info,
            "rows": len(actions),
            "columns": list(actions.columns),
            "sample": dataframe_to_clean_records(
                actions.head(5)
            ),
            "action_report_rows": (
                0
                if action_report is None
                else len(action_report)
            ),
            "action_report_columns": (
                []
                if action_report is None or action_report.empty
                else list(action_report.columns)
            ),
            "action_report_sample": (
                []
                if action_report is None or action_report.empty
                else dataframe_to_clean_records(
                    action_report.head(5)
                )
            ),
        }

    except Exception as error:
        return build_error_response(
            "debug/run-load/{run_id}",
            error,
            {
                "run_id": run_id,
            },
        )


# ============================================================
# CHARTS BY RUN
# ============================================================

@app.get("/charts/actions/{run_id}")
def chart_actions(
    run_id: str,
):
    """
    Returns action chart data for a specific run.
    """

    try:
        actions = process_run_load_files(
            run_id
        )

        report = generate_action_report(
            actions
        )

        return dataframe_to_clean_records(
            report
        )

    except Exception as error:
        return build_error_response(
            "charts/actions/{run_id}",
            error,
            {
                "run_id": run_id,
            },
        )


@app.get("/charts/status/{run_id}")
def chart_status(
    run_id: str,
):
    """
    Returns PASS / FAIL / NO KPI distribution for a specific run.
    """

    try:
        actions = process_run_load_files(
            run_id
        )

        report = generate_action_report(
            actions
        )

        if report is None or report.empty:
            return {
                "PASS": 0,
                "FAIL": 0,
                "NO KPI": 0,
            }

        total_pass = len(
            report[report["Status"] == "PASS"]
        )

        total_fail = len(
            report[report["Status"] == "FAIL"]
        )

        total_nokpi = len(
            report[report["Status"] == "NO KPI"]
        )

        return {
            "PASS": total_pass,
            "FAIL": total_fail,
            "NO KPI": total_nokpi,
        }

    except Exception as error:
        return build_error_response(
            "charts/status/{run_id}",
            error,
            {
                "run_id": run_id,
            },
        )


@app.get("/charts/memory/{run_id}")
def chart_memory_by_run(
    run_id: str,
):
    """
    Returns memory trend data for a specific run.
    """

    try:
        return get_memory_trend_by_run(
            run_id
        )

    except Exception as error:
        return build_error_response(
            "charts/memory/{run_id}",
            error,
            {
                "run_id": run_id,
            },
        )


@app.get("/charts/cpu/{run_id}")
def chart_cpu_by_run(
    run_id: str,
):
    """
    Returns CPU trend data for a specific run.
    """

    try:
        return get_cpu_trend_by_run(
            run_id
        )

    except Exception as error:
        return build_error_response(
            "charts/cpu/{run_id}",
            error,
            {
                "run_id": run_id,
            },
        )


@app.get("/charts/top-memory/{run_id}")
def chart_top_memory_by_run(
    run_id: str,
):
    """
    Returns top memory consumers for a specific run.
    """

    try:
        return get_top_memory_consumers_by_run(
            run_id
        )

    except Exception as error:
        return build_error_response(
            "charts/top-memory/{run_id}",
            error,
            {
                "run_id": run_id,
            },
        )


@app.get("/charts/performance-counters/{run_id}")
def chart_performance_counters_by_run(
    run_id: str,
):
    """
    Returns fixed performance counters trend data for a specific run.

    Includes:
    - Private Bytes
    - Working Set
    - Handle Count
    - Thread Count
    - IO Read Bytes/sec
    - IO Write Bytes/sec
    - % Processor Time
    """

    try:
        return get_performance_counters_trend_by_run(
            run_id
        )

    except Exception as error:
        return build_error_response(
            "charts/performance-counters/{run_id}",
            error,
            {
                "run_id": run_id,
            },
        )


# ============================================================
# PROCESSES
# ============================================================

@app.post("/processes/upload")
async def upload_processes_json(
    file: UploadFile = File(...),
):
    """
    Uploads a JSON file and extracts process information.
    """

    try:
        content = (
            await file.read()
        ).decode(
            "utf-8",
            errors="ignore",
        )

        return extract_processes_from_json(
            content
        )

    except Exception as error:
        return build_error_response(
            "processes/upload",
            error,
        )


# ============================================================
# TEST / INSPECTION ENDPOINTS
# ============================================================

@app.get("/test-counters")
def test_counters():
    """
    Returns the columns from uploads/counters.csv.
    Useful for validating CSV structure.
    """

    try:
        df = pd.read_csv(
            "uploads/counters.csv"
        )

        return {
            "columns": list(df.columns)
        }

    except Exception as error:
        return build_error_response(
            "test-counters",
            error,
        )