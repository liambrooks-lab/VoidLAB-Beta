import "./App.css";
import logo from "./assets/logo.png";
import Editor from "@monaco-editor/react";
import { useEffect, useMemo, useRef, useState } from "react";
import Login from "./Login";
import WebPreview from "./WebPreview";

const STORAGE_KEY = "voidlab_beta_state";
const PROFILE_KEY = "voidlab_beta_profile";
const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "");

const LANGUAGE_CONFIG = {
  python: { label: "Python", editor: "python", mode: "backend", runLabel: "Run Python" },
  javascript: { label: "JavaScript", editor: "javascript", mode: "browser", runLabel: "Run JavaScript" },
  cpp: { label: "C++", editor: "cpp", mode: "backend", runLabel: "Run C++" },
  c: { label: "C", editor: "c", mode: "backend", runLabel: "Run C" },
  java: { label: "Java", editor: "java", mode: "backend", runLabel: "Run Java" },
  html: { label: "HTML", editor: "html", mode: "preview", runLabel: "Refresh Preview", previewLabel: "Open HTML Preview" },
  css: { label: "CSS", editor: "css", mode: "preview", runLabel: "Refresh Preview", previewLabel: "Open CSS Preview" },
  sql: { label: "SQL", editor: "sql", mode: "sql", runLabel: "Run SQL", previewLabel: "Open SQL Preview" },
};

const templates = {
  python: `a = 10
b = 20
print(a + b)`,
  javascript: `const numbers = [10, 20, 30];
console.log("Total:", numbers.reduce((sum, value) => sum + value, 0));`,
  cpp: `#include <iostream>
using namespace std;

int main() {
  cout << 10 + 20;
  return 0;
}`,
  c: `#include <stdio.h>

int main() {
  printf("%d", 10 + 20);
  return 0;
}`,
  java: `public class Main {
  public static void main(String[] args) {
    System.out.println(10 + 20);
  }
}`,
  html: `<main class="hero">
  <section class="card">
    <p class="eyebrow">VoidLAB Preview</p>
    <h1>Build fast in the browser.</h1>
    <p>Edit the HTML and switch to CSS to restyle this page instantly.</p>
    <button>Launch Project</button>
  </section>
</main>`,
  css: `:root {
  color-scheme: dark;
  --bg: #020617;
  --panel: rgba(15, 23, 42, 0.92);
  --accent: #38bdf8;
  --accent-strong: #22d3ee;
  --text: #e2e8f0;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: Inter, system-ui, sans-serif;
  background:
    radial-gradient(circle at top, rgba(34, 211, 238, 0.18), transparent 28%),
    linear-gradient(180deg, #020617 0%, #0f172a 100%);
  color: var(--text);
}

.hero {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
}

.card {
  width: min(560px, 100%);
  padding: 32px;
  border-radius: 28px;
  background: var(--panel);
  border: 1px solid rgba(148, 163, 184, 0.22);
  box-shadow: 0 28px 80px rgba(2, 6, 23, 0.5);
}

.eyebrow {
  margin: 0 0 12px;
  color: var(--accent);
  font-size: 0.82rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

h1 {
  margin: 0 0 12px;
  font-size: clamp(2.2rem, 6vw, 4rem);
}

p {
  line-height: 1.7;
}

button {
  margin-top: 18px;
  padding: 12px 18px;
  border: 0;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--accent), var(--accent-strong));
  color: #020617;
  font-weight: 700;
}`,
  sql: `SELECT
  p.name AS project_name,
  u.name AS owner_name,
  p.status,
  COUNT(t.id) AS total_tasks,
  SUM(CASE WHEN t.done = 1 THEN 1 ELSE 0 END) AS completed_tasks
FROM projects p
JOIN users u ON u.id = p.owner_id
LEFT JOIN tasks t ON t.project_id = p.id
GROUP BY p.id, u.name
ORDER BY p.name;`,
};

const SQL_REFERENCE = [
  "Sample tables available in SQL mode:",
  "users(id, name, region, active)",
  "projects(id, name, owner_id, status, budget)",
  "tasks(id, project_id, title, priority, done)",
];

