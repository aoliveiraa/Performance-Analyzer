from pathlib import Path
import traceback
import json
import pandas as pd

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# =========================
# SERVICES
# =========================
from app.kpi_service import (
    init_kpi_database,
    seed_default_kpis,
    get_all_kpis,
    upsert_kpi,
    get_kpi_category,
    get_categories,
    update_kpi,
)

from app.processes_service import extract_processes_from_json

from app.load_parser import process_load_file

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

from app.run_files_service import (
    ensure_run_folders,
    get_run_load_folder,
    get_run_counters_folder,
    list_run_files,
    process_run_load_files,
    process_run_counters_files,
    detect_run_memory_leaks,
    save_run_metadata_from_filename,
    save_processes_json,
    load_processes_json,
)

from app.reports_service import (
    get_reports,
    compare_reports,
)

# =========================
# APP
# =========================

app = FastAPI(
    title="Performance Analyzer API",
    version="1.0.0",
)

# =========================
# INIT DB
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
# MODELS
# =========================

class KpiUpdate(BaseModel):
    action_name: str
    category: str
    enabled: bool

# =========================
# HELPERS
# =========================

def dataframe_to_clean_records(df):
    if df is None or df.empty:
        return []

    clean_df = df.copy()
    clean_df = clean_df.replace([float("inf"), float("-inf")], None)
    clean_df = clean_df.astype(object).where(pd.notnull(clean_df), None)

    return clean_df.to_dict(orient="records")


def safe_average_response_time(actions):
    if actions is None or actions.empty:
        return 0

    if "Duration" not in actions.columns:
        return 0

    values = pd.to_numeric(actions["Duration"], errors="coerce").dropna()

    return float(values.mean()) if not values.empty else 0


def safe_max_response_time(actions):
    if actions is None or actions.empty:
        return 0

    if "Duration" not in actions.columns:
        return 0

    values = pd.to_numeric(actions["Duration"], errors="coerce").dropna()

    return float(values.max()) if not values.empty else 0


def build_error_response(context, error, extra=None):
    response = {
        "context": context,
        "error": str(error),
        "traceback": traceback.format_exc(),
    }

    if extra:
        response.update(extra)

    return response

# =========================
# HEALTH
# =========================

@app.get("/health")
def health():
    return {"status": "UP"}

# =========================
# KPI ENDPOINTS ✅
# =========================

@app.get("/kpis")
def list_kpis():
    return get_all_kpis()


@app.get("/kpis/categories")
def list_categories():
    return get_categories()


@app.post("/kpis")
def save_kpi(
    action_name: str,
    kpi_ms: float,
    category: str = "Other KPIs",
):
    upsert_kpi(
        action_name,
        kpi_ms,
        category,
    )

    return {
        "message": "KPI saved",
        "Action": action_name,
        "Category": category,
    }


@app.put("/kpis")
def update_kpi_endpoint(request: KpiUpdate):
    update_kpi(
        action_name=request.action_name,
        category=request.category,
        enabled=request.enabled,
    )
    return {"success": True}

# =========================
# RUNS / REPORTS
# =========================

@app.get("/runs")
def list_runs():
    return get_runs()


@app.post("/runs/create")
def create_new_run():
    run_id = create_run()
    ensure_run_folders(run_id)
    return {"run_id": run_id}


@app.delete("/runs/{run_id}")
def remove_run(run_id: str):
    return delete_run(run_id)


@app.get("/reports")
def reports():
    return get_reports()

@app.get("/runs/{run_id}/files")
def get_files_by_run(
    run_id: str,
):
    return list_run_files(
        run_id
    )

@app.get("/reports/compare")
def compare_reports_endpoint(report_a: str, report_b: str):
    try:
        return compare_reports(report_a, report_b)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=build_error_response("compare", e),
        )

# =========================
# UPLOADS
# =========================

