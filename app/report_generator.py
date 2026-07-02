# report_generator.py

import pandas as pd
import json


def generate_action_report(df):

    with open("app/kpis.json", "r") as f:
        kpis = json.load(f)

    report = []

    grouped = df.groupby(
        [
            "Hardware",
            "Action"
        ]
    )

    for key, group in grouped:

        hardware = key[0]
        action = key[1]

        kpi = kpis["actions"].get(action, 400)

        durations = group["Duration"]

        above_kpi = len(
            durations[durations > kpi]
        )

        total = len(durations)

        report.append({

            "Hardware": hardware,

            "Action": action,

            "KPI": kpi,

            "Total Quantity": total,

            "Above KPI %":
            round(
                (above_kpi / total) * 100,
                2
            ),

            "Min":
            round(float(durations.min()), 2),

            "Max":
            round(float(durations.max()), 2),

            "Average":
            round(float(durations.mean()), 2),

            "StdDev":
            round(float(durations.std() or 0), 2),

            "P50":
            round(float(durations.quantile(0.50)), 2),

            "P90":
            round(float(durations.quantile(0.90)), 2)

        })

    return pd.DataFrame(report)