import sqlite3
from pathlib import Path

DB_PATH = Path("performance_analyzer.db")


def get_connection():
    return sqlite3.connect(DB_PATH)


def ensure_kpi_columns():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("PRAGMA table_info(kpis)")
    columns = [row[1] for row in cursor.fetchall()]

    if "category" not in columns:
        cursor.execute("""
            ALTER TABLE kpis
            ADD COLUMN category TEXT DEFAULT 'Other KPIs'
        """)
        print("✅ KPI column added: category")

    if "enabled" not in columns:
        cursor.execute("""
            ALTER TABLE kpis
            ADD COLUMN enabled INTEGER DEFAULT 1
        """)
        print("✅ KPI column added: enabled")

    conn.commit()
    conn.close()


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

    ensure_kpi_columns()


def upsert_kpi(
    action_name: str,
    kpi_ms: float,
    category: str = "Other KPIs",
):
    init_kpi_database()

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO kpis (
            action_name,
            kpi_ms,
            category,
            enabled
        )
        VALUES (?, ?, ?, 1)
        ON CONFLICT(action_name)
        DO UPDATE SET
            kpi_ms = excluded.kpi_ms,
            category = excluded.category
        """,
        (
            action_name,
            kpi_ms,
            category,
        ),
    )

    conn.commit()
    conn.close()

def update_kpi_category(action_name: str, category: str):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        UPDATE kpis
        SET category = ?
        WHERE action_name = ?
        """,
        (category, action_name),
    )

    conn.commit()
    conn.close()


def update_kpi_enabled(action_name: str, enabled: bool):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        UPDATE kpis
        SET enabled = ?
        WHERE action_name = ?
        """,
        (1 if enabled else 0, action_name),
    )

    conn.commit()
    conn.close()


def update_kpi(
    action_name: str,
    category: str,
    enabled: bool,
):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        UPDATE kpis
        SET
            category = ?,
            enabled = ?
        WHERE action_name = ?
        """,
        (
            category,
            1 if enabled else 0,
            action_name,
        ),
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
        SELECT
            action_name,
            kpi_ms,
            category,
            enabled
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
            "Category": row[2] if row[2] else "Other KPIs",
            "Enabled": bool(row[3]),
        }
        for row in rows
    ]


def get_categories():
    init_kpi_database()

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT DISTINCT category
        FROM kpis
        WHERE category IS NOT NULL
        ORDER BY category
        """
    )

    rows = cursor.fetchall()
    conn.close()

    categories = [row[0] for row in rows if row[0]]

    if "Other KPIs" not in categories:
        categories.append("Other KPIs")

    return sorted(categories)


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


def get_kpi_category(action_name: str):
    init_kpi_database()

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT category
        FROM kpis
        WHERE action_name = ?
        """,
        (action_name,),
    )

    row = cursor.fetchone()

    conn.close()

    if row:
        return row[0]

    return "Other KPIs"

