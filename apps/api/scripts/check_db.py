#!/usr/bin/env python3
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import inspect

from app.database import engine

EXPECTED_TABLES = ("users", "projects", "project_members", "files", "file_versions")


def main() -> None:
    with engine.connect() as connection:
        inspector = inspect(connection)
        tables = set(inspector.get_table_names())
        missing = [table for table in EXPECTED_TABLES if table not in tables]
        if missing:
            raise RuntimeError(f"Contract tables missing from database: {', '.join(missing)}")
        for table in EXPECTED_TABLES:
            columns = ", ".join(column["name"] for column in inspector.get_columns(table))
            print(f"{table}: {columns}")


if __name__ == "__main__":
    main()
