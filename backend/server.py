from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import tempfile
import sys
import os
import re

app = Flask(__name__)
CORS(app)

def get_java_class_name(code):
    """Extracts the public class name from Java code to ensure correct file naming."""
    match = re.search(r'public\s+class\s+(\w+)', code)
    if match:
        return match.group(1)
    return "Main"

@app.route("/run", methods=["POST"])
def run_code():
    data = request.json
    language = data.get("language")
    code = data.get("code")

    if not code:
        return jsonify({"error": "No code provided"}), 400

    try:
        # TemporaryDirectory ensures absolute cleanup of .class, .out, and source files
        with tempfile.TemporaryDirectory() as temp_dir:
            if language == "java":
                classname = get_java_class_name(code)
                filename = os.path.join(temp_dir, f"{classname}.java")
            else:
                classname = "Main"
                filename = os.path.join(temp_dir, f"Main{get_extension(language)}")
            
            with open(filename, "w", encoding="utf-8") as f:
                f.write(code)

            # Phase 1: Compilation (C, C++, Java)
            compile_command = get_compile_command(language, filename, temp_dir)
            if compile_command:
                compile_result = subprocess.run(
                    compile_command, capture_output=True, text=True, timeout=10
                )
                if compile_result.returncode != 0:
                    return jsonify({"output": compile_result.stderr or "Compilation Error"})

            # Phase 2: Execution
            run_command = get_run_command(language, filename, temp_dir, classname)
            result = subprocess.run(
                run_command,
                capture_output=True,
                text=True,
                timeout=10
            )

            output = result.stdout + result.stderr
            return jsonify({"output": output or "No output generated."})

    except subprocess.TimeoutExpired:
        return jsonify({"output": "Execution Error: Code took too long to run (Timeout)."})
    except Exception as e:
        return jsonify({"error": str(e)})

def get_extension(lang):
    return {
        "python": ".py", "javascript": ".js",
        "c": ".c", "cpp": ".cpp", "java": ".java"
    }.get(lang, ".txt")

def get_compile_command(lang, filename, temp_dir):
    if lang == "c":
        return ["gcc", filename, "-o", os.path.join(temp_dir, "a.out")]
    if lang == "cpp":
        return ["g++", filename, "-o", os.path.join(temp_dir, "a.out")]
    if lang == "java":
        return ["javac", filename]
    return None

def get_run_command(lang, filename, temp_dir, classname):
    if lang == "python":
        return [sys.executable, filename]
    if lang == "javascript":
        return ["node", filename]
    if lang in ["c", "cpp"]:
        return [os.path.join(temp_dir, "a.out")]
    if lang == "java":
        return ["java", "-cp", temp_dir, classname]
    return [sys.executable, filename]

if __name__ == "__main__":
    app.run(port=5000, debug=True)