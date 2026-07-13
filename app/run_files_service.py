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


def list_run_files(run_id: str):
    ensure_run_folders(run_id)

    load_folder = get_run_load_folder(run_id)
    counters_folder = get_run_counters_folder(run_id)

    load_files = [
        file.name
        for file in load_folder.glob("*.csv")
    ]

    counters_files = [
        file.name
        for file in counters_folder.glob("*.csv")
    ]

    return {
        "run_id": run_id,
        "load_files": load_files,
        "counters_files": counters_files,
    }


def process_run_load_files(run_id: str):
    ensure_run_folders(run_id)

    load_folder = get_run_load_folder(run_id)
    load_files = list(load_folder.glob("*.csv"))

    if not load_files:
        return pd.DataFrame()

    dataframes = []

    for file_path in load_files:
        df = process_load_file(
            str(file_path)
        )

        if df is not None and not df.empty:
            dataframes.append(df)

    if not dataframes:
        return pd.DataFrame()

    return pd.concat(
        dataframes,
        ignore_index=True,
    )


def process_run_counters_files(run_id: str):
    ensure_run_folders(run_id)

    counters_folder = get_run_counters_folder(run_id)
    counters_files = list(counters_folder.glob("*.csv"))

    if not counters_files:
        return pd.DataFrame()

    dataframes = []

    for file_path in counters_files:
        df = process_counters_file(
            str(file_path)
        )

        if df is not None and not df.empty:
            dataframes.append(df)

    if not dataframes:
        return pd.DataFrame()

    return pd.concat(
        dataframes,
        ignore_index=True,
    )


def detect_run_memory_leaks(run_id: str):
    ensure_run_folders(run_id)

    counters_folder = get_run_counters_folder(run_id)
    counters_files = list(counters_folder.glob("*.csv"))

    all_leaks = []

    for file_path in counters_files:
        leaks = detect_memory_leaks(
            str(file_path)
        )

        if leaks:
            all_leaks.extend(leaks)

    return all_leaks