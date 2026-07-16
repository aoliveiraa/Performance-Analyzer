from pathlib import Path

import pandas as pd

from datetime import datetime


# =========================
# LEGACY CHARTS
# =========================

def action_trend(file_path):

    df = pd.read_csv(file_path)

    grouped = df.groupby(
        [
            "Hardware",
            "Action",
            "ScenarioStartTime"
        ]
    )

    result = []

    for key, group in grouped:

        start = group[
            group["Type"] == "HOOK_START"
        ]

        end = group[
            group["Type"] == "HOOK_END"
        ]

        if len(start) == 0 or len(end) == 0:
            continue

        duration = (
            int(end.iloc[0]["Time"])
            - int(start.iloc[0]["Time"])
        )

        result.append({
            "hardware": key[0],
            "action": key[1],
            "timestamp": str(key[2]),
            "duration": duration
        })

    return result


def memory_trend(file_path):

    df = pd.read_csv(file_path)

    df["Data"] = pd.to_numeric(
        df["Data"],
        errors="coerce"
    )

    df = df.dropna(subset=["Data"])

    result = []

    for _, row in df.iterrows():

        result.append({
            "process": str(row["ProcessName"]),
            "counter": str(row["CounterName"]),
            "timestamp": str(row["Timestamp"]),
            "value": float(row["Data"])
        })

    return result


# =========================
# RUN COUNTERS CHARTS
# =========================

def get_run_counters_folder(run_id: str):
    return Path("uploads") / run_id / "counters"


def get_counter_csv_files(run_id: str):
    counters_folder = get_run_counters_folder(run_id)

    if not counters_folder.exists():
        return []

    return [
        file_path
        for file_path in counters_folder.iterdir()
        if file_path.is_file()
        and file_path.suffix.lower() == ".csv"
    ]


def load_raw_counter_files(run_id: str):
    """
    Lê os arquivos raw de counters da run.

    Importante:
    process_counters_file gera um resumo e perde o Timestamp.
    Para gráfico de linha, precisamos ler o CSV original.
    """

    files = get_counter_csv_files(run_id)

    if not files:
        return pd.DataFrame()

    dataframes = []

    for file_path in files:
        try:
            df = pd.read_csv(file_path)

            if df is None or df.empty:
                continue

            df["SourceFile"] = file_path.name

            dataframes.append(df)

        except Exception as error:
            print(
                f"[CHART SERVICE] Error reading counter file {file_path.name}: {error}"
            )

    if not dataframes:
        return pd.DataFrame()

    combined = pd.concat(
        dataframes,
        ignore_index=True,
    )

    return combined


def prepare_counter_dataframe(df):
    """
    Normaliza as colunas esperadas nos arquivos de counters.
    """

    if df is None or df.empty:
        return pd.DataFrame()

    result = df.copy()

    required_columns = [
        "ProcessName",
        "CounterName",
        "Timestamp",
        "Data",
        "SourceFile",
    ]

    for column in required_columns:
        if column not in result.columns:
            result[column] = ""

    result["Data"] = pd.to_numeric(
        result["Data"],
        errors="coerce",
    )

    result = result.dropna(
        subset=["Data"]
    )

    result["ProcessName"] = (
        result["ProcessName"]
        .fillna("")
        .astype(str)
        .str.strip()
    )

    result["CounterName"] = (
        result["CounterName"]
        .fillna("")
        .astype(str)
        .str.strip()
    )

    result["Timestamp"] = (
        result["Timestamp"]
        .fillna("")
        .astype(str)
        .str.strip()
    )

    result["SourceFile"] = (
        result["SourceFile"]
        .fillna("")
        .astype(str)
        .str.strip()
    )

    return result


def get_memory_trend_by_run(run_id: str):
    """
    Retorna dados de memória ao longo do tempo.

    Busca counters comuns:
    - Working Set
    - Private
    - Memory
    """

    raw_df = load_raw_counter_files(
        run_id
    )

    df = prepare_counter_dataframe(
        raw_df
    )
    print(df.columns.tolist())
    print(
    df.head(1).to_dict(
        orient="records"
    )
)

    if df.empty:
        return []

    memory_df = df[
        df["CounterName"].str.contains(
            "Working Set|Private|Memory",
            case=False,
            na=False,
            regex=True,
        )
    ]

    if memory_df.empty:
        return []

    memory_df = memory_df.sort_values(
        by=[
            "SourceFile",
            "ProcessName",
            "CounterName",
            "Timestamp",
        ]
    )

    result = []

    for _, row in memory_df.iterrows():
        result.append({
            "hardware": str(row["SourceFile"]),
            "process": str(row["ProcessName"]),
            "counter": str(row["CounterName"]),
            "timestamp": str(row["Timestamp"]),
            "value": float(row["Data"]),
        })

    return result


