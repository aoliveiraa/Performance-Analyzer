from pathlib import Path
import os


RUNS_FOLDER = "uploads"


def get_runs():

    runs = []

    if not os.path.exists(RUNS_FOLDER):
        return runs

    for folder in os.listdir(RUNS_FOLDER):

        path = os.path.join(
            RUNS_FOLDER,
            folder
        )

        if os.path.isdir(path):

            runs.append({
                "id": folder
            })

    runs.sort(
        key=lambda x: x["id"],
        reverse=True
    )

    return runs


def create_run():

    runs = get_runs()

    next_number = len(runs) + 1

    run_id = f"run_{next_number:03d}"

    run_path = os.path.join(
        RUNS_FOLDER,
        run_id
    )

    Path(run_path).mkdir(
        parents=True,
        exist_ok=True
    )

    return run_id