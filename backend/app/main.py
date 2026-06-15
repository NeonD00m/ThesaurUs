import math
import os
import string
import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Try importing numpy and transformers to verify they can be imported.
# We'll expose status of these dependencies in a health check endpoint.
try:
    import numpy as np

    NUMPY_AVAILABLE = True
    NUMPY_VERSION = np.__version__
except ImportError:
    NUMPY_AVAILABLE = False
    NUMPY_VERSION = "Not Available"

try:
    import aiosqlite as sql

    AIOSQLITE_AVAILABLE = True
    AIOSQLITE_VERSION = sql.__version__
except ImportError:
    AIOSQLITE_AVAILABLE = False
    AIOSQLITE_VERSION = "Not Available"

try:
    import torch
    import transformers

    TRANSFORMERS_AVAILABLE = True
    TRANSFORMERS_VERSION = transformers.__version__
    TORCH_AVAILABLE = True
    TORCH_VERSION = torch.__version__
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    TRANSFORMERS_VERSION = "Not Available"
    TORCH_AVAILABLE = False
    TORCH_VERSION = "Not Available"

app = FastAPI(
    title="ThesaurUs API",
    description="Context-aware synonym recommendation and NLP pipeline backend",
    version="0.1.0",
)

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.environ.get("THESAURUS_DB_PATH", "thesaurus.db")


@app.get("/")
def read_root():
    """
    Root endpoint serving basic API metadata.
    """
    return {
        "app": "ThesaurUs API",
        "status": "running",
        "timestamp": time.time(),
        "documentation": "/docs",
    }


@app.get("/health")
def health_check():
    """
    Health check endpoint verifying availability of key machine learning dependencies.
    """
    return {
        "status": "healthy",
        "dependencies": {
            "numpy": {"available": NUMPY_AVAILABLE, "version": NUMPY_VERSION},
            "transformers": {
                "available": TRANSFORMERS_AVAILABLE,
                "version": TRANSFORMERS_VERSION,
            },
            "torch": {"available": TORCH_AVAILABLE, "version": TORCH_VERSION},
            "aiosqlite": {
                "available": AIOSQLITE_AVAILABLE,
                "version": AIOSQLITE_VERSION,
            },
        },
    }


def clean_tokens(raw_text: str):
    words = raw_text.lower().split(" ")
    tokens = [
        word.strip(string.punctuation) for word in words
    ]  # remove punctuation for each word
    return [t for t in tokens]  # clear empty tokens


def get_frequencies(tokens: [str]):
    counts = {}
    for word in tokens:
        counts[word] = 1 + counts.get(word, 0)
    return counts


def naive_overuse(counts):
    """Naive overuse detection based on frequency counts. Future: account for tenses or conjugations"""
    threshold = len(counts) * 0.05
    ranking = []  # only include words that have multiple occurences, take up more than threshold, and sort by frequency
    for word, count in counts.items():
        if count > 1 and count >= threshold:
            i, ranked = 0, len(ranking)
            while i < ranked and count < ranking[i][1]:
                i += 1
            ranking.insert(i, (word, count))
    return ranking


@app.get("/submit")
def submit_text(text: str):
    """
    Endpoint to submit text for initial analysis. Currently performs naive overuse detection.
    Future: integrate with context-aware synonym recommendation and NLP pipeline.
    """
    tokens = clean_tokens(text)
    frequencies = get_frequencies(tokens)
    overused_words = naive_overuse(frequencies)
    return {
        "original_text": text,
        "tokens": tokens,
        "frequencies": frequencies,
        "overused_words": overused_words,
    }


async def fetch_synonyms(word: str):
    if not AIOSQLITE_AVAILABLE:
        return []
    async with sql.connect(DB_PATH) as db:
        async with db.execute(
            """
            SELECT DISTINCT synonym.word
            FROM words AS source
            JOIN word_synset_map AS source_map
                ON source_map.word_id = source.id
            JOIN word_synset_map AS synonym_map
                ON synonym_map.synset_id = source_map.synset_id
            JOIN words AS synonym
                ON synonym.id = synonym_map.word_id
            WHERE source.word = ?
                AND synonym.word != source.word
            ORDER BY synonym.word;
            """,
            (word,),
        ) as cursor:
            rows = await cursor.fetchall()
            return [row[0] for row in rows]


@app.get("/synonyms")
async def get_synonyms(word: str):
    """Endpoint to retrieve synonyms for a given word."""
    clean_word = word.strip().lower()
    synonyms = await fetch_synonyms(clean_word)

    return {"word": word, "synonyms": synonyms}
