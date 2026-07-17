import pandas as pd

from app.run_service import get_runs

from app.run_files_service import (
    list_run_files,
    process_run_load_files,
)

from app.report_generator import (
    generate_action_report,
    generate_action_summary_report,
)


def dataframe_to_records(df):
    """
    Converts a Pandas DataFrame into JSON-safe records.
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


def get_reports():
    """
    Lists all user-facing reports.

    This function is used by:
    - GET /reports
    - ReportsList.jsx
    - CompareReportsPage.jsx

    It reads:
    - run folders from get_runs()
    - file counts from list_run_files()
    - metadata from uploads/{run_id}/metadata.json
    """

    reports = []

    runs = get_runs()

    for run in runs:
        run_id = run.get("id")

        if not run_id:
            continue

        files_info = list_run_files(
            run_id
        )

        metadata = files_info.get(
            "metadata",
            {},
        )

        load_files = files_info.get(
            "load_files",
            [],
        )

        counters_files = files_info.get(
            "counters_files",
            [],
        )

        load_count = len(load_files)
        counters_count = len(counters_files)

        status = (
            "Executed"
            if load_count > 0 or counters_count > 0
            else "Pending"
        )

        reports.append(
            {
                "run_id": run_id,

                # User-facing metadata
                "version": metadata.get(
                    "version",
                    "-",
                ),
                "build": metadata.get(
                    "build",
                    run_id,
                ),
                "suite": metadata.get(
                    "suite",
                    "-",
                ),
                "environment": metadata.get(
                    "environment",
                    "-",
                ),
                "date": metadata.get(
                    "date",
                    "-",
                ),
                "date_raw": metadata.get(
                    "date_raw",
                    "",
                ),

                # File information
                "load_files": load_count,
                "counters_files": counters_count,
                "has_processes_file": files_info.get(
                    "has_processes_file",
                    False,
                ),

                # Optional raw data for frontend/debug
                "files": {
                    "load": load_files,
                    "counters": counters_files,
                },
                "metadata": metadata,

                # Status used by list page
                "status": status,
            }
        )

    return reports


def get_report_summary(run_id):
    """
    Generates the same action summary used by ReportSummary.jsx.
    """

    actions = process_run_load_files(
        run_id
    )

    if actions is None or actions.empty:
        return {
            "run_id": run_id,
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
            "details_count": 0,
            "summary_count": 0,
            "summary": [],
        }

    summary_report = generate_action_summary_report(
        action_report
    )

    return {
        "run_id": run_id,
        "details_count": len(action_report),
        "summary_count": len(summary_report),
        "summary": dataframe_to_records(
            summary_report
        ),
    }


def compare_reports(
    report_a,
    report_b,
):
    """
    Compares two reports using their generated action summaries.
    """

    summary_a_result = get_report_summary(
        report_a
    )

    summary_b_result = get_report_summary(
        report_b
    )

    summary_a = summary_a_result.get(
        "summary",
        [],
    )

    summary_b = summary_b_result.get(
        "summary",
        [],
    )

    df_a = pd.DataFrame(
        summary_a
    )

    df_b = pd.DataFrame(
        summary_b
    )

    if df_a.empty or df_b.empty:
        return {
            "report_a": report_a,
            "report_b": report_b,
            "records": [],
            "message": "One or both reports do not have summary data.",
        }

    if "Action" not in df_a.columns or "Action" not in df_b.columns:
        return {
            "report_a": report_a,
            "report_b": report_b,
            "records": [],
            "message": "Action column not found in one or both summaries.",
        }

    merged = df_a.merge(
        df_b,
        on="Action",
        how="outer",
        suffixes=("_A", "_B"),
    )

    return {
        "report_a": report_a,
        "report_b": report_b,
        "records": dataframe_to_records(
            merged
        ),
    }