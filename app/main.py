from pathlib import Path

from fastapi import (
    FastAPI,
    UploadFile,
    File
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

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173"
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

    file_path = (
        f"uploads/{file.filename}"
    )

    with open(
        file_path,
        "wb"
    ) as buffer:

        buffer.write(
            await file.read()
        )

    load_data = process_load_file(
        file_path
    )

    report = generate_action_report(
        load_data
    )

    return report.to_dict(
        orient="records"
    )

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

    load_file = (
        f"uploads/{run_id}/load.csv"
    )

    counters_file = (
        f"uploads/{run_id}/counters.csv"
    )

    actions = process_load_file(
        load_file
    )

    counters = (
        process_counters_file(
            counters_file
        )
    )

    leaks = (
        detect_memory_leaks(
            counters_file
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

        "memory_leaks":
        leaks,

        "counters":
        counters.to_dict(
            orient="records"
        )
    }

# =========================
# ACTIONS POR RUN
# =========================

@app.get(
    "/reports/actions/{run_id}"
)
def actions_by_run(
    run_id: str
):

    actions = process_load_file(
        f"uploads/{run_id}/load.csv"
    )

    report = (
        generate_action_report(
            actions
        )
    )

    return report.to_dict(
        orient="records"
    )

# =========================
# COUNTERS POR RUN
# =========================

@app.get(
    "/reports/counters/{run_id}"
)
def counters_by_run(
    run_id: str
):

    report = process_counters_file(
        f"uploads/{run_id}/counters.csv"
    )

    return report.to_dict(
        orient="records"
    )