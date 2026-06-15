# ThesaurUs

A context-aware synonym recommendation and NLP pipeline backend.

---

## 🚀 Getting Started

### 1. Prerequisites & Virtual Environment

This project uses Python. It is recommended to run commands within the provided virtual environment (`.venv`).

To activate the virtual environment:
- **Command Prompt (CMD):**
  ```cmd
  .venv\Scripts\activate.bat
  ```
- **PowerShell:**
  ```powershell
  .venv\Scripts\Activate.ps1
  ```

---

## 🛠️ Useful Terminal Commands

Here are the key commands you need to develop, test, and run the project.

### 🗄️ Database Operations
Initialize the SQLite schema and populate the database with a preset list of overused words and synonyms:
```bash
python scripts/populate_db.py
```
*Note: This script automatically reads the schema from `database/init.sql` and generates/updates `thesaurus.db` at the root of the workspace.*

### 🧪 Running Unit Tests
Run the entire unittest suite:
```bash
.venv\Scripts\python.exe -m unittest discover tests
```
*(Or simply `python -m unittest discover tests` if the virtual environment is activated.)*

### 💻 Running the Overuse Demo
Launch the interactive command-line demo that highlights overused words in a paragraph with continuous yellow-to-red color gradients:
```bash
python scripts/demo_overuse.py
```

### ⚡ Starting the FastAPI Server
To start the backend development server with hot-reload enabled:
```bash
.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```
Once running, you can access:
- **API Root:** `http://127.0.0.1:8000/`
- **Interactive API Documentation (Swagger UI):** `http://127.0.0.1:8000/docs`
- **Health Check Endpoint:** `http://127.0.0.1:8000/health`
- **Synonyms Lookup Endpoint:** `http://127.0.0.1:8000/synonyms?word=happy`

---

## 📁 Repository Structure

- `app/` - The core application codebase.
  - `main.py` - FastAPI application entrypoint, endpoints, and database handlers.
- `database/` - Database SQL schemas and migrations.
  - `init.sql` - Table definitions for the SQLite database.
- `scripts/` - Scripts for database population, command-line demos, and utilities.
  - `populate_db.py` - Seeding script for the static synonym database.
  - `demo_overuse.py` - Interactive CLI text overuse visualizer.
- `tests/` - Python unit tests suite.
  - `test_api.py` - Endpoint testing.
  - `test_overuse.py` - Naive overuse logic validation.
