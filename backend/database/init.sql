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
