from pathlib import Path
import json
import pandas as pd

from app.load_parser import process_load_file

from app.run_service import get_runs

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

def get_run_processes_folder(run_id: str):
    return get_run_folder(run_id) / "processes"


def get_run_metadata_file(run_id: str):
    return get_run_folder(run_id) / "metadata.json"

def get_run_processes_file(run_id: str):
    return (
        get_run_processes_folder(run_id)
        / "processes.json"
    )

def ensure_run_folders(run_id: str):
    load_folder = get_run_load_folder(run_id)
    counters_folder = get_run_counters_folder(run_id)
    processes_folder = get_run_processes_folder(run_id)

    load_folder.mkdir(
    parents=True,
    exist_ok=True,
    )

    counters_folder.mkdir(
        parents=True,
        exist_ok=True,
    )

    processes_folder.mkdir(
        parents=True,
        exist_ok=True,
    )


def format_date_from_filename(date_raw: str):
    if not date_raw:
        return ""

    clean_date = str(date_raw).strip()

    if len(clean_date) != 8 or not clean_date.isdigit():
        return clean_date

    year = clean_date[0:4]
    month = clean_date[4:6]
    day = clean_date[6:8]

    return f"{int(month)}/{int(day)}/{year}"


def parse_run_metadata_from_filename(filename: str):
    """
    Expected file pattern:

    vNP6.1.36_Bundle 36.CA.B16477 Load_SESRM 3403 - CA 36 - LogIn_Lab-RDI-US-RIO_20260612.csv

    Expected output:

    version: vNP6.1.36
    build: Bundle 36.CA.B16477 Load
    suite: SESRM 3403
    environment: Lab-RDI-US-RIO
    date_raw: 20260612
    date: 6/12/2026
    """

    file_stem = Path(filename).stem

    parts = file_stem.split("_")

    version = parts[0].strip() if len(parts) > 0 else ""
    build = parts[1].strip() if len(parts) > 1 else ""
    suite_raw = parts[2].strip() if len(parts) > 2 else ""
    environment = parts[3].strip() if len(parts) > 3 else ""
    date_raw = parts[4].strip() if len(parts) > 4 else ""

    suite = suite_raw.split(" - ")[0].strip()

    return {
        "version": version,
        "build": build,
        "suite": suite,
        "environment": environment,
        "date_raw": date_raw,
        "date": format_date_from_filename(date_raw),
        "source_file": filename,
    }


def get_run_metadata(run_id: str):
    metadata_file = get_run_metadata_file(run_id)

    if not metadata_file.exists():
        return {}

    try:
        with open(metadata_file, "r", encoding="utf-8") as file:
            return json.load(file)
    except Exception as error:
        print(
            f"[RUN METADATA] Error reading metadata for {run_id}: {error}"
        )

        return {}


def save_run_metadata(
    run_id: str,
    metadata: dict,
):
    ensure_run_folders(run_id)

    metadata_file = get_run_metadata_file(run_id)

    with open(metadata_file, "w", encoding="utf-8") as file:
        json.dump(
            metadata,
            file,
            indent=2,
            ensure_ascii=False,
        )

    return metadata


def save_run_metadata_from_filename(
    run_id: str,
    filename: str,
    overwrite: bool = False,
):
    """
    Creates metadata.json based on the uploaded file name.

    By default, it does not overwrite existing metadata.
    This means the first uploaded file defines the run metadata.
    """

    ensure_run_folders(run_id)

    metadata_file = get_run_metadata_file(run_id)

    if metadata_file.exists() and not overwrite:
        return get_run_metadata(run_id)

    metadata = parse_run_metadata_from_filename(filename)

    return save_run_metadata(
        run_id,
        metadata,
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
        "has_processes_file":
            get_run_processes_file(run_id).exists(),
        "metadata": get_run_metadata(run_id),
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
                print(
                    f"[RUN LOAD] Parser returned None for: {file_path.name}"
                )
                continue

            print(
                f"[RUN LOAD] Rows loaded from {file_path.name}: {len(df)}"
            )
            print(
                f"[RUN LOAD] Columns from {file_path.name}: {list(df.columns)}"
            )

            if not df.empty:
                df["SourceFile"] = file_path.name
                dataframes.append(df)

        except Exception as error:
            print(
                f"[RUN LOAD] Error processing {file_path.name}: {error}"
            )

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
                print(
                    f"[RUN COUNTERS] Parser returned None for: {file_path.name}"
                )
                continue

            print(
                f"[RUN COUNTERS] Rows loaded from {file_path.name}: {len(df)}"
            )
            print(
                f"[RUN COUNTERS] Columns from {file_path.name}: {list(df.columns)}"
            )

            if not df.empty:
                df["SourceFile"] = file_path.name
                dataframes.append(df)

        except Exception as error:
            print(
                f"[RUN COUNTERS] Error processing {file_path.name}: {error}"
            )

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
            print(
                f"[RUN MEMORY LEAK] Error processing {file_path.name}: {error}"
            )

    return all_leaks



def get_reports_summary():
    reports = []

    runs = get_runs()

    for run in runs:
        run_id = run.get("id")

        files_info = list_run_files(run_id)

        metadata = files_info.get(
            "metadata",
            {}
        )

        reports.append({
            "run_id": run_id,
            "version": metadata.get(
                "version",
                "-"
            ),
            "build": metadata.get(
                "build",
                "-"
            ),
            "suite": metadata.get(
                "suite",
                "-"
            ),
            "environment": metadata.get(
                "environment",
                "-"
            ),
            "date": metadata.get(
                "date",
                "-"
            ),
            "date_raw": metadata.get(
                "date_raw",
                ""
            ),
            "load_files": len(
                files_info.get(
                    "load_files",
                    []
                )
            ),
            "counters_files": len(
                files_info.get(
                    "counters_files",
                    []
                )
            ),
            "status": (
                "Executed"
                if (
                    len(files_info.get("load_files", []))
                    +
                    len(files_info.get("counters_files", []))
                ) > 0
                else "Pending"
            ),
        })

    return reports

def save_processes_json(
    run_id: str,
    content: bytes,
):
    ensure_run_folders(run_id)

    file_path = get_run_processes_file(
        run_id
    )

    with open(
        file_path,
        "wb",
    ) as file:
        file.write(content)

    return str(file_path)

def load_processes_json(
    run_id: str,
):
    file_path = get_run_processes_file(
        run_id
    )

    if not file_path.exists():
        return None

    with open(
        file_path,
        "r",
        encoding="utf-8",
    ) as file:
        return json.load(file)
