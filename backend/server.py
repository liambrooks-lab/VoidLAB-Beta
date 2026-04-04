import os
import re
import shutil
import sqlite3
import subprocess
import sys
import tempfile

from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)


def get_allowed_origins():
    raw_origins = os.getenv("ALLOWED_ORIGINS", "*").strip()

    if raw_origins == "*":
        return "*"

    return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]


CORS(app, resources={r"/*": {"origins": get_allowed_origins()}})

SUPPORTED_LANGUAGES = {"python", "javascript", "cpp", "c", "java", "sql"}
SQL_ROW_QUERIES = ("select", "with", "pragma")


def get_java_class_name(code):
    match = re.search(r"public\s+class\s+(\w+)", code)
    return match.group(1) if match else "Main"


def is_runtime_available(command):
    if command == sys.executable:
        return True

    return shutil.which(command) is not None


def runtime_matrix():
    return {
        "python": is_runtime_available(sys.executable),
        "javascript": is_runtime_available("node"),
        "c": is_runtime_available("gcc"),
        "cpp": is_runtime_available("g++"),
        "java": is_runtime_available("javac") and is_runtime_available("java"),
        "sql": True,
    }


def unavailable_runtime_message(language):
    return (
        f"{language.upper()} is not available on this backend right now. "
        "Python, browser JavaScript, HTML/CSS preview, and SQL work smoothly in free deployment. "
        "For C, C++, and Java you may need local toolchains or a custom container image."
    )


def seed_demo_database(connection):
    connection.executescript(
        """
        CREATE TABLE users (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            region TEXT NOT NULL,
            active INTEGER NOT NULL
        );

        CREATE TABLE projects (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            owner_id INTEGER NOT NULL,
            status TEXT NOT NULL,
            budget INTEGER NOT NULL,
            FOREIGN KEY (owner_id) REFERENCES users(id)
        );

        CREATE TABLE tasks (
            id INTEGER PRIMARY KEY,
            project_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            priority TEXT NOT NULL,
            done INTEGER NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id)
        );

        INSERT INTO users (id, name, region, active) VALUES
            (1, 'Ava', 'North America', 1),
            (2, 'Rohan', 'South Asia', 1),
            (3, 'Mila', 'Europe', 0);

        INSERT INTO projects (id, name, owner_id, status, budget) VALUES
            (1, 'Atlas UI', 1, 'active', 12000),
            (2, 'Void Engine', 2, 'active', 19000),
            (3, 'Delta Docs', 3, 'paused', 4500);

        INSERT INTO tasks (id, project_id, title, priority, done) VALUES
            (1, 1, 'Build dashboard shell', 'high', 1),
            (2, 1, 'Finish mobile nav', 'medium', 0),
            (3, 2, 'Wire preview endpoint', 'high', 1),
            (4, 2, 'Add SQL examples', 'medium', 1),
            (5, 3, 'Refresh docs theme', 'low', 0);
        """
    )


def execute_sql(code):
    statements = [statement.strip() for statement in code.split(";") if statement.strip()]

    if not statements:
        return {"output": "No SQL query provided.", "result": None}

    with sqlite3.connect(":memory:") as connection:
        connection.row_factory = sqlite3.Row
        seed_demo_database(connection)

        if len(statements) > 1:
            connection.executescript(";\n".join(statements[:-1]) + ";")

        final_statement = statements[-1]
        cursor = connection.execute(final_statement)

        if cursor.description and final_statement.lower().startswith(SQL_ROW_QUERIES):
            columns = [column[0] for column in cursor.description]
            rows = [dict(row) for row in cursor.fetchall()]
            row_count = len(rows)
            summary = f"Returned {row_count} row{'s' if row_count != 1 else ''}."
            return {
                "output": summary,
                "result": {
                    "columns": columns,
                    "rows": rows,
                    "summary": summary,
                },
            }

        connection.commit()
        affected_rows = cursor.rowcount if cursor.rowcount != -1 else connection.total_changes
        summary = f"Statement executed successfully. {affected_rows} row(s) affected."
        return {
            "output": summary,
            "result": {
                "columns": [],
                "rows": [],
                "summary": summary,
            },
        }


def get_extension(language):
    return {
        "python": ".py",
        "javascript": ".js",
        "c": ".c",
        "cpp": ".cpp",
        "java": ".java",
    }.get(language, ".txt")


def get_compile_command(language, filename, temp_dir):
    if language == "c":
        return ["gcc", filename, "-o", os.path.join(temp_dir, "a.out")]
    if language == "cpp":
        return ["g++", filename, "-o", os.path.join(temp_dir, "a.out")]
    if language == "java":
        return ["javac", filename]
    return None


def get_run_command(language, filename, temp_dir, class_name):
    if language == "python":
        return [sys.executable, filename]
    if language == "javascript":
        return ["node", filename]
    if language in {"c", "cpp"}:
        return [os.path.join(temp_dir, "a.out")]
    if language == "java":
        return ["java", "-cp", temp_dir, class_name]
    return [sys.executable, filename]


@app.route("/", methods=["GET"])
def root():
    return jsonify(
        {
            "service": "VoidLAB execution backend",
            "status": "ok",
            "available_languages": runtime_matrix(),
        }
    )


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "available_languages": runtime_matrix()})


@app.route("/run", methods=["POST"])
def run_code():
    data = request.get_json(silent=True) or {}
    language = (data.get("language") or "").strip().lower()
    code = data.get("code") or ""

    if language not in SUPPORTED_LANGUAGES:
        return jsonify({"error": f"Unsupported language '{language}'."}), 400

    if not code.strip():
        return jsonify({"error": "No code provided."}), 400

    if language == "sql":
        try:
            return jsonify(execute_sql(code))
        except sqlite3.Error as exc:
            return jsonify({"error": f"SQL error: {exc}"}), 400

    required_commands = []
    if language == "python":
        required_commands = [sys.executable]
    elif language == "javascript":
        required_commands = ["node"]
    elif language == "c":
        required_commands = ["gcc"]
    elif language == "cpp":
        required_commands = ["g++"]
    elif language == "java":
        required_commands = ["javac", "java"]

    if any(not is_runtime_available(command) for command in required_commands):
        return jsonify({"error": unavailable_runtime_message(language)}), 503

    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            if language == "java":
                class_name = get_java_class_name(code)
                filename = os.path.join(temp_dir, f"{class_name}.java")
            else:
                class_name = "Main"
                filename = os.path.join(temp_dir, f"Main{get_extension(language)}")

            with open(filename, "w", encoding="utf-8") as handle:
                handle.write(code)

            compile_command = get_compile_command(language, filename, temp_dir)
            if compile_command:
                compile_result = subprocess.run(
                    compile_command,
                    capture_output=True,
                    text=True,
                    timeout=12,
                )
                if compile_result.returncode != 0:
                    return jsonify(
                        {
                            "output": compile_result.stderr or "Compilation failed.",
                        }
                    )

            run_command = get_run_command(language, filename, temp_dir, class_name)
            run_result = subprocess.run(
                run_command,
                capture_output=True,
                text=True,
                timeout=12,
            )

            rendered_output = (run_result.stdout or "") + (run_result.stderr or "")
            return jsonify({"output": rendered_output or "No output generated."})

    except subprocess.TimeoutExpired:
        return jsonify({"output": "Execution timed out after 12 seconds."}), 408
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")), debug=False)
