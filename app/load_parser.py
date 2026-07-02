# load_parser.py

import pandas as pd

def process_load_file(file_path):

    df = pd.read_csv(file_path)

    results = []

    grouped = df.groupby(
        [
            "Hardware",
            "Scenario",
            "Action",
            "ScenarioStartTime"
        ]
    )

    for key, group in grouped:

        start = group[group["Type"] == "HOOK_START"]
        end = group[group["Type"] == "HOOK_END"]

        if len(start) == 0 or len(end) == 0:
            continue

        start_time = int(start.iloc[0]["Time"])
        end_time = int(end.iloc[0]["Time"])

        duration_ms = (end_time - start_time)

        results.append({
            "Hardware": key[0],
            "Scenario": key[1],
            "Action": key[2],
            "Duration": duration_ms
        })

    return pd.DataFrame(results)