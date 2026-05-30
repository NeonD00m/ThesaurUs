import os
import sqlite3


def ensure_schema(cursor: sqlite3.Cursor, schema_sql_path: str) -> None:
    """Apply the project schema and migrate older local lesson databases."""
    if os.path.exists(schema_sql_path):
        print(f"Initializing schema from {schema_sql_path}...")
        with open(schema_sql_path, "r", encoding="utf-8") as f:
            cursor.executescript(f.read())
    else:
        print("Schema file not found. Creating synset tables directly...")
        cursor.executescript(
            """
            CREATE TABLE IF NOT EXISTS synsets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE,
                definition TEXT
            );

            CREATE TABLE IF NOT EXISTS words (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                word TEXT UNIQUE
            );

            CREATE TABLE IF NOT EXISTS word_synset_map (
                word_id INTEGER,
                synset_id INTEGER,
                PRIMARY KEY (word_id, synset_id),
                FOREIGN KEY (word_id) REFERENCES words(id),
                FOREIGN KEY (synset_id) REFERENCES synsets(id)
            );

            CREATE INDEX IF NOT EXISTS idx_word_text ON words(word);
            """
        )

    _ensure_synset_name_column(cursor)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_word_text ON words(word);")


def _ensure_synset_name_column(cursor: sqlite3.Cursor) -> None:
    cursor.execute("PRAGMA table_info(synsets);")
    columns = {row[1] for row in cursor.fetchall()}
    if "name" in columns:
        return

    cursor.execute("ALTER TABLE synsets ADD COLUMN name TEXT;")
    cursor.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_synsets_name ON synsets(name);"
    )


def get_or_create_synset_id(
    cursor: sqlite3.Cursor, name: str, definition: str
) -> tuple[int, bool]:
    cursor.execute(
        "INSERT OR IGNORE INTO synsets (name, definition) VALUES (?, ?)",
        (name, definition),
    )
    created = cursor.rowcount > 0
    cursor.execute("SELECT id FROM synsets WHERE name = ?", (name,))
    row = cursor.fetchone()
    if row is None:
        raise RuntimeError(f"Could not find synset after insert: {name}")
    return row[0], created


def get_or_create_word_id(cursor: sqlite3.Cursor, word: str) -> tuple[int, bool]:
    cursor.execute("INSERT OR IGNORE INTO words (word) VALUES (?)", (word,))
    created = cursor.rowcount > 0
    cursor.execute("SELECT id FROM words WHERE word = ?", (word,))
    row = cursor.fetchone()
    if row is None:
        raise RuntimeError(f"Could not find word after insert: {word}")
    return row[0], created
