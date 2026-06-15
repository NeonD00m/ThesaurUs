import os
import sqlite3

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

    # Define minimum synonyms dictionary
    synonyms_dict = {
        "happy": ["joyful", "cheerful", "delighted", "glad", "content"],
        "sad": ["unhappy", "gloomy", "sorrowful", "dejected", "depressed"],
        "fast": ["quick", "rapid", "swift", "speedy", "fleet"],
        "lazy": ["sluggish", "idle", "inactive", "slothful", "lethargic"],
        "sleepy": ["drowsy", "tired", "somnolent", "slumbrous"],
        "tired": ["exhausted", "fatigued", "weary", "worn out", "sleepy"],
        "very": ["extremely", "exceedingly", "highly", "incredibly", "greatly"],
        "energetic": ["active", "lively", "dynamic", "vigorous", "spirited"],
        "quick": ["fast", "rapid", "swift", "prompt", "speedy"],
        "good": ["excellent", "fine", "superb", "wonderful", "great"],
        "bad": ["poor", "terrible", "awful", "dreadful", "substandard"],
    }

    # Insert or update entries
    synset_count = 0
    word_count = 0
    mapping_count = 0
    for word, syns in synonyms_dict.items():
        # create a synset for each unique 'meaning'
        synset_id, created_synset = get_or_create_synset_id(
            cursor, f"manual.{word}", f"Sense of {word}"
        )
        if created_synset:
            synset_count += 1

        # iterate over synonyms AND original word
        for s in syns + [word]:
            # add given word to words list
            word_id, created_word = get_or_create_word_id(cursor, s.lower())
            if created_word:
                word_count += 1
            # map this word to the current synset
            cursor.execute(
                "INSERT OR IGNORE INTO word_synset_map (word_id, synset_id) VALUES (?, ?)",
                (word_id, synset_id),
            )
            if cursor.rowcount > 0:
                mapping_count += 1

    conn.commit()
    conn.close()
    print(
        "Successfully populated thesaurus.db "
        f"({synset_count} new synsets, {word_count} new words, {mapping_count} new mappings)."
    )


if __name__ == "__main__":
    main()
