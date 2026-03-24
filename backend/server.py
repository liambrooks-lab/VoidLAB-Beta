from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import tempfile
import sys
import os

app = Flask(__name__)
CORS(app)


@app.route("/run", methods=["POST"])
def run_code():
    data = request.json

    language = data.get("language")
    code = data.get("code")

    if not code:
        return jsonify({"error": "No code provided"}), 400

    try:
        # Use a TemporaryDirectory so compiled .class and binary .out files get cleaned up too!
        with tempfile.TemporaryDirectory() as temp_dir:
            filename = os.path.join(temp_dir, f"Main{get_extension(language)}")
            
            with open(filename, "w", encoding="utf-8") as f:
                f.write(code)

            # 1. Compile (if applicable)
            compile_command = get_compile_command(language, filename, temp_dir)
            if compile_command:
                compile_result = subprocess.run(
                    compile_command, capture_output=True, text=True, timeout=5
                )
                if compile_result.returncode != 0:
                    return jsonify({"output": compile_result.stderr or "Compilation Error"})

            # 2. Run
            run_command = get_run_command(language, filename, temp_dir)
            result = subprocess.run(
                run_command,
                capture_output=True,
                text=True,
                timeout=5
            )

            output = result.stdout + result.stderr
            if not output.strip():
                output = "No output"

            return jsonify({"output": output})

    except subprocess.TimeoutExpired:
        return jsonify({"output": "Error: Code took too long to run (timeout)"})

    except Exception as e:
        return jsonify({"error": str(e)})


def get_extension(lang):
    return {
        "python": ".py",
        "javascript": ".js",
        "c": ".c",
        "cpp": ".cpp",
        "java": ".java"
    }.get(lang, ".txt")


def get_compile_command(lang, filename, temp_dir):
    if lang == "c":
        exe = os.path.join(temp_dir, "a.out")
        return ["gcc", filename, "-o", exe]
    
    if lang == "cpp":
        exe = os.path.join(temp_dir, "a.out")
        return ["g++", filename, "-o", exe]
        
    if lang == "java":
        return ["javac", filename]
        
    return None


def get_run_command(lang, filename, temp_dir):
    if lang == "python":
        return [sys.executable, filename]

    if lang == "javascript":
        return ["node", filename]

    if lang in ["c", "cpp"]:
        exe = os.path.join(temp_dir, "a.out")
        return [exe]

    if lang == "java":
        # Java needs the classpath directory and the raw ClassName, not the file path
        return ["java", "-cp", temp_dir, "Main"]

    return [sys.executable, filename]


if __name__ == "__main__":
    app.run(port=5000, debug=True)