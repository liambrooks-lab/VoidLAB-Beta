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
- Browser execution for JavaScript
- Backend execution for Python, C, C++, Java, and SQL
- Live preview for HTML and CSS inside the app
- "Open Preview" support in a new tab for HTML, CSS, and SQL
- Responsive mobile layout with editor/output switching
- Login screen with a custom-styled profile upload control

## Local development

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

HTML, CSS, SQL, Python, and browser JavaScript work well in the hosted setup.

C, C++, and Java still depend on compiler toolchains being available on the backend machine. They work locally when those tools are installed. For hosted production use, they are best run on a custom container image with the required compilers.
