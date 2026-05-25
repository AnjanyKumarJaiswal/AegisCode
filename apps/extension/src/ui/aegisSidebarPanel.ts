import * as vscode from "vscode";
import type { Severity, Vulnerability } from "../api/scanApi";
import { logger } from "../utils/logger";
import {
  buildWebviewStyles,
  severityColor as themeSeverityColor,
  WEBVIEW_FONT_CSP,
} from "./webviewTheme";
import {
  RefreshCw,
  X,
  MoreHorizontal,
  Play,
  Square,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  ShieldOff,
  LogIn,
  LogOut,
  RefreshCcw,
  Monitor,
  FileCode,
  FileJson,
  FileText,
  FilePy,
  FileCss,
  Folder,
  Braces,
  Target,
  Activity,
  Scan,
  FileSearch,
  FolderSearch,
  Eye,
  Clock,
} from "./icons";

export interface ThreatCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface RecentScanItem {
  filePath: string;
  status: Severity | "clean";
  issueCount: number;
  scannedAtLabel: string;
}

export interface LiveFileItem {
  filePath: string;
  issueCount: number;
  findings: Vulnerability[];
}

export type AegisSidebarState =
  | { kind: "auth" }
  | {
      kind: "offline";
      code: string;
      detail: string;
    }
  | {
      kind: "dashboard";
      score: number;
      riskLabel: string;
      lastRunLabel: string;
      active: boolean;
      threatCounts: ThreatCounts;
      totalIssues: number;
      recentScans: RecentScanItem[];
      username?: string;
      ide?: string;
    }
  | {
      kind: "watching";
      activeFile: string;
      lastRunLabel: string;
      threatCounts: ThreatCounts;
      totalIssues: number;
      liveFiles: LiveFileItem[];
      username?: string;
      ide?: string;
    };

type SidebarMessage =
  | { command: "signInGithub" }
  | { command: "connectServer" }
  | { command: "startWatch" }
  | { command: "scanFile" }
  | { command: "scanWorkspace" }
  | { command: "stopWatch" }
  | { command: "reconnect" }
  | { command: "openServerStatus" }
  | { command: "refresh" }
  | { command: "openRecent"; filePath: string }
  | { command: "showOutput" }
  | { command: "logout" };

const FRONTEND_URL = process.env.FRONTEND_BASE_URL || "http://localhost:3000";

class AegisSidebarPanel implements vscode.WebviewViewProvider {
  static readonly viewId = "aegiscode.panel";

  private view?: vscode.WebviewView;
  private state: AegisSidebarState = { kind: "auth" };

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;
    webviewView.webview.options = { enableScripts: true };
    this.render();

