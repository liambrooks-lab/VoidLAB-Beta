# VoidLAB Beta

VoidLAB Beta is a browser-based coding workspace built with React, Monaco Editor, and a small Flask execution backend.

## What is included

- Monaco editor with saved code per language
- Browser execution for JavaScript
- Backend execution for Python, C, C++, Java, and SQL
- Live preview for HTML and CSS inside the app
- "Open Preview" support in a new tab for HTML, CSS, and SQL
- Responsive mobile layout with editor/output switching
- Login screen with a custom-styled profile upload control

# Preview VoidLAB-Beta 

### [🔗 Launch Live Product](https://void-lab-beta.vercel.app/)

VoidLAB is a cloud-based code execution environment...

## Local development

### Frontend

```bash
npm install
npm start
```

### Backend

```bash
cd backend
pip install -r requirements.txt
python server.py
```

The React app expects the backend at `http://localhost:5000` during local development.

## Environment variables

### Frontend

- `REACT_APP_API_BASE_URL`
  Example: `https://your-render-service.onrender.com`

### Backend

- `PORT`
- `ALLOWED_ORIGINS`
  Example: `https://your-app.vercel.app`

## SQL preview dataset

SQL mode runs against an in-memory demo database with these tables:

- `users(id, name, region, active)`
- `projects(id, name, owner_id, status, budget)`
- `tasks(id, project_id, title, priority, done)`

## Free deployment plan

For the smoothest free deployment:

- Deploy the React frontend on Vercel
- Deploy the Flask backend on Render
- Use `REACT_APP_API_BASE_URL` in Vercel to point at the Render backend
- Use `ALLOWED_ORIGINS` in Render to allow your Vercel domain

## Important deployment note

HTML, CSS, SQL, Python, and browser JavaScript work well in the hosted setup.

C, C++, and Java still depend on compiler toolchains being available on the backend machine. They work locally when those tools are installed. For hosted production use, they are best run on a custom container image with the required compilers.
---
## 👨‍💻 Author

**Rudranarayan Jena** 
- **GitHub:** [@liambrooks-lab](https://github.com/liambrooks-lab)  

---
                                                Thank You
