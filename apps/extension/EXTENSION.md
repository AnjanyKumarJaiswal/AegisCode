# AegisCode — VS Code Extension

> **The extension is a thin client. It has no security logic of its own. It is the eyes, hands, and voice of the backend — it watches code, ships it to the server, and presents the results back to the developer.**

---

## Architecture — Big Picture

All heavy lifting (AI analysis, vulnerability detection, scoring, session management) lives on the **NestJS backend**. The extension's only job is:

1. Watch for code changes inside VS Code
2. Ship that code to the backend via HTTP
3. Receive results and render them inside VS Code

```
┌─────────────────────────────────────────────────┐
│                  VS Code Extension               │
│                                                  │
│  ┌──────────┐   ┌──────────┐   ┌─────────────┐  │
│  │  Session  │   │ Scanner  │   │     UI      │  │
│  │ Manager  │   │ (watcher)│   │ (StatusBar, │  │
│  │          │   │          │   │  Webview,   │  │
│  └────┬─────┘   └────┬─────┘   │  Squiggles) │  │
│       │              │         └──────┬───────┘  │
│       └──────────────┴────────────────┘          │
│                      │                           │
│              ┌───────▼────────┐                  │
│              │   API Client   │                  │
│              └───────┬────────┘                  │
└──────────────────────┼──────────────────────────┘
                       │  HTTP
                       │
┌──────────────────────▼──────────────────────────┐
│                 NestJS Backend                   │
│                                                  │
│   /v1/scan      → runs security analysis         │
│   /v1/session   → manages session state          │
│   /v1/auth      → handles auth tokens            │
│   /mcp          → AI agent (Gemini + MCP tools)  │
└─────────────────────────────────────────────────┘
```

---

## Full User Flow

### 1. VS Code Opens

- The extension activates automatically.
- It checks VS Code's secure secret storage for a saved auth token.
- **If no token is found** → prompts the user to log in.
- **If a token is found** → silently restores state and shows the status bar item.

---

### 2. User Starts a Security Session

The user runs the command **"AegisCode: Start Security Session"**.

- The `SessionManager` calls the API → `POST /v1/session/start`
- The backend creates a session and returns a session ID.
- The `Scanner` begins watching the active workspace for file change events.
- The `StatusBar` updates to show the extension is **LIVE** and monitoring.

---

### 3. AI Code Gets Inserted into the Editor

This is the core trigger — the moment a developer accepts code from any AI tool (Copilot, Cursor, etc.) or types code manually.

- The `Scanner` detects the text change event on the active document.
- It waits a short debounce period (~500ms) to avoid firing on every single keystroke.
- Once settled, it extracts the changed code and its context (file path, language, surrounding lines).
- It sends this to the API → `POST /v1/scan` along with the current session ID.

---

### 4. Backend Responds with Results

The backend returns a structured list of detected vulnerabilities. Each one contains:

- The line number(s) affected
- Severity level (critical / high / medium / low)
- Vulnerability class (e.g., SQL Injection, Path Traversal, Hardcoded Secret)
- A human-readable description of what's wrong and why

---

### 5. Extension Renders the Results

The UI layer takes the response and surfaces it in three ways simultaneously:

- **Inline squiggly line decorations** — red or yellow underlines on the exact lines flagged, exactly like TypeScript errors.
- **Hover tooltip** — hovering over a flagged line shows the vulnerability name, severity, and a short explanation.
- **Status bar** — updates with an overall risk score for the current file (e.g., `3 issues`).
- **Results panel (Webview)** — a full detailed panel the developer can open to see every vulnerability, its description, and suggested fixes for the entire session.

---

### 6. User Stops the Session

The user runs **"AegisCode: Stop Security Session"**.

- The `Scanner` stops watching for file changes.
- All inline decorations and diagnostics are cleared from the editor.
- The API is notified → `POST /v1/session/stop`.
- The status bar resets to its idle state.

---

## What Each Folder is Responsible For

### `src/extension.ts`

The entry point of the entire extension. This file stays lean — it only wires all the modules together. It calls `activate()` which bootstraps every manager and registers every command. It should read like a table of contents, not contain real logic.

---

### `src/api/`

The **only layer** that communicates with the backend. Nothing else in the extension makes HTTP calls directly — everything goes through here.

Contains:

- A base HTTP client configured with the backend URL and auth headers.
- Typed functions for each backend endpoint (scan, session start/stop, auth).
- Response type definitions so the rest of the extension works with strongly typed data.

If the backend URL or contract changes, this is the only folder that needs to be touched.

---

### `src/auth/`

Handles the entire authentication lifecycle.

Responsibilities:

- Storing and retrieving the auth token using VS Code's built-in **SecretStorage** (encrypted, never stored in plain text).
- Prompting the user to log in when no token exists.
- Attaching the token to every outgoing API request.
- Handling token expiry and refreshing when needed.
- Providing a logout command that clears the stored token.

---

### `src/scanner/`

The **ears** of the extension. It listens to what's happening in the editor and decides when to trigger a scan.

Responsibilities:

- Subscribing to VS Code's document change events.
- Debouncing rapid changes so the backend isn't spammed.
- Extracting the relevant code context (changed text, file path, language ID) to send with the scan request.
- Respecting the session state — it only runs when a session is active.
- Optionally filtering out files that should never be scanned (e.g., `node_modules`, binary files).

---

### `src/session/`

Manages the **state machine** of a security session.

Responsibilities:

- Tracking whether a session is active, idle, or in an error state.
- Holding the current session ID returned by the backend.
- Coordinating startup: calls the API, then signals the Scanner to start and the UI to update.
- Coordinating shutdown: signals the Scanner to stop, clears UI state, calls the API.
- Exposing the current session state to other modules that need to know (e.g., the Scanner checks this before firing).

---

### `src/ui/`

Everything the developer **sees**. This folder owns all visual output inside VS Code.

Contains:

- **StatusBar item** — a persistent widget in the bottom bar showing session state and issue count.
- **Diagnostics** — the mechanism for rendering squiggly underlines on flagged lines of code and populating VS Code's Problems panel.
- **Hover providers** — the tooltip content shown when hovering over a flagged line.
- **Results Webview panel** — a full HTML/CSS panel rendered inside VS Code that shows the complete vulnerability report for the session.

This folder never calls the backend directly. It only renders data it is given.

---

### `src/utils/`

Small, stateless utility helpers used across the whole codebase.

Contains:

- **Logger** — a wrapper around VS Code's output channel so every module logs to the same "AegisCode" output panel in a consistent format.
- **Debounce** — a generic debounce function used by the Scanner.
- Any other pure helper functions (string formatting, path normalization, etc.) that don't belong to any specific domain.
