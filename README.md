# VoidLAB Beta 

<div align="center">
  <h3>A High-Performance Web IDE & Execution Engine</h3>
  <p>
    <strong>Author:</strong> Rudranarayan Jena | <strong>Version:</strong> 0.1.0-beta
  </p>
  <a href="https://liambrooks-lab.github.io/voidlab-beta"><strong>🔴 Launch VoidLAB-Beta</strong></a>
</div>

---

## 📖 Overview
**VoidLAB Beta** is a scalable, cloud-ready Integrated Development Environment (IDE) built for seamless browser-based code execution. Engineered for performance and usability, it features a split-pane interface powered by Microsoft's Monaco Editor, coupled with robust execution engines capable of handling dynamic user scripts securely.

> ⚠️ **Notice:** VoidLAB is currently in its Beta release lifecycle. Features, UI elements, and backend APIs are actively being refined and are subject to enhancements.

## ✨ Core Capabilities

* **Polyglot Programming Engine:** Out-of-the-box support for compiling and executing Python, JavaScript, C, C++, and Java.
* **Intelligent Execution Routing:** * *Cloud Execution Mode:* Leverages external high-speed APIs for frictionless live-web deployments.
    * *Local Isolated Engine:* Includes a custom Flask server utilizing temporary directory architecture for strict memory management and local compilations.
* **Stateful Workspace:** Utilizes advanced local caching (`localStorage`) to preserve individual code states across different language environments. Switch languages without losing your active code.
* **Monaco-Powered Editing:** Brings the power of enterprise editors to the browser with intelligent syntax highlighting, multi-cursor support, and native IDE keyboard shortcuts.
* **Fluid Responsive UI:** Draggable, resizable viewports optimized for desktop environments while degrading gracefully for mobile viewing.

## 🏗️ System Architecture

VoidLAB operates on a decoupled architecture, allowing the frontend to operate independently or interface with custom backend solutions.

* **Frontend Client:** React.js (v19), `@monaco-editor/react`, modern CSS3.
* **Execution Backend (Optional for Local Host):** Python 3, Flask, `subprocess` sandboxing.

## ⚙️ Quick Start & Installation

### Option A: Cloud-Based Execution (Default)
To run the frontend client utilizing the cloud execution API (identical to the live GitHub pages build):

1. Clone the repository and navigate to the project root.
2. Install frontend dependencies:
   ```bash
   npm install

   ## 🚀 Boot the Local Development Server

Start the frontend locally:

```bash
npm start
```

---

## ⚙️ Option B: Local Execution Engine

To securely process code compilations on your local machine using VoidLAB's backend:

### 🧩 Prerequisites

Ensure the following compilers/interpreters are installed and available in your system PATH:

* gcc
* g++
* javac
* node
* python

### 📦 Install Backend Dependencies

Navigate to the backend directory and install required packages:

```bash
pip install flask flask-cors
```

### ▶️ Start the Compilation Server

Run the backend server locally (default: port 5000):

```bash
python server.py
```

---

## 🔧 Configuration Step

In `src/App.js`, update the `runCode` fetch endpoint to:

```
http://localhost:5000/run
```

---

## 🛡️ Security & Sandboxing (Local Backend)

The Python Flask backend is designed with local safety in mind.

* Each execution runs inside a unique temporary directory
* Generated files like binaries, `.class`, and `.out` are automatically deleted after execution
* Prevents memory leaks and unnecessary file system clutter

---

## 🤝 Contributing & Feedback

VoidLAB is currently in **active Beta** 🚧

Feedback, bug reports, and optimization suggestions are highly appreciated.

---

## 👨‍💻 Author

Architected and developed by **Rudranarayan Jena**
