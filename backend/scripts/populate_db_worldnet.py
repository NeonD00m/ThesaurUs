"""
Populate thesaurus.db using NLTK WordNet synsets.

This script will:
- Ensure WordNet corpora are downloaded (tries to download if missing).
- Read and apply the project's SQL schema if present. If applying the schema fails
  it falls back to creating the expected tables with correct SQL.
- Iterate over WordNet synsets and insert a synset row per WordNet synset,
  inserting each lemma as a word and mapping words to synsets.

Notes:
- This can insert a lot of rows (WordNet contains many synsets). The script
  commits in batches to avoid long transactions and high memory usage.
- If you want to restrict which synsets are inserted, modify the iteration
  over `wn.all_synsets()` (for example filtering by `pos` or by `wn.synsets(word)`).
"""

import os
import sqlite3
import sys

try:
    from db_seed_utils import (
        ensure_schema,
        get_or_create_synset_id,
        get_or_create_word_id,
    )
except ModuleNotFoundError:
    from scripts.db_seed_utils import (
        ensure_schema,
        get_or_create_synset_id,
        get_or_create_word_id,
    )

try:
    import nltk
    from nltk.corpus import wordnet as wn
except Exception:
    print("NLTK is not installed. Install it with: pip install nltk")
    sys.exit(1)

# Ensure WordNet corpora are available, these calls are idempotent.
for pkg in ("wordnet", "omw-1.4"):
    try:
        nltk.data.find(f"corpora/{pkg}")
    except LookupError:
        print(f"Downloading NLTK corpus: {pkg}...")
        nltk.download(pkg, quiet=True)


def main():
    # Determine paths relative to this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, ".."))

    db_path = os.path.join(project_root, "thesaurus.db")
    schema_path = os.path.join(project_root, "database", "init.sql")

    print(f"Connecting to database at: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    ensure_schema(cursor, schema_path)

    # Iterate over WordNet synsets and populate the DB, commit periodically to avoid huge transactions
    batch_commit = 500
    created_synset_count = 0
    created_word_count = 0
    mapping_count = 0

    print("Beginning WordNet iteration. This may take a few minutes...")
    for idx, syn in enumerate(wn.all_synsets()):
        synset_id, created_synset = get_or_create_synset_id(
            cursor, syn.name(), syn.definition()
        )
        if created_synset:
            created_synset_count += 1

        for lemma in syn.lemmas():
            word_id, created_word = get_or_create_word_id(
                cursor, lemma.name().replace("_", " ").lower()
            )
            if created_word:
                created_word_count += 1
            cursor.execute(
                "INSERT OR IGNORE INTO word_synset_map (word_id, synset_id) VALUES (?, ?)",
                (word_id, synset_id),
            )
            if cursor.rowcount > 0:
                mapping_count += 1

        # Periodic commit and progress message
        if (idx + 1) % batch_commit == 0:
            conn.commit()
            print(
                f"Processed {idx + 1} synsets "
                f"({created_synset_count} new synsets, {mapping_count} new mappings so far)"
            )

    conn.commit()
    conn.close()

    print(
        "Finished. "
        f"Created {created_synset_count} synsets, {created_word_count} words, "
        f"and {mapping_count} word mappings in thesaurus.db."
    )


if __name__ == "__main__":
    main()