@app.post("/runs/{run_id}/upload/load-file")
async def upload_load(run_id: str, file: UploadFile = File(...)):
    ensure_run_folders(run_id)

    path = get_run_load_folder(run_id) / file.filename

    contents = await file.read()
    with open(path, "wb") as f:
        f.write(contents)

    save_run_metadata_from_filename(run_id, file.filename)

    return {"message": "Load uploaded", "run_id": run_id}


@app.post("/runs/{run_id}/upload/counters-file")
async def upload_counters(run_id: str, file: UploadFile = File(...)):
    ensure_run_folders(run_id)

    path = get_run_counters_folder(run_id) / file.filename

    contents = await file.read()
    with open(path, "wb") as f:
        f.write(contents)

    save_run_metadata_from_filename(run_id, file.filename)

    return {"message": "Counters uploaded", "run_id": run_id}

# =========================
# SUMMARY (CRÍTICO)
# =========================

@app.get("/reports/actions/{run_id}/summary")
def actions_summary_by_run(run_id: str):
    try:
        actions = process_run_load_files(run_id)

        if actions is None or actions.empty:
            return {
                "run_id": run_id,
                "summary": [],
            }

        report = generate_action_report(
            actions
        )

        summary = generate_action_summary_report(
            report
        )

        # ====================================================
        # Filter only Market 0 KPIs
        # ====================================================

        if summary is not None and not summary.empty:

            summary["Category"] = summary["Action"].apply(
                lambda action: get_kpi_category(action)
            )

            summary = summary[
                summary["Category"] == "Market 0 KPIs"
            ]

            summary = summary.drop(
                columns=["Category"],
                errors="ignore",
            )

        return {
            "run_id": run_id,
            "summary": dataframe_to_clean_records(
                summary
            ),
        }

    except Exception as error:
        return build_error_response(
            "summary",
            error,
        )
    
@app.get("/reports/actions/{run_id}")
def actions_by_run(
    run_id: str,
    market0_only: bool = True,
):
    try:
        actions = process_run_load_files(
            run_id
        )

        if actions is None or actions.empty:
            return []

        report = generate_action_report(
            actions
        )

        if (
            market0_only
            and report is not None
            and not report.empty
        ):

            report["Category"] = report["Action"].apply(
                lambda action: get_kpi_category(action)
            )

            report = report[
                report["Category"] == "Market 0 KPIs"
            ]

            report = report.drop(
                columns=["Category"],
                errors="ignore",
            )

        return dataframe_to_clean_records(
            report
        )

    except Exception as error:
        return build_error_response(
            "reports/actions",
            error,
            {
                "run_id": run_id,
            },
        )
# =========================
# CHARTS
# =========================

@app.get("/charts/status/{run_id}")
def chart_status(run_id: str):
    try:
        actions = process_run_load_files(run_id)
        report = generate_action_report(actions)

        return {
            "PASS": len(report[report["Status"] == "PASS"]),
            "FAIL": len(report[report["Status"] == "FAIL"]),
            "NO KPI": len(report[report["Status"] == "NO KPI"]),
        }

    except Exception as e:
        return build_error_response("charts/status", e)

@app.get("/charts/actions/{run_id}")
def chart_actions(run_id: str):
    try:
        actions = process_run_load_files(run_id)

        if actions is None or actions.empty:
            return []

        report = generate_action_summary_report(
            generate_action_report(actions)
        )

        return dataframe_to_clean_records(report)

    except Exception as error:
        return build_error_response(
            "charts/actions",
            error,
        )
    

@app.get("/charts/performance-counters/{run_id}")
def chart_performance_counters_by_run(run_id: str):
    try:
        return get_performance_counters_trend_by_run(
            run_id
        )
    except Exception as error:
        return build_error_response(
            "charts/performance-counters",
            error,
        )

@app.get("/charts/top-memory/{run_id}")
def chart_top_memory_by_run(run_id: str):
    try:
        return get_top_memory_consumers_by_run(
            run_id
        )
    except Exception as error:
        return build_error_response(
            "charts/top-memory",
            error,
        )