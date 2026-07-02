import pandas as pd


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

            "process":
            str(row["ProcessName"]),

            "counter":
            str(row["CounterName"]),

            "timestamp":
            str(row["Timestamp"]),

            "value":
            float(row["Data"])

        })

    return result