#!/usr/bin/env python3
"""Run db/migrations/001_init.sql against NEON_DATABASE_URL. Run once before import."""
import os
import sys
from pathlib import Path

import psycopg

REPO_ROOT = Path(__file__).resolve().parent.parent
MIGRATION_FILE = REPO_ROOT / "db" / "migrations" / "001_init.sql"


def main() -> None:
    url = os.getenv("NEON_DATABASE_URL")
    if not url:
        print("Set NEON_DATABASE_URL and run again.", file=sys.stderr)
        sys.exit(1)
    if not MIGRATION_FILE.exists():
        print(f"Migration not found: {MIGRATION_FILE}", file=sys.stderr)
        sys.exit(1)
    sql = MIGRATION_FILE.read_text()
    with psycopg.connect(url) as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
        conn.commit()
    print("Migration 001_init.sql applied successfully.")


if __name__ == "__main__":
    main()
