import pandas as pd

from app.kpi_service import get_kpi


ACTION_REPORT_COLUMNS = [
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


ACTION_SUMMARY_COLUMNS = [
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


def normalize_duration_column(series):
    """
    Normaliza a coluna Duration mantendo os valores em milissegundos.

    Trata casos comuns:
    - números já numéricos
    - strings com vírgula decimal
    - strings com espaços
    - strings com unidade ms
    """

    normalized = (
        series
        .astype(str)
        .str.strip()
        .str.replace("ms", "", case=False, regex=False)
        .str.replace(",", ".", regex=False)
    )

    return pd.to_numeric(
        normalized,
        errors="coerce",
    )


def generate_action_report(load_data):
    """
    Gera relatório detalhado agrupado por Hardware + Action.

    Regra de status:
    - PASS quando 90th Percentil <= KPI
    - FAIL quando 90th Percentil > KPI
    - NO KPI quando não existir KPI cadastrado

    Valores permanecem em milissegundos.
    """

    if load_data is None or load_data.empty:
        return pd.DataFrame(columns=ACTION_REPORT_COLUMNS)

    df = load_data.copy()

    # Normaliza nomes alternativos para Action
    if "ActionName" in df.columns and "Action" not in df.columns:
        df["Action"] = df["ActionName"]

    if "Name" in df.columns and "Action" not in df.columns:
        df["Action"] = df["Name"]

    # Normaliza nomes alternativos para Duration
    if "Duration" not in df.columns:
        possible_duration_columns = [
            "Elapsed",
            "ResponseTime",
            "Response Time",
            "DurationMs",
            "DurationMS",
            "duration",
            "ElapsedTime",
            "Elapsed Time",
        ]

        for column in possible_duration_columns:
            if column in df.columns:
                df["Duration"] = df[column]
                break

    # Normaliza Hardware caso não exista
    if "Hardware" not in df.columns:
        if "Host" in df.columns:
            df["Hardware"] = df["Host"]
        elif "Machine" in df.columns:
            df["Hardware"] = df["Machine"]
        elif "SourceFile" in df.columns:
            df["Hardware"] = df["SourceFile"]
        else:
            df["Hardware"] = "Unknown Hardware"

    required_columns = [
        "Hardware",
        "Action",
        "Duration",
    ]

    for column in required_columns:
        if column not in df.columns:
            df[column] = ""

    df["Hardware"] = df["Hardware"].fillna("Unknown Hardware").astype(str).str.strip()
    df["Action"] = df["Action"].fillna("").astype(str).str.strip()

    df["Duration"] = normalize_duration_column(
        df["Duration"]
    )

    # Remove linhas sem Action ou sem Duration válido
    df = df[
        (df["Action"] != "")
        &
        (df["Duration"].notna())
    ]

    if df.empty:
        return pd.DataFrame(columns=ACTION_REPORT_COLUMNS)

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

        total_quantity = int(
            durations.count()
        )

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
                "KPI": round(float(kpi), 2),
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
        return pd.DataFrame(columns=ACTION_REPORT_COLUMNS)

    report = report[ACTION_REPORT_COLUMNS]

    report = report.sort_values(
        by=[
            "Action",
            "Hardware",
        ]
    ).reset_index(drop=True)

    return report


def generate_action_summary_report(action_report):
    """
    Gera visão geral compilada por Action.

    Consolida todos os hardwares da mesma Action.

    Regras:
    - Total Quantity: soma
    - Above KPI: soma
    - KPI, Min, Max, Average, Std Deviation, 50th e 90th: média
    - Status:
        FAIL se algum hardware falhou
        NO KPI se todos estiverem sem KPI
        PASS nos demais casos
    """

    if action_report is None or action_report.empty:
        return pd.DataFrame(columns=ACTION_SUMMARY_COLUMNS)

    df = action_report.copy()

    for column in ACTION_SUMMARY_COLUMNS:
        if column not in df.columns:
            df[column] = 0

    df["Action"] = df["Action"].fillna("").astype(str).str.strip()
    df["Status"] = df["Status"].fillna("NO KPI").astype(str).str.strip()

    numeric_columns = [
        "KPI",
        "Total Quantity",
        "Above KPI",
        "Min",
        "Max",
        "Average",
        "Std Deviation",
        "50th Percentil",
        "90th Percentil",
    ]

    for column in numeric_columns:
        df[column] = pd.to_numeric(
            df[column],
            errors="coerce",
        ).fillna(0)

    df = df[df["Action"] != ""]

    if df.empty:
        return pd.DataFrame(columns=ACTION_SUMMARY_COLUMNS)

    summary_rows = []

    grouped = df.groupby(
        "Action",
        dropna=False,
    )

    for action, group_df in grouped:
        statuses = (
            group_df["Status"]
            .fillna("NO KPI")
            .astype(str)
            .str.upper()
            .tolist()
        )

        if "FAIL" in statuses:
            status = "FAIL"
        elif all(item == "NO KPI" for item in statuses):
            status = "NO KPI"
        else:
            status = "PASS"

        summary_rows.append(
            {
                "Action": action,
                "KPI": round(float(group_df["KPI"].mean()), 2),
                "Total Quantity": int(group_df["Total Quantity"].sum()),
                "Above KPI": int(group_df["Above KPI"].sum()),
                "Min": round(float(group_df["Min"].mean()), 2),
                "Max": round(float(group_df["Max"].mean()), 2),
                "Average": round(float(group_df["Average"].mean()), 2),
                "Std Deviation": round(float(group_df["Std Deviation"].mean()), 2),
                "50th Percentil": round(float(group_df["50th Percentil"].mean()), 2),
                "90th Percentil": round(float(group_df["90th Percentil"].mean()), 2),
                "Status": status,
            }
        )

    summary = pd.DataFrame(summary_rows)

    if summary.empty:
        return pd.DataFrame(columns=ACTION_SUMMARY_COLUMNS)

    summary = summary[ACTION_SUMMARY_COLUMNS]

    summary = summary.sort_values(
        by=[
            "Action",
        ]
    ).reset_index(drop=True)

    return summary