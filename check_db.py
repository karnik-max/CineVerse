import sqlite3
from pathlib import Path


DB_PATH = Path("data/cineverse.db")


if not DB_PATH.exists():
    print(f"Database not found: {DB_PATH.resolve()}")
    raise SystemExit(1)


conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()


print("=" * 50)
print("CINEVERSE DATABASE")
print("=" * 50)

print(f"\nDatabase:")
print(DB_PATH.resolve())


# ---------------------------------------------------------
# TABLES
# ---------------------------------------------------------

cursor.execute("""
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
    ORDER BY name
""")

tables = cursor.fetchall()


print("\nTABLES")
print("-" * 50)

if not tables:
    print("No tables found.")

else:

    for (table_name,) in tables:
        print(table_name)


# ---------------------------------------------------------
# SHOW EACH TABLE
# ---------------------------------------------------------

for (table_name,) in tables:

    print("\n" + "=" * 50)
    print(f"TABLE: {table_name}")
    print("=" * 50)


    # Get column names

    cursor.execute(
        f"PRAGMA table_info([{table_name}])"
    )

    columns = cursor.fetchall()


    print("\nCOLUMNS")

    for column in columns:

        column_id = column[0]
        name = column[1]
        data_type = column[2]
        not_null = column[3]
        default_value = column[4]
        primary_key = column[5]

        print(
            f"{column_id}: "
            f"{name} "
            f"({data_type}) "
            f"PK={primary_key} "
            f"NOT_NULL={not_null} "
            f"DEFAULT={default_value}"
        )


    # Get rows

    cursor.execute(
        f"SELECT * FROM [{table_name}]"
    )

    rows = cursor.fetchall()


    print("\nROWS")

    if not rows:

        print("No rows.")

    else:

        for row in rows:
            print(row)


conn.close()


print("\n")
print("=" * 50)
print("DONE")
print("=" * 50)