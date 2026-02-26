# AegisCode

AegisCode is a real-time AI security guardian that lives inside your IDE. It monitors AI-generated code as it is written, scans it for vulnerabilities using a multi-agent LLM system, and delivers an instant risk summary before the code is committed. All scan data is stored and surfaced on a web dashboard, giving developers and teams full visibility into their codebase security over time.

## The Problem

AI coding assistants like GitHub Copilot, Cursor, and others have become integral to modern development workflows. They write code fast, but they do not write secure code consistently. These tools generate vulnerabilities confidently — SQL injection, hardcoded secrets, XSS flaws, insecure deserialization, and more — and developers often trust that output without deep scrutiny.

Existing security tools were not built with AI-generated code in mind. They treat all code the same regardless of its source. There is no independent, AI-agent-agnostic security layer that sits above these tools and catches what they miss in real time.

AegisCode fills that gap.

## How It Works

### Session-Based Scanning

When a developer opens their IDE and decides to work with an AI coding agent, they manually start an AegisCode session. This session tracks all file changes made during the coding session. Once the AI agent finishes making changes, AegisCode detects the inactivity and begins its security scan. The developer can also trigger a scan manually at any point.

Each scan produces a vulnerability report that includes a security score on a scale of 1 to 10, where 10 represents the highest risk. The report details every identified vulnerability, its severity, its location in the code, and a recommended fix.

### The Feedback Loop

The core differentiator of AegisCode is its iterative feedback loop. After a scan completes, the developer has the option to insert the vulnerability report directly into their AI agent's chat. The agent reads the report, understands the specific issues, and applies fixes. AegisCode then re-scans the modified code and produces an updated report with a new score.

This loop continues until the security score drops to an acceptable level. Each iteration is recorded, creating a clear trail of how the code improved from its initial state to its final secure version.

### Multi-Agent Scanning

Rather than relying on a single LLM, which will inevitably have blind spots, AegisCode chains two different models from different providers — for example, Claude and Gemini. One model performs the initial security scan. The second model challenges and validates that scan, catching what the first one missed. Different models have different strengths and weaknesses, so they cover each other.

On top of this adversarial pairing, AegisCode uses structured checklist forcing. Instead of asking a model for an open-ended security assessment, it forces the model to evaluate code against specific vulnerability categories one by one — the OWASP Top 10, common CVE patterns, secrets detection, and more. Real CVE examples and known vulnerability patterns are injected as context to improve detection accuracy.

There is no fine-tuning and no custom model inference. The approach relies entirely on smart prompting and architectural design.

## Architecture

AegisCode is a monorepo containing three applications and one shared package, managed with Turborepo and Yarn workspaces.

### VS Code Extension

The extension is intentionally thin. It handles the UI, session management, file change watching, and API calls to the backend. All heavy logic lives server-side, keeping the extension lightweight, fast to install, and easy to update through the VS Code Marketplace.

Key responsibilities:
- Manual session start and stop
- Real-time file change detection during active sessions
- Hybrid scan triggering — automatic on inactivity, manual on demand
- Displaying vulnerability reports with security scores
- "Insert into Chat" action to paste scan results into the AI agent's chat
- Inline code decorations for flagged vulnerabilities

### Backend Service (NestJS)

A single NestJS server handles all business logic. It exposes two API route groups:

- **/api/v1** serves the VS Code extension. It handles authentication, code submission for scanning, scan execution, report generation, and result storage.
- **/api/v2** serves the web dashboard. It handles analytics queries, vulnerability history retrieval, the chat interface, GitHub integration, and account management.

The backend manages the LLM orchestration, structured checklist evaluation, CVE context injection, and the full scan pipeline. It stores all data in PostgreSQL using Prisma as the ORM. Authentication is handled with JWT tokens and Redis for session management — no third-party auth services, which matters for a security-focused product where full control over the auth layer is essential.

A credit-based system governs usage, providing rate limiting to protect the backend from overload while giving users a clear understanding of their consumption.

### Web Dashboard (Next.js)

The dashboard provides a comprehensive view of security data beyond what the extension can show.

**Vulnerability History and Analytics**
Developers can track their security scores over time, view per-session score curves, see how many iterations it took to reach a secure state, and identify patterns in the types of vulnerabilities their AI agents tend to introduce.

**Chat Interface**
A conversational AI interface where users can ask questions specifically about their vulnerability records and scan history. This is powered by the same multi-agent system with custom MCP tools that query the backend's v1 endpoint to fetch the user's actual code and scan context. The AI has real knowledge of the user's codebase and history, not just generic security advice.

**GitHub Integration**
Users can connect their GitHub repositories and pull their uploaded code to compare against their current local version. This enables side-by-side vulnerability diffing — showing exactly how security has improved or regressed between the repository version and the local working copy.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Monorepo | Turborepo, Yarn v1 Workspaces |
| VS Code Extension | TypeScript, esbuild |
| Backend | NestJS, TypeScript |
| Frontend | Next.js, TypeScript, Tailwind CSS |
| Database | PostgreSQL, Prisma ORM |
| Auth | JWT, Redis |
| Shared Code | TypeScript (cross-workspace package) |

## Project Structure

```
AegisCode/
  apps/
    extension/       VS Code Extension
    server/          NestJS Backend Service
    web/             Next.js Dashboard
  packages/
    shared/          Shared types, constants, and utilities
```

All three applications depend on the shared package (`@aegiscode/shared`) for common TypeScript types, constants, and utility functions, ensuring consistency across the entire system.