def get_cpu_trend_by_run(run_id: str):
    """
    Retorna dados de CPU ao longo do tempo.

    Busca counters comuns:
    - CPU
    - Processor
    - % Processor Time
    """

    raw_df = load_raw_counter_files(
        run_id
    )

    df = prepare_counter_dataframe(
        raw_df
    )

    if df.empty:
        return []

    cpu_df = df[
        df["CounterName"].str.contains(
            "CPU|Processor|% Processor Time",
            case=False,
            na=False,
            regex=True,
        )
    ]

    if cpu_df.empty:
        return []

    cpu_df = cpu_df.sort_values(
        by=[
            "SourceFile",
            "ProcessName",
            "CounterName",
            "Timestamp",
        ]
    )

    result = []

    for _, row in cpu_df.iterrows():
        result.append({
            "hardware": str(row["SourceFile"]),
            "process": str(row["ProcessName"]),
            "counter": str(row["CounterName"]),
            "timestamp": str(row["Timestamp"]),
            "value": float(row["Data"]),
        })

    return result


def get_top_memory_consumers_by_run(run_id: str):
    """
    Retorna os maiores consumidores de memória por processo/counter/hardware.
    """

    memory_data = get_memory_trend_by_run(
        run_id
    )

    if not memory_data:
        return []

    df = pd.DataFrame(
        memory_data
    )

    if df.empty:
        return []

    df["value"] = pd.to_numeric(
        df["value"],
        errors="coerce",
    )

    df = df.dropna(
        subset=["value"]
    )

    grouped = df.groupby(
        [
            "hardware",
            "process",
            "counter",
        ],
        dropna=False,
    )

    rows = []

    for key, group_df in grouped:
        hardware, process, counter = key

        rows.append({
            "hardware": hardware,
            "process": process,
            "counter": counter,
            "samples": int(len(group_df)),
            "min": round(float(group_df["value"].min()), 2),
            "max": round(float(group_df["value"].max()), 2),
            "average": round(float(group_df["value"].mean()), 2),
        })

    result = pd.DataFrame(
        rows
    )

    if result.empty:
        return []

    result = result.sort_values(
        by="max",
        ascending=False,
    ).head(10)

    return result.to_dict(
        orient="records"
    )

FIXED_PERFORMANCE_COUNTERS = [
    "Private Bytes",
    "Working Set",
    "Handle Count",
    "Thread Count",
    "IO Read Bytes/sec",
    "IO Write Bytes/sec",
    "% Processor Time",
]


def get_performance_counters_trend_by_run(run_id: str):
    """
    Retorna dados dos counters fixos usados nos gráficos:
    - Private Bytes
    - Working Set
    - Handle Count
    - Thread Count
    - IO Read Bytes/sec
    - IO Write Bytes/sec
    - % Processor Time
    """

    raw_df = load_raw_counter_files(
        run_id
    )

    df = prepare_counter_dataframe(
        raw_df
    )
    print("\n===== COLUMNS =====")
    print(df.columns.tolist())

    print("\n===== SAMPLE =====")
    print(
        df.head(1).to_dict(
            orient="records"
        )
    )

    if df.empty:
        return []

    selected_rows = []

    for _, row in df.iterrows():

        counter_name = str(
            row["CounterName"]
        )

        matched_counter = None

        for fixed_counter in FIXED_PERFORMANCE_COUNTERS:
            if fixed_counter.lower() in counter_name.lower():
                matched_counter = fixed_counter
                break

        if matched_counter is None:
            continue

        # =====================================
        # NOVO CÓDIGO
        # =====================================

        action_time = str(
            row["ActionStartTime"]
        )

        formatted_time = action_time

        try:
            formatted_time = datetime.strptime(
                action_time[:17],
                "%Y%m%d%H%M%S%f"
            ).isoformat()

        except Exception:
            pass

        # =====================================
        # EXISTENTE
        # =====================================

        selected_rows.append({
            "hardware": str(row["Hardware"]),
            "action": str(row["ActionName"]),
            "process": str(row["ProcessName"]),
            "counter": matched_counter,
            "timestamp": formatted_time,
            "value": float(row["Data"]),
        })

    print("\n===== RESULT SAMPLE =====")

    if selected_rows:
        print(selected_rows[0])
    return selected_rows