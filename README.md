# AegisCode

AegisCode is a real-time AI security guardian that lives inside your IDE. It monitors AI-generated code as it is written, scans it for vulnerabilities using a Model Context Protocol (MCP) powered pipeline, and delivers instant risk summaries before code is even committed.

---

## Features

- **Real-Time Monitoring**: Automatically watches for code changes during active development sessions.
- **AI-Driven Vulnerability Detection**: Leverages Google Gemini and specialized security tools to identify SQLi, XSS, insecure headers, and more.
- **Adversarial Cross-Validation**: Built to support multi-model verification (Gemini, Claude, or open-source models like GLM/Kimi) to eliminate false positives.
- **Instant Fix Suggestions**: Concrete, actionable fix recommendations injected directly into your workflow.
- **Web Analytics Dashboard**: Track your security posture over time with deep-dive analytics and historical scan trends.

---

## How It Works

### 1. The MCP Intelligence Loop
AegisCode uses the Model Context Protocol (MCP) to separate high-level reasoning from low-level tool execution. 
- **The Brain**: Gemini iterates on security findings by thinking through the code intent.
- **The Hands**: Custom MCP tools perform regex checks, OWASP pattern matching, and signature detection.

### 2. Session-Based Development
Developers start an AegisCode Session in the VS Code extension. The extension tracks modifications and triggers scans when the AI assistant stops writing, or upon manual request.

---

## Architecture

AegisCode is a monorepo managed with Turborepo and Yarn Workspaces.

- **apps/extension**: A lightweight VS Code extension providing the UI and lifecycle management.
- **apps/server**: A NestJS backend orchestrating all AI logic, MCP tool execution, and data persistence.
- **apps/web**: A Next.js dashboard for visualizing security analytics and history.
- **packages/shared**: Shared TypeScript types, API clients, and constants used across all three apps.

---

## API Versions

The backend exposes two distinct API route groups to serve different client needs:

### V1 (Extension API)
Accessed via `/api/v1`, this version is optimized for the VS Code extension. It focused on high-speed code submission, real-time tool orchestration, and immediate vulnerability feedback. It uses API keys for authentication to ensure a seamless developer experience within the IDE.

### V2 (Dashboard API)
Accessed via `/api/v2`, this version serves the web dashboard. It is optimized for data retrieval, historical analytics, and account management. It utilizes secure HttpOnly cookies for authentication, providing a robust security layer for browser-based interactions.

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- Yarn
- PostgreSQL
- Google Gemini API Key

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/AnjanyKumarJaiswal/AegisCode.git
   cd AegisCode
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Set up environment variables:
   Copy `.env.example` in `apps/server` to `.env` and fill in:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `GEMINI_API_KEY`

4. Initialize the database:
   ```bash
   cd apps/server
   npx prisma generate
   npx prisma db push
   ```

### Running the Project
From the root directory, run:
```bash
yarn dev
```

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Monorepo** | Turborepo, Yarn Workspaces |
| **Backend** | NestJS, Prisma, PostgreSQL |
| **Cloud AI** | Google Gemini (Primary Reasoning) |
| **Frontend** | Next.js, Vanilla CSS |
| **Extension** | VS Code Extension API, TypeScript |
| **Communication** | Model Context Protocol (MCP), REST |

---

## Project Structure

```text
AegisCode/
├── apps/
│   ├── extension/          # VS Code Extension
│   │   ├── src/
│   │   │   ├── auth/       # API Key storage and management
│   │   │   ├── scanner/    # Document change watchers
│   │   │   └── ui/         # Sidebar and Results panels
│   ├── server/             # NestJS Backend (Orchestrator)
│   │   ├── src/
│   │   │   ├── auth/       # Local and GitHub Auth logic
│   │   │   ├── mcp/        # Core MCP Intelligence Module
│   │   │   │   ├── client/ # AI Reasoning Loop (Gemini)
│   │   │   │   ├── server/ # Tool Registry and Dispatcher
│   │   │   │   └── tools/  # Security scan implementations
│   │   │   ├── v1/         # Extension-facing API endpoints
│   │   │   └── v2/         # Dashboard-facing API endpoints
│   │   └── prisma/         # Database schema and migrations
│   └── web/                # Next.js Analytics Dashboard
│       └── app/
│           ├── components/ # Shared UI design system
│           ├── sign-in/    # Authentication pages
│           └── dashboard/  # Analytics and history views
└── packages/
    └── shared/             # Shared Package (Cross-workspace)
        └── src/            # Common Types, API Client, and Utils
```

---
Built for a more secure AI-driven future.