function getDefaultOutput(language) {
  if (language === "html" || language === "css") {
    return "Preview-ready mode. Use Refresh Preview or Open Preview.";
  }

  if (language === "sql") {
    return SQL_REFERENCE.join("\n");
  }

  if (language === "javascript") {
    return "JavaScript runs directly in the browser for fast cloud-friendly execution.";
  }

  return "// Ready";
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function serializeValue(value) {
  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function buildPreviewDocument(html, css) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>${css}</style>
  </head>
  <body>${html}</body>
</html>`;
}

function buildSqlPreviewDocument(result, sql) {
  const columns = result?.columns || [];
  const rows = result?.rows || [];
  const summary = escapeHtml(result?.summary || "The query did not return any rows.");

  const tableMarkup = columns.length
    ? `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>${columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${
              rows.length
                ? rows
                    .map(
                      (row) =>
                        `<tr>${columns
                          .map((column) => `<td>${escapeHtml(row[column] ?? "")}</td>`)
                          .join("")}</tr>`
                    )
                    .join("")
                : `<tr><td colspan="${columns.length}">No rows returned.</td></tr>`
            }
          </tbody>
        </table>
      </div>`
    : `<div class="sql-empty">${summary}</div>`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>VoidLAB SQL Preview</title>
    <style>
      :root {
        color-scheme: dark;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: Inter, system-ui, sans-serif;
        background:
          radial-gradient(circle at top, rgba(34, 211, 238, 0.14), transparent 24%),
          linear-gradient(180deg, #020617 0%, #0f172a 100%);
        color: #e2e8f0;
        min-height: 100vh;
        padding: 24px;
      }

      .shell {
        max-width: 1080px;
        margin: 0 auto;
        display: grid;
        gap: 20px;
      }

      .card {
        background: rgba(15, 23, 42, 0.86);
        border: 1px solid rgba(148, 163, 184, 0.18);
        border-radius: 24px;
        padding: 20px;
        box-shadow: 0 28px 70px rgba(2, 6, 23, 0.5);
      }

      h1 {
        margin: 0 0 8px;
        font-size: clamp(1.8rem, 3vw, 2.6rem);
      }

      p {
        margin: 0;
        color: rgba(226, 232, 240, 0.72);
      }

      pre {
        margin: 0;
        padding: 16px;
        border-radius: 18px;
        background: rgba(2, 6, 23, 0.85);
        border: 1px solid rgba(148, 163, 184, 0.14);
        overflow: auto;
        white-space: pre-wrap;
        color: #cbd5f5;
      }

      .sql-summary {
        font-weight: 700;
        color: #22d3ee;
      }

      .table-wrap {
        overflow: auto;
        border-radius: 18px;
        border: 1px solid rgba(148, 163, 184, 0.14);
      }

      table {
        width: 100%;
        border-collapse: collapse;
        min-width: 560px;
      }

      th,
      td {
        padding: 14px 16px;
        border-bottom: 1px solid rgba(148, 163, 184, 0.12);
        text-align: left;
      }

      th {
        position: sticky;
        top: 0;
        background: #112038;
        color: #7dd3fc;
      }

      td {
        background: rgba(15, 23, 42, 0.84);
      }

      .sql-empty {
        padding: 18px;
        border-radius: 18px;
        background: rgba(2, 6, 23, 0.82);
        border: 1px dashed rgba(56, 189, 248, 0.28);
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <section class="card">
        <h1>SQL Preview</h1>
        <p>Rendered from the current editor query against the built-in demo dataset.</p>
      </section>

      <section class="card">
        <div class="sql-summary">${summary}</div>
      </section>

      <section class="card">
        <pre>${escapeHtml(sql)}</pre>
      </section>

      <section class="card">
        ${tableMarkup}
      </section>
    </div>
  </body>
</html>`;
}

function buildErrorPreviewDocument(message) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>VoidLAB Preview Error</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        font-family: Inter, system-ui, sans-serif;
        background: #020617;
        color: #f8fafc;
        padding: 24px;
      }

      .card {
        width: min(560px, 100%);
        padding: 24px;
        border-radius: 20px;
        border: 1px solid rgba(248, 113, 113, 0.3);
        background: rgba(127, 29, 29, 0.12);
      }

      h1 {
        margin-top: 0;
      }

      pre {
        white-space: pre-wrap;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Preview failed</h1>
      <pre>${escapeHtml(message)}</pre>
    </div>
  </body>
</html>`;
}

function App() {
  const savedState = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  }, []);

  const [profile, setProfile] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(PROFILE_KEY)) || null;
    } catch {
      return null;
    }
  });

  const containerRef = useRef(null);
  const isDragging = useRef(false);

  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);
  const [language, setLanguage] = useState(savedState.language || "python");
  const [editorWidth, setEditorWidth] = useState(savedState.editorWidth || 60);
  const [codeCache, setCodeCache] = useState(() => ({
    ...templates,
    ...(savedState.codeCache || {}),
  }));
  const [output, setOutput] = useState(
    savedState.output || getDefaultOutput(savedState.language || "python")
  );
  const [sqlResult, setSqlResult] = useState(savedState.sqlResult || null);
  const [isRunning, setIsRunning] = useState(false);
  const [mobilePanel, setMobilePanel] = useState("editor");

  const isMobile = viewportWidth <= 900;
  const currentConfig = LANGUAGE_CONFIG[language];
  const canOpenPreview = currentConfig.mode === "preview" || currentConfig.mode === "sql";

  const previewModel = useMemo(() => {
    const html = language === "html" ? codeCache.html : codeCache.html || templates.html;
    const css = language === "css" ? codeCache.css : codeCache.css || templates.css;

    return { html, css };
  }, [language, codeCache]);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        language,
        editorWidth,
        codeCache,
        output,
        sqlResult,
      })
    );
  }, [codeCache, editorWidth, language, output, sqlResult]);

  useEffect(() => {
    if (isMobile) {
      setMobilePanel("editor");
    }
  }, [isMobile, language]);

  const runBackendCode = async (targetLanguage, targetCode) => {
    const response = await fetch(`${API_BASE_URL}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: targetLanguage,
        code: targetCode,
      }),
    });

    let data = {};

    try {
      data = await response.json();
    } catch {
      throw new Error("The execution server returned an unreadable response.");
    }

    if (!response.ok) {
      throw new Error(
        data.error ||
          data.output ||
          `Execution failed with status ${response.status}.`
      );
    }

    return data;
  };

  const executeBrowserJavaScript = (targetCode) => {
    const logs = [];

    const pushLog = (label, args) => {
      const rendered = args.map((item) => serializeValue(item)).join(" ");
      logs.push(label ? `${label}: ${rendered}` : rendered);
    };

    const runtimeConsole = {
      log: (...args) => pushLog("", args),
      info: (...args) => pushLog("INFO", args),
      warn: (...args) => pushLog("WARN", args),
      error: (...args) => pushLog("ERROR", args),
    };

    try {
      // Monaco snippets need a small sandbox here, so browser JS can run without the backend.
      // eslint-disable-next-line no-new-func
      const result = new Function(
        "console",
        `"use strict";\n${targetCode}`
      )(runtimeConsole);

      if (typeof result !== "undefined") {
        logs.push(`Return: ${serializeValue(result)}`);
      }

      return logs.length
        ? logs.join("\n")
        : "JavaScript executed in the browser with no console output.";
    } catch (error) {
      throw new Error(error?.message || "JavaScript execution failed.");
    }
  };

  const executeSql = async (targetCode = codeCache.sql) => {
    const data = await runBackendCode("sql", targetCode);
    const nextResult = data.result || null;
    const nextOutput = data.output || "SQL executed successfully.";

    setSqlResult(nextResult);
    setOutput(nextOutput);

    return { result: nextResult, output: nextOutput };
  };

  const handleRun = async () => {
    const currentCode = codeCache[language] || "";

    if (!currentCode.trim()) {
      setOutput("Write some code first.");
      return;
    }

    setIsRunning(true);

    try {
      if (currentConfig.mode === "browser") {
        setSqlResult(null);
        setOutput(executeBrowserJavaScript(currentCode));
      } else if (currentConfig.mode === "backend") {
        const data = await runBackendCode(language, currentCode);
        setSqlResult(null);
        setOutput(data.output || "No output generated.");
      } else if (currentConfig.mode === "preview") {
        setSqlResult(null);
        setOutput("Preview refreshed. Open the preview tab to inspect the page separately.");
      } else if (currentConfig.mode === "sql") {
        await executeSql(currentCode);
      }

      if (isMobile) {
        setMobilePanel("output");
      }
    } catch (error) {
      setOutput(`Execution failed.\n${error.message}`);

      if (currentConfig.mode === "sql") {
        setSqlResult(null);
      }

      if (isMobile) {
        setMobilePanel("output");
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleOpenPreview = async () => {
    const previewWindow = window.open("", "_blank");

    if (!previewWindow) {
      setOutput("Preview was blocked by the browser. Allow popups and try again.");
      return;
    }

    previewWindow.document.write(
      buildErrorPreviewDocument("Loading preview...")
    );
    previewWindow.document.close();

    try {
      if (currentConfig.mode === "preview") {
        previewWindow.document.open();
        previewWindow.document.write(
          buildPreviewDocument(previewModel.html, previewModel.css)
        );
        previewWindow.document.close();
      } else if (currentConfig.mode === "sql") {
        setIsRunning(true);
        const { result } = await executeSql(codeCache.sql);
        previewWindow.document.open();
        previewWindow.document.write(
          buildSqlPreviewDocument(result, codeCache.sql)
        );
        previewWindow.document.close();
      }

      if (isMobile) {
        setMobilePanel("output");
      }
    } catch (error) {
      previewWindow.document.open();
      previewWindow.document.write(buildErrorPreviewDocument(error.message));
      previewWindow.document.close();
      setOutput(`Execution failed.\n${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const changeLanguage = (nextLanguage) => {
    setLanguage(nextLanguage);

    if (LANGUAGE_CONFIG[nextLanguage].mode === "sql") {
      setOutput(sqlResult ? output : getDefaultOutput(nextLanguage));
      return;
    }

    setOutput(getDefaultOutput(nextLanguage));
  };

  const updateCode = (value) => {
    setCodeCache((previous) => ({
      ...previous,
      [language]: value || "",
    }));
  };

  const onMouseDown = () => {
    if (!isMobile) {
      isDragging.current = true;
    }
  };

  const onMouseMove = (event) => {
    if (isMobile || !isDragging.current || !containerRef.current) {
      return;
    }

    const bounds = containerRef.current.getBoundingClientRect();
    const nextWidth = ((event.clientX - bounds.left) / bounds.width) * 100;

    if (nextWidth > 30 && nextWidth < 78) {
      setEditorWidth(nextWidth);
    }
  };

  const onMouseUp = () => {
    isDragging.current = false;
  };

  if (!profile || !profile.name) {
    return (
      <Login
        brandImageSrc={logo}
        onSubmit={(nextProfile) => {
          setProfile(nextProfile);
          localStorage.setItem(PROFILE_KEY, JSON.stringify(nextProfile));
        }}
      />
    );
  }

  return (
    <div
      className="app"
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <header className="topbar">
        <div className="brand">
          <img src={logo} alt="VoidLAB Beta" className="brand-logo" />
          <div>
            <div className="brand-text">VoidLAB Beta</div>
            <div className="brand-subtitle">Code, preview, and ship from one workspace</div>
          </div>
        </div>

        <div className="topbar-right">
          <div className="user-pill" title={`${profile.name} - ${profile.region}`}>
            {profile.avatarDataUrl ? (
              <img
                src={profile.avatarDataUrl}
                alt={profile.name}
                className="user-pill-avatar"
              />
            ) : (
              <div className="user-pill-dot" aria-hidden="true" />
            )}

            <div className="user-pill-copy">
              <span className="user-pill-name">{profile.name}</span>
              <span className="user-pill-region">{profile.region}</span>
            </div>

            <button
              className="user-pill-btn"
              type="button"
              onClick={() => {
                localStorage.removeItem(PROFILE_KEY);
                setProfile(null);
              }}
            >
              Sign out
            </button>
          </div>

          <select
            className="lang-select"
            value={language}
            onChange={(event) => changeLanguage(event.target.value)}
            aria-label="Language"
          >
            {Object.entries(LANGUAGE_CONFIG).map(([value, config]) => (
              <option key={value} value={value}>
                {config.label}
              </option>
            ))}
          </select>

          <button className="run-btn" type="button" onClick={handleRun} disabled={isRunning}>
            {isRunning ? "Working..." : currentConfig.runLabel}
          </button>

          {canOpenPreview && (
            <button
              className="preview-btn"
              type="button"
              onClick={handleOpenPreview}
              disabled={isRunning}
            >
              {currentConfig.previewLabel}
            </button>
          )}
        </div>
      </header>

      {isMobile && (
        <div className="mobile-switcher">
          <button
            type="button"
            className={`mobile-switcher-btn ${mobilePanel === "editor" ? "active" : ""}`}
            onClick={() => setMobilePanel("editor")}
          >
            Editor
          </button>
          <button
            type="button"
            className={`mobile-switcher-btn ${mobilePanel === "output" ? "active" : ""}`}
            onClick={() => setMobilePanel("output")}
          >
            Output
          </button>
        </div>
      )}

      <main className={`main ${isMobile ? "mobile-layout" : ""}`} ref={containerRef}>
        <section
          className={`editor-area ${isMobile && mobilePanel !== "editor" ? "is-hidden" : ""}`}
          style={!isMobile ? { width: `${editorWidth}%` } : undefined}
        >
          <div className="panel-head">
            <div>
              <div className="panel-title">{currentConfig.label} Editor</div>
              <div className="panel-copy">
                {currentConfig.mode === "preview"
                  ? "HTML and CSS stay connected, so you can preview the page as you edit."
                  : currentConfig.mode === "sql"
                    ? "Run queries against the built-in demo schema and inspect results instantly."
                    : currentConfig.mode === "browser"
                      ? "JavaScript is executed directly in the browser."
                      : "Use the execution engine to run or compile the current snippet."}
              </div>
            </div>
          </div>

          <div className="editor-shell">
            <Editor
              height="100%"
              language={currentConfig.editor}
              theme="vs-dark"
              value={codeCache[language]}
              onChange={updateCode}
              onMount={(editor) => {
                editor.updateOptions({ contextmenu: true });
              }}
              options={{
                automaticLayout: true,
                fontSize: isMobile ? 13 : 14,
                minimap: { enabled: !isMobile },
                scrollBeyondLastLine: false,
                wordWrap: "on",
              }}
            />
          </div>
        </section>

        {!isMobile && <div className="resize-bar" onMouseDown={onMouseDown} />}

        <section
          className={`output-area ${isMobile && mobilePanel !== "output" ? "is-hidden" : ""}`}
          style={!isMobile ? { width: `${100 - editorWidth}%` } : undefined}
        >
          <div className="panel-head">
            <div>
              <div className="panel-title">
                {currentConfig.mode === "preview"
                  ? "Live Preview"
                  : currentConfig.mode === "sql"
                    ? "Query Result"
                    : "Console Output"}
              </div>
              <div className="panel-copy">
                {currentConfig.mode === "preview"
                  ? "The inline preview uses your saved HTML and CSS together."
                  : currentConfig.mode === "sql"
                    ? "SQL runs against demo tables so you can test queries before wiring a real database."
                    : `Execution endpoint: ${API_BASE_URL}`}
              </div>
            </div>
          </div>

          <div className="output-shell">
            {isRunning ? (
              <div className="terminal-loader-container">
                <div className="spinner" />
                <span>Processing your code...</span>
              </div>
            ) : currentConfig.mode === "preview" ? (
              <div className="preview-stack">
                <div className="preview-inline">
                  <WebPreview html={previewModel.html} css={previewModel.css} js="" />
                </div>
                <div className="preview-note">
                  {language === "html"
                    ? "Tip: switch to CSS to restyle this preview without losing the HTML structure."
                    : "Tip: CSS preview uses the saved HTML template, so style edits stay visible immediately."}
                </div>
              </div>
            ) : currentConfig.mode === "sql" && sqlResult?.columns?.length ? (
              <div className="sql-result-card">
                <div className="sql-summary">{sqlResult.summary}</div>
                <div className="sql-table-wrap">
                  <table className="sql-table">
                    <thead>
                      <tr>
                        {sqlResult.columns.map((column) => (
                          <th key={column}>{column}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sqlResult.rows.length ? (
                        sqlResult.rows.map((row, rowIndex) => (
                          <tr key={`${rowIndex}-${sqlResult.columns.join("-")}`}>
                            {sqlResult.columns.map((column) => (
                              <td key={`${rowIndex}-${column}`}>{String(row[column] ?? "")}</td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={sqlResult.columns.length}>No rows returned.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <pre className="output-pre">{output}</pre>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
