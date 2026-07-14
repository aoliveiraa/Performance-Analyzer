from app.run_service import get_runs
from app.run_files_service import (
    list_run_files,
    process_run_load_files,
)

from app.report_generator import (
    generate_action_report,
    generate_action_summary_report,
)


def get_reports():
    reports = []

    runs = get_runs()

    for run in runs:
        run_id = run.get("id")

        try:
            files_info = list_run_files(
                run_id
            )

            metadata = files_info.get(
                "metadata",
                {}
            )

            load_files = files_info.get(
                "load_files",
                []
            )

            counters_files = files_info.get(
                "counters_files",
                []
            )

            total_files = (
                len(load_files)
                + len(counters_files)
            )

            reports.append(
                {
                    "run_id": run_id,

                    "version":
                        metadata.get(
                            "version",
                            "-"
                        ),

                    "build":
                        metadata.get(
                            "build",
                            "-"
                        ),

                    "suite":
                        metadata.get(
                            "suite",
                            "-"
                        ),

                    "environment":
                        metadata.get(
                            "environment",
                            "-"
                        ),

                    "date":
                        metadata.get(
                            "date",
                            "-"
                        ),

                    "status":
                        (
                            "Executed"
                            if total_files > 0
                            else "Pending"
                        ),

                    "load_count":
                        len(load_files),

                    "counters_count":
                        len(counters_files),

                    "total_files":
                        total_files,
                }
            )

        except Exception as error:
            print(
                f"[REPORTS] Error processing {run_id}: {error}"
            )

    reports.sort(
        key=lambda report: report["run_id"],
        reverse=True,
    )

    return reports


def dataframe_to_records(df):
    """
    Converts dataframe into JSON records.
    """

    if df is None or df.empty:
        return []

    clean_df = df.copy()

    clean_df = clean_df.where(
        clean_df.notnull(),
        None
    )

    return clean_df.to_dict(
        orient="records"
    )


def get_report_summary(run_id):
    """
    Generates the same summary used by ReportSummary.jsx.
    """

    load_data = process_run_load_files(
        run_id
    )

    if load_data is None or load_data.empty:
        return []

    action_report = generate_action_report(
        load_data
    )

    if action_report is None or action_report.empty:
        return []

    summary_report = (
        generate_action_summary_report(
            action_report
        )
    )

    return dataframe_to_records(
        summary_report
    )


def compare_reports(
    report_a,
    report_b,
):
    """
    Compares two reports using the
    generated action summary.
    """

    summary_a = get_report_summary(
        report_a
    )

    summary_b = get_report_summary(
        report_b
    )

    indexed_a = {}
    indexed_b = {}

    for row in summary_a:
        action = row.get("Action")

        if action:
            indexed_a[action] = row

    for row in summary_b:
        action = row.get("Action")

        if action:
            indexed_b[action] = row

    all_actions = sorted(
        set(indexed_a.keys())
        |
        set(indexed_b.keys())
    )

    comparison = []

    for action in all_actions:

        a = indexed_a.get(
            action,
            {}
        )

        b = indexed_b.get(
            action,
            {}
        )

        p90_a = a.get(
            "90th Percentil"
        )

        p90_b = b.get(
            "90th Percentil"
        )

        difference_ms = None
        difference_percent = None
        result = "N/A"

        try:

            if (
                p90_a is not None
                and p90_b is not None
            ):
                difference_ms = (
                    float(p90_b)
                    - float(p90_a)
                )

                if float(p90_a) != 0:
                    difference_percent = round(
                        (
                            difference_ms
                            / float(p90_a)
                        )
                        * 100,
                        2,
                    )

                if difference_ms < 0:
                    result = "Improved"

                elif difference_ms > 0:
                    result = "Worse"

                else:
                    result = "Same"

        except Exception:
            pass

        comparison.append(
            {
                "action": action,

                "kpi":
                    a.get("KPI")
                    or b.get("KPI"),

                "report_a": {
                    "run_id": report_a,
                    "p90": p90_a,
                    "status":
                        a.get(
                            "Status"
                        ),
                },

                "report_b": {
                    "run_id": report_b,
                    "p90": p90_b,
                    "status":
                        b.get(
                            "Status"
                        ),
                },

                "difference_ms":
                    difference_ms,

                "difference_percent":
                    difference_percent,

                "result":
                    result,
            }
        )

    return {
        "report_a": report_a,
        "report_b": report_b,
        "comparison": comparison,
        "total_actions": len(
            comparison
        ),
    }