    webviewView.webview.onDidReceiveMessage(async (message: SidebarMessage) => {
      logger.info(`Sidebar message: ${message.command}`);

      switch (message.command) {
        case "signInGithub":
          await vscode.commands.executeCommand("aegiscode.signInGithub");
          return;
        case "connectServer":
          await vscode.commands.executeCommand("aegiscode.login");
          return;
        case "startWatch":
          await vscode.commands.executeCommand("aegiscode.startSession");
          return;
        case "scanFile":
          await vscode.commands.executeCommand("aegiscode.scanNow");
          return;
        case "scanWorkspace":
          await vscode.commands.executeCommand("aegiscode.scanWorkspace");
          return;
        case "stopWatch":
          await vscode.commands.executeCommand("aegiscode.stopSession");
          return;
        case "reconnect":
          await vscode.commands.executeCommand("aegiscode.login");
          return;
        case "openServerStatus":
          logger.show();
          return;
        case "refresh":
          this.render();
          return;
        case "openRecent": {
          if (!message.filePath) return;
          try {
            const document = await vscode.workspace.openTextDocument(
              message.filePath,
            );
            await vscode.window.showTextDocument(document, {
              preview: false,
              viewColumn: vscode.ViewColumn.One,
            });
          } catch {
            void vscode.window.showWarningMessage(
              "AegisCode: Unable to open that file.",
            );
          }
          return;
        }
        case "showOutput":
          logger.show();
          return;
        case "logout":
          await vscode.commands.executeCommand("aegiscode.logout");
          return;
      }
    });
  }

  setState(state: AegisSidebarState): void {
    this.state = state;
    this.render();
  }

  getState(): AegisSidebarState {
    return this.state;
  }

  private render(): void {
    if (!this.view) {
      return;
    }

    this.view.webview.html = this.buildHtml(this.state);
  }

  private nonce(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  private escape(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  private basename(filePath: string): string {
    return filePath.replace(/\\/g, "/").split("/").pop() || filePath;
  }

  private relativePath(filePath: string): string {
    const parts = filePath.replace(/\\/g, "/").split("/");
    return parts.slice(-3).join("/");
  }

  private severityColor(severity: Severity | "clean"): string {
    return themeSeverityColor(severity);
  }

  private severityIcon(severity: Severity | "clean", size = 16): string {
    const color = this.severityColor(severity);
    switch (severity) {
      case "critical":
        return `<span style="color:${color}">${AlertTriangle(size)}</span>`;
      case "high":
        return `<span style="color:${color}">${AlertCircle(size)}</span>`;
      case "medium":
        return `<span style="color:${color}">${Info(size)}</span>`;
      case "clean":
      case "low":
        return `<span style="color:${color}">${CheckCircle(size)}</span>`;
      default:
        return `<span style="color:${color}">${Info(size)}</span>`;
    }
  }

  private fileIcon(filePath: string): string {
    const ext = this.basename(filePath).split(".").pop()?.toLowerCase();
    switch (ext) {
      case "ts":
      case "tsx":
        return `<span class="file-icon" style="color:#3178C6">${FileCode(14)}</span>`;
      case "js":
      case "jsx":
        return `<span class="file-icon js">${FileCode(14)}</span>`;
      case "py":
        return `<span class="file-icon py">${FilePy(14)}</span>`;
      case "css":
      case "scss":
        return `<span class="file-icon css">${FileCss(14)}</span>`;
      case "yml":
      case "yaml":
      case "json":
        return `<span class="file-icon json">${Braces(14)}</span>`;
      default:
        if (filePath.endsWith("/") || !ext) {
          return `<span class="file-icon folder">${Folder(14)}</span>`;
        }
        return `<span class="file-icon">${FileText(14)}</span>`;
    }
  }

  private riskTone(score: number): string {
    if (score <= 3.5) return "critical";
    if (score <= 6.0) return "high";
    if (score <= 8.0) return "medium";
    return "low";
  }

  private buildHtml(state: AegisSidebarState): string {
    const nonce = this.nonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; script-src 'nonce-${nonce}'; ${WEBVIEW_FONT_CSP}">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>${this.styles()}</style>
</head>
<body>
    <div class="shell">
        ${this.topbar(state)}
        <div class="content">${this.body(state)}</div>
    </div>
    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();

        document.addEventListener('click', (event) => {
            const target = event.target.closest('[data-command]');
            if (!target) return;

            const menu = document.getElementById('dropdownMenu');
            if (menu) menu.classList.remove('open');

            vscode.postMessage({
                command: target.dataset.command,
                filePath: target.dataset.filePath
            });
        });

        const toggle = document.getElementById('menuToggle');
        const menu = document.getElementById('dropdownMenu');
        if (toggle && menu) {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                menu.classList.toggle('open');
            });

            document.addEventListener('click', (e) => {
                if (!menu.contains(e.target) && e.target !== toggle) {
                    menu.classList.remove('open');
                }
            });
        }
    </script>
</body>
</html>`;
  }

  private topbar(state: AegisSidebarState): string {
    const showBadge =
      state.kind === "dashboard" && state.active
        ? '<span class="status-badge active">● ACTIVE</span>'
        : state.kind === "watching"
          ? '<span class="status-badge watching">● WATCHING</span>'
          : "";
    const isAuthed = state.kind !== "auth";

    return `
            <div class="topbar">
                <div class="brand-row">
                    <div>
                        <div class="brand-wordmark">AegisCode</div>
                        <div class="brand-sub">security guardian</div>
                    </div>
                    ${showBadge}
                </div>
                <div class="top-actions">
                    <button class="icon-btn" data-command="refresh" title="Refresh">${RefreshCw(14)}</button>
                    <button class="icon-btn" data-command="showOutput" title="Show Output">${X(14)}</button>
                    <div class="dropdown-wrap">
                        <button class="icon-btn" id="menuToggle" title="More">${MoreHorizontal(14)}</button>
                        <div class="dropdown-menu" id="dropdownMenu">
                            <button class="dropdown-item" data-command="showOutput">${Monitor(12)} Show Output</button>
                            <button class="dropdown-item" data-command="refresh">${RefreshCw(12)} Refresh</button>
                            ${isAuthed ? `<div class="dropdown-sep"></div><button class="dropdown-item danger" data-command="logout">${LogOut(12)} Sign Out</button>` : ""}
                        </div>
                    </div>
                </div>
            </div>
        `;
  }

  private body(state: AegisSidebarState): string {
    switch (state.kind) {
      case "auth":
        return this.authBody();
      case "offline":
        return this.offlineBody(state);
      case "watching":
        return this.watchingBody(state);
      case "dashboard":
      default:
        return this.dashboardBody(state);
    }
  }

  private authBody(): string {
    return `
            <div class="center-panel">
                <div class="wordmark-block">
                    <span class="wordmark">AegisCode</span>
                    <span class="descriptor">security guardian</span>
                </div>
                <div class="hero-title">Access your workspace.</div>
                <div class="hero-copy">Sign in to start real-time security scanning and sync telemetry with your command center.</div>
                <div class="btn-stack">
                    <button class="primary-btn" data-command="signInGithub">${LogIn(14)} Sign in with GitHub</button>
                    <button class="secondary-btn" data-command="connectServer">${RefreshCcw(14)} Enter API Token</button>
                    <button class="text-btn" data-command="showOutput">${Monitor(12)} Check server status</button>
                </div>
            </div>
            <div class="footer-status">● Awaiting connection</div>
        `;
  }

  private offlineBody(
    state: Extract<AegisSidebarState, { kind: "offline" }>,
  ): string {
    return `
            <div class="center-panel">
                <div class="center-icon offline">${ShieldOff(32)}</div>
                <div class="hero-title">Backend offline</div>
                <div class="hero-copy">Connection to the AegisCode server was lost. Your session token may have expired.</div>
                <div class="error-box">
                    <div class="error-code">${AlertCircle(12)} ${this.escape(state.code)}</div>
                    <div class="error-detail">${this.escape(state.detail)}</div>
                </div>
                <div class="btn-stack">
                    <button class="primary-btn" data-command="connectServer">${LogIn(14)} Sign in again</button>
                    <button class="secondary-btn" data-command="reconnect">${RefreshCcw(14)} Reconnect</button>
                    <button class="text-btn" data-command="openServerStatus">${Monitor(12)} Check server status</button>
                </div>
            </div>
        `;
  }

  private dashboardBody(
    state: Extract<AegisSidebarState, { kind: "dashboard" }>,
  ): string {
    const tone = this.riskTone(state.score);
    const riskScore = Math.max(0, Math.round((10 - state.score) * 10));

    const threats = [
      {
        label: "CRITICAL",
        value: state.threatCounts.critical,
        severity: "critical" as const,
      },
      {
        label: "HIGH",
        value: state.threatCounts.high,
        severity: "high" as const,
      },
      {
        label: "MEDIUM",
        value: state.threatCounts.medium,
        severity: "medium" as const,
      },
      { label: "LOW", value: state.threatCounts.low, severity: "low" as const },
    ];

    const threatCards = threats
      .map(
        (item) => `
                <div class="threat-card">
                    <div class="threat-label">${item.label}</div>
                    <div class="threat-row">
                        ${this.severityIcon(item.severity, 18)}
                        <span class="threat-value" style="color:${this.severityColor(item.severity)}">${item.value}</span>
                    </div>
                </div>
            `,
      )
      .join("");

    const recent = state.recentScans.length
      ? state.recentScans
          .map(
            (item) => `
                    <button class="recent-row" data-command="openRecent" data-file-path="${this.escape(item.filePath)}">
                        ${this.fileIcon(item.filePath)}
                        <span class="recent-file">${this.escape(this.relativePath(item.filePath))}</span>
                        <span class="recent-state">${this.severityIcon(item.status, 16)}</span>
                    </button>
                `,
          )
          .join("")
      : '<div class="empty-copy">Run a scan to populate recent activity.</div>';

    const issueSummaryRows = [
      {
        label: "Critical",
        value: state.threatCounts.critical,
        color: themeSeverityColor("critical"),
      },
      {
        label: "High",
        value: state.threatCounts.high,
        color: themeSeverityColor("high"),
      },
    ];

    const issueRows = issueSummaryRows
      .map(
        (row) => `
                <div class="issue-row">
                    <span class="issue-dot" style="background:${row.color}"></span>
                    <span class="issue-label">${row.label}</span>
                    <span class="issue-value" style="color:${row.color}">${row.value}</span>
                </div>
            `,
      )
      .join("");

    return `
            <div class="meta-strip">
                <span>Command Center</span>
                <span class="status-badge-inline ${state.active ? "active" : ""}">${state.active ? "● Active" : "○ Idle"}</span>
            </div>
            <div class="meta-strip sub">
                <span>${this.escape(state.ide || "IDE")}</span>
                <span>Last scan: ${this.escape(state.lastRunLabel)}</span>
            </div>
            ${
              state.username
                ? `
            <div class="user-strip">
                <div class="user-info">
                    <span class="user-avatar">${this.escape(state.username[0].toUpperCase())}</span>
                    <span class="user-name">${this.escape(state.username)}</span>
                </div>
                <div class="user-actions">
                    ${state.ide ? `<span class="ide-badge">${Monitor(10)} ${this.escape(state.ide)}</span>` : ""}
                    <button class="logout-btn" data-command="logout" title="Sign out">${LogOut(12)}</button>
                </div>
            </div>
            `
                : ""
            }

            <div class="summary-card">
                <div class="summary-left">
                    <div class="section-head">Global Health Index</div>
                    <div class="score-row">
                        <span class="score-value">${riskScore}</span>
                        <span class="score-max">/100</span>
                    </div>
                </div>
                <div class="risk-pill risk-${tone}">
                    <span class="risk-label-text">${this.escape(state.riskLabel)}</span>
                    <span class="risk-icon">${AlertTriangle(20)}</span>
                </div>
            </div>

            <div class="section-title">${Target(13)} ACTIVE THREATS</div>
            <div class="threat-grid">${threatCards}</div>

            <div class="section-title">${Clock(13)} RECENT SCANS</div>
            <div class="recent-list">${recent}</div>

            <div class="issue-section">
                <div class="section-head">ISSUE SUMMARY</div>
                ${issueRows}
                <div class="issue-row total">
                    <span class="issue-label">Total Identified</span>
                    <span class="issue-value">${state.totalIssues}</span>
                </div>
            </div>

            <div class="footer-panel">
                <button class="primary-btn scan-btn" data-command="scanWorkspace">${Play(14)} SCAN WORKSPACE</button>
                <div class="split-actions">
                    <button class="secondary-btn compact" data-command="scanFile">${FileSearch(13)} Scan File</button>
                    <button class="secondary-btn compact" data-command="scanWorkspace">${FolderSearch(13)} Scan Workspace</button>
                </div>
                <button class="primary-btn watch-btn" data-command="startWatch">${Eye(14)} ${state.active ? "WATCH MODE ACTIVE" : "START WATCH MODE"}</button>
                <div class="footer-meta">
                    <span>Last run: ${this.escape(state.lastRunLabel)}</span>
                    <span class="${state.active ? "online" : "idle"}">● ${state.active ? "Engine Active" : "Engine Idle"}</span>
                </div>
            </div>
        `;
  }

  private watchingBody(
    state: Extract<AegisSidebarState, { kind: "watching" }>,
  ): string {
    const files = state.liveFiles.length
      ? state.liveFiles
          .map((file) => {
            const findings = file.findings
              .map(
                (finding) => `
                            <div class="watch-card watch-${finding.severity}">
                                <div class="watch-head">
                                    <span class="watch-icon">${this.severityIcon(finding.severity, 14)}</span>
                                    <span class="watch-title">${this.escape(finding.title)}</span>
                                    <span class="watch-badge sev-${finding.severity}">${finding.severity.toUpperCase()}</span>
                                </div>
                                <div class="watch-copy">${this.escape(finding.description)}</div>
                                <div class="watch-meta">Line ${finding.line} <span class="watch-sep">|</span> Rule: ${this.escape(finding.ruleId)}</div>
                            </div>
                        `,
              )
              .join("");

            return `
                        <div class="watch-file">
                            <div class="watch-file-head">
                                <span>${this.escape(this.relativePath(file.filePath))}</span>
                                <span class="watch-count">${file.issueCount} ${file.issueCount === 1 ? "Issue" : "Issues"}</span>
                            </div>
                            ${findings}
                        </div>
                    `;
          })
          .join("")
      : '<div class="empty-copy">Watching for file changes and live findings.</div>';

    return `
            <div class="watching-head">
                <div class="live-indicator">
                    <span class="live-dot"></span>
                    <span class="section-head muted">LIVE ANALYSIS</span>
                    ${Activity(14)}
                </div>
                <div class="live-line">${Scan(14)} scanning ${this.escape(this.basename(state.activeFile || "workspace"))}...</div>
            </div>
            ${
              state.username
                ? `
            <div class="user-strip">
                <div class="user-info">
                    <span class="user-avatar">${this.escape(state.username[0].toUpperCase())}</span>
                    <span class="user-name">${this.escape(state.username)}</span>
                </div>
                <div class="user-actions">
                    ${state.ide ? `<span class="ide-badge">${Monitor(10)} ${this.escape(state.ide)}</span>` : ""}
                    <button class="logout-btn" data-command="logout" title="Sign out">${LogOut(12)}</button>
                </div>
            </div>
            `
                : ""
            }
            <div class="watching-stack">${files}</div>
            <div class="footer-panel">
                <button class="primary-btn scan-btn" data-command="scanWorkspace">${Play(14)} SCAN WORKSPACE</button>
                <div class="split-actions">
                    <button class="secondary-btn compact" data-command="scanFile">${FileSearch(13)} Scan File</button>
                    <button class="secondary-btn compact" data-command="stopWatch">${Square(13)} Stop Watch</button>
                </div>
                <div class="footer-meta">
                    <span>Last run: ${this.escape(state.lastRunLabel)}</span>
                    <span class="online">● Engine Active</span>
                </div>
            </div>
        `;
  }

  private styles(): string {
    return buildWebviewStyles("sidebar");
  }
}

export const aegisSidebarPanel = new AegisSidebarPanel();
