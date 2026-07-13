import pandas as pd

from app.kpi_service import get_kpi


def generate_action_report(load_data):
    """
    Generate action performance report grouped by Hardware and Action.

    Values are kept in milliseconds.
    KPI is loaded from SQLite database using the action name.

    PASS/FAIL rule:
    - PASS when 90th Percentil <= KPI
    - FAIL when 90th Percentil > KPI
    - NO KPI when KPI is not registered
    """

    columns = [
        "Hardware",
        "Action",
        "KPI",
        "Total Quantity",
        "Above KPI",
        "Min",
        "Max",
        "Average",
        "Std Deviation",
        "50th Percentil",
        "90th Percentil",
        "Status",
    ]

    if load_data is None or load_data.empty:
        return pd.DataFrame(columns=columns)

    df = load_data.copy()

    # Normalize expected column names
    if "ActionName" in df.columns and "Action" not in df.columns:
        df["Action"] = df["ActionName"]

    if "Duration" not in df.columns:
        possible_duration_columns = [
            "Elapsed",
            "ResponseTime",
            "Response Time",
            "DurationMs",
            "DurationMS",
            "duration",
        ]

        for column in possible_duration_columns:
            if column in df.columns:
                df["Duration"] = df[column]
                break

    required_columns = [
        "Hardware",
        "Action",
        "Duration",
    ]

    for column in required_columns:
        if column not in df.columns:
            df[column] = ""

    df["Hardware"] = df["Hardware"].fillna("").astype(str)
    df["Action"] = df["Action"].fillna("").astype(str)

    # Keep values in milliseconds
    df["Duration"] = pd.to_numeric(
        df["Duration"],
        errors="coerce",
    )

    df = df.dropna(
        subset=[
            "Duration",
        ]
    )

    if df.empty:
        return pd.DataFrame(columns=columns)

    report_rows = []

    grouped = df.groupby(
        [
            "Hardware",
            "Action",
        ],
        dropna=False,
    )

    for group_keys, group_df in grouped:
        hardware, action = group_keys

        durations = group_df["Duration"].dropna()

        if durations.empty:
            continue

        kpi = get_kpi(action)

        if kpi is None:
            kpi = 0

        total_quantity = int(durations.count())

        if kpi > 0:
            above_kpi = int(
                (durations > kpi).sum()
            )
        else:
            above_kpi = 0

        min_value = float(
            durations.min()
        )

        max_value = float(
            durations.max()
        )

        average_value = float(
            durations.mean()
        )

        std_deviation = float(
            durations.std(ddof=0)
        )

        percentile_50 = float(
            durations.quantile(0.50)
        )

        percentile_90 = float(
            durations.quantile(0.90)
        )

        # Correct PASS/FAIL rule:
        # Performance result must be evaluated by 90th Percentil, not Average.
        if kpi > 0 and percentile_90 <= kpi:
            status = "PASS"
        elif kpi > 0 and percentile_90 > kpi:
            status = "FAIL"
        else:
            status = "NO KPI"

        report_rows.append(
            {
                "Hardware": hardware,
                "Action": action,
                "KPI": round(kpi, 2),
                "Total Quantity": total_quantity,
                "Above KPI": above_kpi,
                "Min": round(min_value, 2),
                "Max": round(max_value, 2),
                "Average": round(average_value, 2),
                "Std Deviation": round(std_deviation, 2),
                "50th Percentil": round(percentile_50, 2),
                "90th Percentil": round(percentile_90, 2),
                "Status": status,
            }
        )

    report = pd.DataFrame(report_rows)

    if report.empty:
        return pd.DataFrame(columns=columns)

    report = report[columns]

    report = report.sort_values(
        by=[
            "Action",
            "Hardware",
        ]
    ).reset_index(drop=True)

    return report