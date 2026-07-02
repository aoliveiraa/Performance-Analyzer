import pandas as pd


def process_counters_file(file_path):

    df = pd.read_csv(file_path)

    # Converter Data para número
    df["Data"] = pd.to_numeric(
        df["Data"],
        errors="coerce"
    )

    # Remover valores inválidos
    df = df.dropna(subset=["Data"])

    report = []

    grouped = df.groupby(
        [
            "ProcessName",
            "CounterName"
        ]
    )

    for key, group in grouped:

        process_name = key[0]
        counter_name = key[1]

        first_value = group["Data"].iloc[0]
        last_value = group["Data"].iloc[-1]

        growth = 0

        if first_value != 0:
            growth = (
                (last_value - first_value)
                / first_value
            ) * 100

        report.append({

            "Process": process_name,

            "Counter": counter_name,

            "Samples": len(group),

            "Min":
            round(group["Data"].min(), 2),

            "Max":
            round(group["Data"].max(), 2),

            "Average":
            round(group["Data"].mean(), 2),

            "Start":
            round(first_value, 2),

            "End":
            round(last_value, 2),

            "Growth %":
            round(growth, 2)

        })

    return pd.DataFrame(report)

def detect_memory_leaks(file_path):

    import pandas as pd

    df = pd.read_csv(file_path)

    df["Data"] = pd.to_numeric(
        df["Data"],
        errors="coerce"
    )

    df = df.dropna(subset=["Data"])

    report = []

    memory_data = df[
        df["CounterName"]
        .str.contains(
            "Working Set|Private",
            case=False,
            na=False
        )
    ]

    grouped = memory_data.groupby(
        ["ProcessName", "CounterName"]
    )

    for key, group in grouped:

        start = group["Data"].iloc[0]
        end = group["Data"].iloc[-1]

        growth = 0

        if start != 0:
            growth = (
                (end - start)
                / start
            ) * 100

        report.append({

            "Process": key[0],

            "Counter": key[1],

            "Start": round(start, 2),

            "End": round(end, 2),

            "Growth %": round(growth, 2),

            "Status":
                "POSSIBLE_MEMORY_LEAK"
                if growth > 20
                else "OK"
        })

    return report