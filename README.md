# AegisCode — Real-Time AI Security Guardian

AegisCode is a real-time AI security guard that lives inside your IDE. It monitors AI-generated and manual code as it is written, scans it for security vulnerabilities using a Model Context Protocol (MCP) powered pipeline, and delivers instant in-editor visual feedback and remediation steps before the code is ever committed.

---

## Core Features

### Real-Time Code Security Analysis
The extension continuously monitors active document modifications in the IDE. To prevent spamming the backend, changes are debounced by 500ms. Once typing stops, the extension extracts the modified code block along with its metadata (such as path and language type) and executes a background HTTP post call to the NestJS server.

### Agentic Security Engine (MCP-Powered)
The NestJS backend hosts an in-memory Model Context Protocol (MCP) server that registers 10 security scanner tools mapping to the OWASP Top 10 vulnerability categories (including Injection, Cryptographic Failures, Broken Access Control, and SSRF). The backend uses Google Gemini as a reasoning core. When a scan is run, Gemini is prompted with the user's code and has direct access to the local MCP tools. It calls these tools to log findings or registers clean checks, enabling deep, context-aware analysis of code blocks.

### Native IDE Visual Feedback and Diagnostics
Vulnerability findings returned from the backend are translated directly into native VS Code Diagnostic markers. This populates the editor's Problems panel and draws colored underlines (red for critical/high severity, yellow for medium severity) over the exact lines where issues were detected.

### Interactive Webview UI Panels
AegisCode opens side-by-side interactive panels using the VS Code Webview API. The sidebar view provides a persistent status display, while the main details panel lists categorized findings. Each item provides a thorough description of the security risk and step-by-step fix recommendations.

### Bulk Workspace Auditing
Developers can audit their entire codebase using the "AegisCode: Scan Workspace" command. The extension traverses workspace directories, filtering files by extension, applying a size limit (excluding files larger than 120KB to ensure fast processing), and ignoring directories like node_modules and .git. A progress dialog notifies the user of the progress throughout the bulk audit.

### AI Chat Remediation Bridge ("Insert to Chat")
Since the extension does not modify code directly, the "Insert to Chat" command bridges the scanner with chat-based AI assistants (like Cursor, Copilot, or Gemini). It writes a complete markdown report named "aegiscode-audit.md" containing the findings and automatically copies a prompt to the clipboard (e.g. "Please read the aegiscode-audit.md file and apply the recommended security fixes to my code in <filename>.") so the developer can paste it directly into their AI chat interface.

### Web Telemetry Command Center
A dark-themed, responsive web console built with Next.js provides global telemetry. It includes:
* **Global Health Index**: An overall security posture score (from 0 to 100) calculated by subtracting weighted severity penalties (e.g. Critical counts as -3.0, High as -1.5) from a perfect 10.0 base.
* **Real-Time Threat Feed**: Live updates of recent scans, identifying target assets, scanned protocols, and severity flags.
* **Threat History**: Visualizes average risk trends over specific timeframes (1 day, 7 days, or 30 days) using bucket-partitioned graphs.
* **Configuration Module**: Allows managing user settings, rotation of API secret keys, default project IDs, and alert notification configurations.

---

## System Architecture

### Monorepo Layout
The project is built as a TypeScript monorepo using Turborepo and Yarn workspaces:

| Directory | Component | Responsibility |
| :--- | :--- | :--- |
| **apps/extension** | IDE Client | VS Code extension managing editor listeners, status bars, and diagnostic underlines. |
| **apps/server** | Backend Server | NestJS orchestrator executing Gemini scans, hosting the local MCP tools, and storing logs. |
| **apps/web** | Next.js Frontend | Command Center web dashboard for settings, metrics, and risk charts. |
| **packages/shared** | Shared Package | Shared TypeScript types, API Client bindings, and JWT helpers. |

### Handoff Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Developer
    participant Extension as VS Code Extension
    participant Web as Next.js Web App
    participant Backend as NestJS Server (MCP Client)
    participant MCPServer as In-Memory MCP Server
    participant Gemini as Gemini 3-Flash (LLM)
    database DB as PostgreSQL (Prisma)

    Developer->>Extension: Edits code in active document
    Extension->>Extension: Debounces changes (500ms)
    Extension->>Backend: POST /api/v1/scan (code, file path, lang)
    Backend->>Gemini: Prompts Gemini with user code + MCP tools definitions
    activate Gemini
    Gemini->>Backend: Calls security check tools (e.g. check_injection)
    Backend->>MCPServer: Executes local tool parser (owaspCheckTools)
    MCPServer-->>Backend: Returns parsed findings array
    Backend->>Gemini: Feeds back tool response
    Gemini->>Backend: Finishes reasoning / returns final summary
    deactivate Gemini
    Backend->>Backend: Computes Health Index score
    Backend->>DB: Saves ScanReport & Vulnerabilities transactionally
    Backend-->>Extension: Returns scan telemetry
    Extension->>Extension: Applies inline highlights & active panel updates
    Web->>DB: Pulls real-time telemetry (GET /api/v2/dashboard/stats)
```

---

## Local Setup and Development Guide

Follow these steps to configure your environment and run the AegisCode services locally.

### Prerequisites
* Node.js (version 18 or higher)
* Yarn (classic version 1.22.x)
* PostgreSQL database instance
* Google Gemini API key

### 1. Installation
Clone the repository and install the dependencies from the root directory:
```bash
git clone https://github.com/AnjanyKumarJaiswal/AegisCode.git
cd AegisCode
yarn install
```

### 2. Environment Variables Configuration
Create a `.env` file in the root directory to store configuration variables:
```env
PORT=4000
BACKEND_BASE_API_URL="http://localhost:4000"
FRONTEND_BASE_URL="http://localhost:3000"
DATABASE_URL="postgresql://<db_user>:<db_password>@localhost:5432/<db_name>"
JWT_SECRET="your-super-secret-key-change-this-in-production"
GEMINI_API_KEY="your-google-gemini-api-key"
GITHUB_CLIENT_ID="your-optional-github-oauth-id"
GITHUB_CLIENT_SECRET="your-optional-github-oauth-secret"
```

### 3. Database Migration and Seeding
Sync your PostgreSQL database with the Prisma schema and generate the client. Run the following commands:
```bash
cd apps/server
yarn prisma migrate dev
```
This will compile migrations, apply them to your database, and generate the Prisma Client.

### 4. Running the Development Servers
From the root directory of the monorepo, run:
```bash
yarn dev
```
This command triggers Turborepo to start both the NestJS server (listening on port `4000`) and the Next.js web application (listening on port `3000`) in hot-reload mode.

### 5. Running the Extension
To debug or run the VS Code extension:
1. Open the `AegisCode` workspace folder in VS Code.
2. Navigate to `apps/extension`.
3. Press `F5` (or go to Run & Debug and click "Launch Extension").
4. A new Extension Development Host window will open with the AegisCode extension active and loaded.
5. Make sure the extension configuration is pointing to the correct backend server (the default is `http://localhost:4000`).
