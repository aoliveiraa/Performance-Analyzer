import sqlite3
from pathlib import Path


DB_PATH = Path("performance_analyzer.db")


def get_connection():
    return sqlite3.connect(DB_PATH)


def init_kpi_database():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS kpis (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action_name TEXT NOT NULL UNIQUE,
            kpi_ms REAL NOT NULL
        )
        """
    )

    conn.commit()
    conn.close()


def upsert_kpi(action_name: str, kpi_ms: float):
    init_kpi_database()

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO kpis (action_name, kpi_ms)
        VALUES (?, ?)
        ON CONFLICT(action_name)
        DO UPDATE SET kpi_ms = excluded.kpi_ms
        """,
        (action_name, kpi_ms),
    )

    conn.commit()
    conn.close()


def get_kpi(action_name: str):
    init_kpi_database()

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT kpi_ms
        FROM kpis
        WHERE action_name = ?
        """,
        (action_name,),
    )

    row = cursor.fetchone()
    conn.close()

    if row:
        return float(row[0])

    return None


def get_all_kpis():
    init_kpi_database()

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT action_name, kpi_ms
        FROM kpis
        ORDER BY action_name
        """
    )

    rows = cursor.fetchall()
    conn.close()

    return [
        {
            "Action": row[0],
            "KPI": row[1],
        }
        for row in rows
    ]


def seed_default_kpis():
    default_kpis = {
        "Exact Cash": 2000,
        "First": 2000,
        "Fries": 400,
        "Medium Coke": 400,
        "Take Out Total": 2000,
    }

    for action_name, kpi_ms in default_kpis.items():
        upsert_kpi(action_name, kpi_ms)