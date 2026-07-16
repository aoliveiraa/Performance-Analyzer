import shutil
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

    Path(RUNS_FOLDER).mkdir(
        parents=True,
        exist_ok=True
    )

    existing_numbers = []

    for folder in os.listdir(RUNS_FOLDER):

        path = os.path.join(
            RUNS_FOLDER,
            folder
        )

        if not os.path.isdir(path):
            continue

        if not folder.startswith("run_"):
            continue

        try:
            number = int(
                folder.replace("run_", "")
            )

            existing_numbers.append(
                number
            )

        except ValueError:
            continue

    next_number = (
        max(existing_numbers) + 1
        if existing_numbers
        else 1
    )

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


def delete_run(run_id: str):
    run_path = Path(RUNS_FOLDER) / run_id

    if not run_path.exists():
        return {
            "success": False,
            "message": "Run not found"
        }

    shutil.rmtree(run_path)

    return {
        "success": True,
        "message": f"{run_id} deleted"
    }