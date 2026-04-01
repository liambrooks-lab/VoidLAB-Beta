import "./App.css";
import logo from "./assets/logo.png";
import Editor from "@monaco-editor/react";
import { useState, useRef, useEffect } from "react";
import Login from "./Login";

/* ================= Templates ================= */
const templates = {
  python: `a = 10\nb = 20\nprint(a + b)`,
  javascript: `console.log(10 + 20);`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n  cout << 10 + 20;\n  return 0;\n}`,
  c: `#include <stdio.h>\n\nint main() {\n  printf("%d", 10 + 20);\n  return 0;\n}`,
  java: `public class Main {\n  public static void main(String[] args) {\n    System.out.println(10 + 20);\n  }\n}`
};

const STORAGE_KEY = "voidlab_beta_state";
const PROFILE_KEY = "voidlab_beta_profile";

function App() {
  const [saved, setSaved] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch { return {}; }
  });

  const [profile, setProfile] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(PROFILE_KEY)) || null;
    } catch {
      return null;
    }
  });

  const isMobile = window.innerWidth <= 768;
  const editorRef = useRef(null);
  const containerRef = useRef(null);
  const isDragging = useRef(false);

  /* ================= States ================= */
  const [language, setLanguage] = useState(saved.language || "python");
  const [editorWidth, setEditorWidth] = useState(saved.editorWidth || 65);
  
  // Implemented robust cache to save code per language
  const [codeCache, setCodeCache] = useState(saved.codeCache || templates);
  const [output, setOutput] = useState("// Ready");
  const [isRunning, setIsRunning] = useState(false);

  /* ================= Persist ================= */
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ language, codeCache, editorWidth }));
  }, [language, codeCache, editorWidth]);

  /* ================= Execution ================= */
  const runCode = async () => {
    const currentCode = codeCache[language] || "";
    
    if (!currentCode.trim()) {
      setOutput("⚠ Write some code first");
      return;
    }

    setIsRunning(true);
    try {
      const langMap = { python: "python", javascript: "javascript", cpp: "cpp", c: "c", java: "java" };

      // Use local VoidLAB backend (see backend/server.py)
      const res = await fetch("http://localhost:5000/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // FIX: Match the exact JSON structure backend/server.py expects
        body: JSON.stringify({
          language: langMap[language],
          code: currentCode
        })
      });

      const data = await res.json();
      let result = "";

      if (!res.ok) {
        const msg = data?.error || data?.message || `Backend request failed (${res.status} ${res.statusText}).`;
        setOutput("❌ " + msg);
        setIsRunning(false);
        return;
      }

      // FIX: Match the "output" and "error" keys returned from backend/server.py
      if (data.output) result += data.output;
      if (data.error) result += (result ? "\n" : "") + "❌ Error:\n" + data.error;

      setOutput(result || "⚠ No output generated.");
    } catch {
      setOutput(
        "❌ Execution backend unreachable.\n" +
        "Make sure your local VoidLAB backend is running (python backend/server.py)."
      );
    }
    setIsRunning(false);
  };

  /* ================= Handlers ================= */
  const changeLanguage = (lang) => {
    setLanguage(lang);
    setOutput("// Ready");
  };

  const updateCode = (value) => {
    setCodeCache(prev => ({ ...prev, [language]: value || "" }));
  };

  /* ================= Resize Logic ================= */
  const onMouseDown = () => { if (!isMobile) isDragging.current = true; };
  const onMouseMove = (e) => {
    if (isMobile || !isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const w = ((e.clientX - rect.left) / rect.width) * 100;
    if (w > 25 && w < 80) setEditorWidth(w);
  };
  const onMouseUp = () => (isDragging.current = false);

  /* ================= Render UI ================= */
  
  // FIX: Stricter profile check to ensure corrupted/empty local storage doesn't bypass login
  if (!profile || !profile.name) {
    return (
      <Login
        brandImageSrc={logo}
        onSubmit={(p) => {
          setProfile(p);
          localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
        }}
      />
    );
  }

  return (
    <div className="app" onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
      <div className="topbar">
        <div className="brand">
          <img src={logo} alt="logo" className="brand-logo" />
          <span className="brand-text">VoidLAB Beta</span>
        </div>

        <div className="topbar-right">
          <div className="user-pill" title={`${profile.name} • ${profile.region}`}>
            <div className="user-pill-dot" aria-hidden="true" />
            <span className="user-pill-name">{profile.name}</span>
            <button
              className="user-pill-btn"
              onClick={() => {
                localStorage.removeItem(PROFILE_KEY);
                setProfile(null);
              }}
              type="button"
              aria-label="Sign out"
            >
              Sign out
            </button>
          </div>

          <select className="lang-select" value={language} onChange={(e) => changeLanguage(e.target.value)}>
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="cpp">C++</option>
            <option value="c">C</option>
            <option value="java">Java</option>
          </select>

          {!isMobile && (
            <button className="run-btn" onClick={runCode} disabled={isRunning}>
              {isRunning ? "Running..." : "Run"}
            </button>
          )}
        </div>
      </div>

      <div className="main" ref={containerRef}>
        <div className="editor-area" style={!isMobile ? { width: `${editorWidth}%` } : {}}>
          <Editor
            height="100%"
            language={language}
            theme="vs-dark"
            value={codeCache[language]}
            onChange={updateCode}
            onMount={(editor) => {
              editorRef.current = editor;
              editor.updateOptions({ contextmenu: true });
            }}
            options={{ fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false }}
          />
        </div>

        {!isMobile && <div className="resize-bar" onMouseDown={onMouseDown} />}

        <div className="output-area" style={!isMobile ? { width: `${100 - editorWidth}%` } : {}}>
          {isRunning ? (
            <div className="terminal-loader-container">
              <div className="spinner"></div>
              <span>Executing code...</span>
            </div>
          ) : (
            <pre>{output}</pre>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;