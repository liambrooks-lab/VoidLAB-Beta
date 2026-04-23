<p align="center">
  <img src="src/assets/logo.png" alt="VoidLAB Beta logo" width="280" />
</p>

<h1 align="center">VoidLAB Beta</h1>

<p align="center">
  A clean browser workspace for writing code, running snippets, and previewing web pages from one place.
</p>

<p align="center">
  <strong>React</strong> | <strong>Monaco Editor</strong> | <strong>Flask</strong> | <strong>SQL Demo Engine</strong>
</p>

---

## Overview

VoidLAB Beta is a beta-stage cloud editor and compiler built for quick coding experiments, learning, and lightweight web previews. It combines a Monaco-powered code editor, language switching, saved local workspace state, browser-based JavaScript execution, backend execution for compiled/interpreted languages, and instant HTML/CSS previewing.

This is intentionally a smaller beta product, so the focus is on a simple and polished core workflow:

- sign in with a local profile
- choose a language
- write or edit code
- run it or preview it
- keep working from the same browser workspace

## Current Features

- Monaco editor with saved code per language
- JavaScript execution directly in the browser
- Flask backend execution for Python, C, C++, Java, and SQL
- HTML and CSS live preview inside the app
- separate preview window support for HTML, CSS, and SQL
- responsive editor/output layout for mobile screens
- custom profile onboarding with avatar upload
- demo SQL database for quick query testing

## Preview

<table>
  <tr>
    <td width="50%" valign="top">
      <img src="docs/readme/voidlab-login.png" alt="VoidLAB Beta sign in screen" />
      <br />
      <strong>Profile entry</strong>
      <br />
      Start with a clean beta sign-in screen and a local workspace profile.
    </td>
    <td width="50%" valign="top">
      <img src="docs/readme/voidlab-workspace.png" alt="VoidLAB Beta workspace" />
      <br />
      <strong>Editor workspace</strong>
      <br />
      Switch languages, run snippets, and preview HTML/CSS from the same interface.
    </td>
  </tr>
</table>

## Tech Stack

### Frontend

- React 18
- Monaco Editor
- Plain CSS files for custom UI styling
- LocalStorage for beta workspace/profile persistence

### Backend

- Python
- Flask
- SQLite-backed demo SQL execution
- Local compiler/runtime execution where available

## Project Structure

```text
VoidLAB-Beta/
|- backend/
|  |- requirements.txt
|  `- server.py
|- docs/
|  `- readme/
|- public/
|- src/
|  |- assets/
|  |- App.js
|  |- App.css
|  |- Login.js
|  |- Login.css
|  `- WebPreview.js
|- package.json
|- LICENSE
`- README.md
```

## Local Setup

### 1. Install frontend dependencies

```bash
npm install
```

### 2. Start the React app

```bash
npm start
```

The frontend runs at:

```text
http://localhost:3000
```

### 3. Start the backend

Open another terminal:

```bash
cd backend
pip install -r requirements.txt
python server.py
```

The frontend expects the backend at:

```text
http://localhost:5000
```

## Environment Variables

### Frontend

Create a frontend environment variable when the backend is hosted somewhere else:

```env
REACT_APP_API_BASE_URL=https://your-backend-url.example.com
```

### Backend

```env
PORT=5000
ALLOWED_ORIGINS=http://localhost:3000
```

For deployment, set `ALLOWED_ORIGINS` to the hosted frontend URL.

## SQL Demo Data

SQL mode runs against a small in-memory demo database with these tables:

- `users(id, name, region, active)`
- `projects(id, name, owner_id, status, budget)`
- `tasks(id, project_id, title, priority, done)`

## Deployment Notes

A simple free deployment flow is:

- host the React frontend on Vercel
- host the Flask backend on Render
- set `REACT_APP_API_BASE_URL` in the frontend project
- set `ALLOWED_ORIGINS` in the backend project

HTML, CSS, SQL, Python, and browser JavaScript are the smoothest hosted paths right now. C, C++, and Java depend on compiler toolchains being available on the backend machine, so they are better suited to local use or a custom backend container.

## Beta Scope

VoidLAB Beta is still an early product build. It is ready for demos, experiments, and personal learning workflows, but it is not yet a full production IDE. Future improvements can include stronger auth, project management, file import/export, cloud persistence, and a more isolated execution sandbox.

## License

VoidLAB Beta is protected under a custom restricted license.

Copyright (c) 2026 Rudranarayan Jena.

See [LICENSE](LICENSE) for the full license text.

## Author

<p align="center">
  <img src="docs/readme/author-rudranarayan-jena.jpg" alt="Rudranarayan Jena" width="180" />
</p>

<p align="center">
  <strong>Crafted by MR. Rudranarayan Jena</strong>
</p>

<p align="center">
  Product Builder | Full-stack Developer | Creator of VoidLAB Beta
</p>
