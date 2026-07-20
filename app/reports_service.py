import pandas as pd

from app.run_files_service import process_run_load_files
from app.kpi_service import get_all_kpis


def _safe_number(value, default=0):
    try:
        if value is None:
            return default

        number = float(value)

        if pd.isna(number):
            return default

        return number
    except Exception:
        return default


def _find_column(df, possible_names):
    for name in possible_names:
        if name in df.columns:
            return name

    lower_map = {
        str(column).strip().lower(): column
        for column in df.columns
    }

    for name in possible_names:
        key = str(name).strip().lower()

        if key in lower_map:
            return lower_map[key]

    return None


def _load_kpi_map():
    kpis = get_all_kpis()
    kpi_map = {}

    for item in kpis:
        action_name = (
            item.get("Action")
            or item.get("action")
            or item.get("action_name")
            or item.get("ActionName")
        )

        kpi_value = (
            item.get("KPI")
            or item.get("kpi")
            or item.get("kpi_ms")
            or item.get("Kpi")
        )

        enabled = item.get("Enabled", item.get("enabled", True))

        if action_name and enabled:
            kpi_map[str(action_name).strip()] = _safe_number(kpi_value)

    return kpi_map


def _build_action_hardware_summary(df):
    if df is None or df.empty:
        return pd.DataFrame()

    action_column = _find_column(
        df,
        [
            "Action",
            "ActionName",
            "action",
            "action_name",
        ],
    )

    hardware_column = _find_column(
        df,
        [
            "Hardware",
            "HardwareName",
            "Machine",
            "Device",
            "Client",
        ],
    )

    duration_column = _find_column(
        df,
        [
            "Duration",
            "Duration_ms",
            "DurationMS",
            "ResponseTime",
            "Response Time",
            "Elapsed",
        ],
    )

    if not action_column or not duration_column:
        return pd.DataFrame()

    if not hardware_column:
        df = df.copy()
        hardware_column = "Hardware"
        df[hardware_column] = "Unknown Hardware"

    df = df.copy()

    df[action_column] = df[action_column].astype(str).str.strip()
    df[hardware_column] = df[hardware_column].astype(str).str.strip()
    df[duration_column] = pd.to_numeric(
        df[duration_column],
        errors="coerce",
    )

    df = df.dropna(
        subset=[
            action_column,
            hardware_column,
            duration_column,
        ]
    )

    if df.empty:
        return pd.DataFrame()

    grouped = (
        df.groupby(
            [
                action_column,
                hardware_column,
            ],
            dropna=False,
        )[duration_column]
        .agg(
            total_quantity="count",
            min_value="min",
            max_value="max",
            average="mean",
            std_deviation="std",
            p50=lambda series: series.quantile(0.50),
            p90=lambda series: series.quantile(0.90),
        )
        .reset_index()
    )

    grouped = grouped.rename(
        columns={
            action_column: "Action",
            hardware_column: "Hardware",
        }
    )

    grouped["std_deviation"] = grouped["std_deviation"].fillna(0)

    return grouped


def _status_from_kpi(p90, kpi):
    p90_value = _safe_number(p90)
    kpi_value = _safe_number(kpi)

    if kpi_value <= 0:
        return "NO KPI"

    if p90_value <= kpi_value:
        return "PASS"

    return "FAIL"


def compare_reports(report_a: str, report_b: str):
    df_a = process_run_load_files(report_a)
    df_b = process_run_load_files(report_b)

    summary_a = _build_action_hardware_summary(df_a)
    summary_b = _build_action_hardware_summary(df_b)

    kpi_map = _load_kpi_map()

    if summary_a.empty and summary_b.empty:
        return {
            "report_a": report_a,
            "report_b": report_b,
            "records": [],
            "comparison": [],
            "total_actions": 0,
        }

    merged = pd.merge(
        summary_a,
        summary_b,
        on=[
            "Action",
            "Hardware",
        ],
        how="outer",
        suffixes=("_A", "_B"),
    )

    records = []

    for _, row in merged.iterrows():
        action = str(row.get("Action", "")).strip()
        hardware = str(row.get("Hardware", "")).strip()

        kpi = kpi_map.get(action, 0)

        p90_a = _safe_number(row.get("p90_A"))
        p90_b = _safe_number(row.get("p90_B"))

        difference_ms = p90_b - p90_a

        difference_percent = (
            ((p90_b - p90_a) / p90_a) * 100
            if p90_a > 0
            else 0
        )

        if difference_percent < 0:
            comparison_result = "Improved"
        elif difference_percent > 0:
            comparison_result = "Worse"
        else:
            comparison_result = "Same"

        record = {
            "Action": action,
            "Hardware": hardware,

            "KPI_A": kpi,
            "KPI_B": kpi,

            "Total Quantity_A": int(_safe_number(row.get("total_quantity_A"))),
            "Total Quantity_B": int(_safe_number(row.get("total_quantity_B"))),

            "Min_A": _safe_number(row.get("min_value_A")),
            "Min_B": _safe_number(row.get("min_value_B")),

            "Max_A": _safe_number(row.get("max_value_A")),
            "Max_B": _safe_number(row.get("max_value_B")),

            "Average_A": _safe_number(row.get("average_A")),
            "Average_B": _safe_number(row.get("average_B")),

            "Std Deviation_A": _safe_number(row.get("std_deviation_A")),
            "Std Deviation_B": _safe_number(row.get("std_deviation_B")),

            "50th Percentil_A": _safe_number(row.get("p50_A")),
            "50th Percentil_B": _safe_number(row.get("p50_B")),

            "90th Percentil_A": p90_a,
            "90th Percentil_B": p90_b,

            "Status_A": _status_from_kpi(p90_a, kpi),
            "Status_B": _status_from_kpi(p90_b, kpi),

            "Diff_ms": difference_ms,
            "Diff_Percent": difference_percent,

            "Result": comparison_result,
        }

        records.append(record)

    return {
        "report_a": report_a,
        "report_b": report_b,
        "records": records,
        "comparison": records,
        "total_actions": len(records),
    }

from app.run_service import get_runs
from app.run_files_service import get_run_metadata


def get_reports():
    reports = []

    for run in get_runs():

        if isinstance(run, dict):
            run_id = (
                run.get("run_id")
                or run.get("id")
                or run.get("name")
            )
        else:
            run_id = str(run)

        if not run_id:
            continue

        metadata = get_run_metadata(run_id)

        reports.append({
            "run_id": run_id,
            "version": metadata.get("version"),
            "build": metadata.get("build"),
            "suite": metadata.get("suite"),
            "environment": metadata.get("environment"),
            "date": metadata.get("date"),
        })

    reports.sort(
        key=lambda item: item.get("run_id", ""),
        reverse=True,
    )

    return reports