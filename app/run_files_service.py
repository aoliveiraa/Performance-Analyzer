from pathlib import Path

import pandas as pd

from app.load_parser import process_load_file
from app.counters_parser import (
    process_counters_file,
    detect_memory_leaks,
)


def get_run_folder(run_id: str):
    return Path("uploads") / run_id


def get_run_load_folder(run_id: str):
    return get_run_folder(run_id) / "load"


def get_run_counters_folder(run_id: str):
    return get_run_folder(run_id) / "counters"


def ensure_run_folders(run_id: str):
    load_folder = get_run_load_folder(run_id)
    counters_folder = get_run_counters_folder(run_id)

    load_folder.mkdir(
        parents=True,
        exist_ok=True,
    )

    counters_folder.mkdir(
        parents=True,
        exist_ok=True,
    )


def get_csv_files(folder: Path):
    files = []

    if not folder.exists():
        return files

    for file_path in folder.iterdir():
        if file_path.is_file() and file_path.suffix.lower() == ".csv":
            files.append(file_path)

    return files


def list_run_files(run_id: str):
    ensure_run_folders(run_id)

    load_folder = get_run_load_folder(run_id)
    counters_folder = get_run_counters_folder(run_id)

    load_files = [
        file.name
        for file in get_csv_files(load_folder)
    ]

    counters_files = [
        file.name
        for file in get_csv_files(counters_folder)
    ]

    return {
        "run_id": run_id,
        "load_files": load_files,
        "counters_files": counters_files,
    }


def process_run_load_files(run_id: str):
    ensure_run_folders(run_id)

    load_folder = get_run_load_folder(run_id)
    load_files = get_csv_files(load_folder)

    print("====================================")
    print(f"[RUN LOAD] run_id={run_id}")
    print(f"[RUN LOAD] folder={load_folder}")
    print(f"[RUN LOAD] files={[str(file) for file in load_files]}")
    print("====================================")

    if not load_files:
        print("[RUN LOAD] No load files found.")
        return pd.DataFrame()

    dataframes = []

    for file_path in load_files:
        try:
            print(f"[RUN LOAD] Processing file: {file_path}")

            df = process_load_file(
                str(file_path)
            )

            if df is None:
                print(f"[RUN LOAD] Parser returned None for: {file_path.name}")
                continue

            print(f"[RUN LOAD] Rows loaded from {file_path.name}: {len(df)}")
            print(f"[RUN LOAD] Columns from {file_path.name}: {list(df.columns)}")

            if not df.empty:
                df["SourceFile"] = file_path.name
                dataframes.append(df)

        except Exception as error:
            print(f"[RUN LOAD] Error processing {file_path.name}: {error}")

    if not dataframes:
        print("[RUN LOAD] No valid dataframes generated from load files.")
        return pd.DataFrame()

    combined = pd.concat(
        dataframes,
        ignore_index=True,
    )

    print(f"[RUN LOAD] Combined rows: {len(combined)}")
    print(f"[RUN LOAD] Combined columns: {list(combined.columns)}")

    return combined


def process_run_counters_files(run_id: str):
    ensure_run_folders(run_id)

    counters_folder = get_run_counters_folder(run_id)
    counters_files = get_csv_files(counters_folder)

    print("====================================")
    print(f"[RUN COUNTERS] run_id={run_id}")
    print(f"[RUN COUNTERS] folder={counters_folder}")
    print(f"[RUN COUNTERS] files={[str(file) for file in counters_files]}")
    print("====================================")

    if not counters_files:
        print("[RUN COUNTERS] No counters files found.")
        return pd.DataFrame()

    dataframes = []

    for file_path in counters_files:
        try:
            print(f"[RUN COUNTERS] Processing file: {file_path}")

            df = process_counters_file(
                str(file_path)
            )

            if df is None:
                print(f"[RUN COUNTERS] Parser returned None for: {file_path.name}")
                continue

            print(f"[RUN COUNTERS] Rows loaded from {file_path.name}: {len(df)}")
            print(f"[RUN COUNTERS] Columns from {file_path.name}: {list(df.columns)}")

            if not df.empty:
                df["SourceFile"] = file_path.name
                dataframes.append(df)

        except Exception as error:
            print(f"[RUN COUNTERS] Error processing {file_path.name}: {error}")

    if not dataframes:
        print("[RUN COUNTERS] No valid dataframes generated from counters files.")
        return pd.DataFrame()

    combined = pd.concat(
        dataframes,
        ignore_index=True,
    )

    print(f"[RUN COUNTERS] Combined rows: {len(combined)}")
    print(f"[RUN COUNTERS] Combined columns: {list(combined.columns)}")

    return combined


def detect_run_memory_leaks(run_id: str):
    ensure_run_folders(run_id)

    counters_folder = get_run_counters_folder(run_id)
    counters_files = get_csv_files(counters_folder)

    all_leaks = []

    for file_path in counters_files:
        try:
            leaks = detect_memory_leaks(
                str(file_path)
            )

            if leaks:
                all_leaks.extend(leaks)

        except Exception as error:
            print(f"[RUN MEMORY LEAK] Error processing {file_path.name}: {error}")

    return all_leaks