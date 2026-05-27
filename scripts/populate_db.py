import os
import sqlite3

def main():
    # Determine paths relative to this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, ".."))
    
    db_path = os.path.join(project_root, "thesaurus.db")
    schema_path = os.path.join(project_root, "database", "init.sql")
    
    print(f"Connecting to database at: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 1. Initialize schema
    if os.path.exists(schema_path):
        print(f"Initializing schema from {schema_path}...")
        with open(schema_path, "r", encoding="utf-8") as f:
            schema_sql = f.read()
        cursor.executescript(schema_sql)
    else:
        print("Schema file not found. Creating table synonyms directly...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS synonyms (
                word TEXT PRIMARY KEY,
                synonyms_csv TEXT
            );
        """)
    
    # 2. Define synonyms dictionary
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
        "bad": ["poor", "terrible", "awful", "dreadful", "substandard"]
    }
    
    # 3. Insert or replace entries
    print("Populating database with synonyms...")
    count = 0
    for word, syns in synonyms_dict.items():
        csv_string = ", ".join(syns)
        # Standardize key word to lowercase
        word_lower = word.lower().strip()
        cursor.execute(
            "INSERT OR REPLACE INTO synonyms (word, synonyms_csv) VALUES (?, ?)",
            (word_lower, csv_string)
        )
        count += 1
        print(f"  - {word_lower} -> {csv_string}")
        
    conn.commit()
    conn.close()
    print(f"Successfully populated {count} words in thesaurus.db!")

if __name__ == "__main__":
    main()
