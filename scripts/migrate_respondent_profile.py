import sqlite3
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[1]
DB_PATH = BASE_DIR / "data" / "survey.db"

columns = {
    "respondent_name": "VARCHAR(80)",
    "respondent_age": "INTEGER",
    "respondent_gender": "VARCHAR(40)",
    "respondent_extras": "JSON",
}

with sqlite3.connect(DB_PATH) as connection:
    existing = {
        row[1]
        for row in connection.execute("PRAGMA table_info(survey_sessions)")
    }

    for name, sql_type in columns.items():
        if name not in existing:
            connection.execute(
                f"ALTER TABLE survey_sessions ADD COLUMN {name} {sql_type}"
            )

print("Respondent profile migration completed.")
