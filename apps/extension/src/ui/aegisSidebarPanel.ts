import * as vscode from 'vscode';
import type { Severity, Vulnerability } from '../api/scanApi';
import { logger } from '../utils/logger';
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
    Shield,
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
} from './icons';

export interface ThreatCounts {
    critical: number;
    high: number;
    medium: number;
    low: number;
}

export interface RecentScanItem {
    filePath: string;
    status: Severity | 'clean';
    issueCount: number;
    scannedAtLabel: string;
}

export interface LiveFileItem {
    filePath: string;
    issueCount: number;
    findings: Vulnerability[];
}

export type AegisSidebarState =
    | { kind: 'auth' }
    | {
          kind: 'offline';
          code: string;
          detail: string;
      }
    | {
          kind: 'dashboard';
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
          kind: 'watching';
          activeFile: string;
          lastRunLabel: string;
          threatCounts: ThreatCounts;
          totalIssues: number;
          liveFiles: LiveFileItem[];
          username?: string;
          ide?: string;
      };

type SidebarMessage =
    | { command: 'signInGithub' }
    | { command: 'connectServer' }
    | { command: 'startWatch' }
    | { command: 'scanFile' }
    | { command: 'scanWorkspace' }
    | { command: 'stopWatch' }
    | { command: 'reconnect' }
    | { command: 'openServerStatus' }
    | { command: 'refresh' }
    | { command: 'openRecent'; filePath: string }
    | { command: 'showOutput' }
    | { command: 'logout' };

const FRONTEND_URL = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';

class AegisSidebarPanel implements vscode.WebviewViewProvider {
    static readonly viewId = 'aegiscode.panel';

    private view?: vscode.WebviewView;
    private state: AegisSidebarState = { kind: 'auth' };

    resolveWebviewView(webviewView: vscode.WebviewView): void {
        this.view = webviewView;
        webviewView.webview.options = { enableScripts: true };
        this.render();

        webviewView.webview.onDidReceiveMessage(async (message: SidebarMessage) => {
            logger.info(`Sidebar message: ${message.command}`);

            switch (message.command) {
                case 'signInGithub':
                    await vscode.commands.executeCommand('aegiscode.signInGithub');
                    return;
                case 'connectServer':
                    await vscode.commands.executeCommand('aegiscode.login');
                    return;
                case 'startWatch':
                    await vscode.commands.executeCommand('aegiscode.startSession');
                    return;
                case 'scanFile':
                    await vscode.commands.executeCommand('aegiscode.scanNow');
                    return;
                case 'scanWorkspace':
                    await vscode.commands.executeCommand('aegiscode.scanWorkspace');
                    return;
                case 'stopWatch':
                    await vscode.commands.executeCommand('aegiscode.stopSession');
                    return;
                case 'reconnect':
                    await vscode.commands.executeCommand('aegiscode.login');
                    return;
                case 'openServerStatus':
                    logger.show();
                    return;
                case 'refresh':
                    this.render();
                    return;
                case 'openRecent': {
                    if (!message.filePath) return;
                    try {
                        const document = await vscode.workspace.openTextDocument(message.filePath);
                        await vscode.window.showTextDocument(document, { preview: false, viewColumn: vscode.ViewColumn.One });
                    } catch {
                        void vscode.window.showWarningMessage('AegisCode: Unable to open that file.');
                    }
                    return;
                }
                case 'showOutput':
                    logger.show();
                    return;
                case 'logout':
                    await vscode.commands.executeCommand('aegiscode.logout');
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
        return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    private basename(filePath: string): string {
        return filePath.replace(/\\/g, '/').split('/').pop() || filePath;
    }

    private relativePath(filePath: string): string {
        const parts = filePath.replace(/\\/g, '/').split('/');
        return parts.slice(-3).join('/');
    }

    private severityColor(severity: Severity | 'clean'): string {
        switch (severity) {
            case 'critical':
                return '#E05A5A';
            case 'high':
                return '#ff9d12';
            case 'medium':
                return '#dfc15b';
            case 'clean':
            case 'low':
                return '#7A9970';
            default:
                return '#7fa0b7';
        }
    }

    private severityIcon(severity: Severity | 'clean', size = 16): string {
        switch (severity) {
            case 'critical':
                return `<span style="color:#E05A5A">${AlertTriangle(size)}</span>`;
            case 'high':
                return `<span style="color:#ff9d12">${AlertCircle(size)}</span>`;
            case 'medium':
                return `<span style="color:#dfc15b">${Info(size)}</span>`;
            case 'clean':
            case 'low':
                return `<span style="color:#7A9970">${CheckCircle(size)}</span>`;
            default:
                return `<span style="color:#7fa0b7">${Info(size)}</span>`;
        }
    }

    private fileIcon(filePath: string): string {
        const ext = this.basename(filePath).split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'ts':
            case 'tsx':
                return `<span class="file-icon" style="color:#3178C6">${FileCode(14)}</span>`;
            case 'js':
            case 'jsx':
                return `<span class="file-icon js">${FileCode(14)}</span>`;
            case 'py':
                return `<span class="file-icon py">${FilePy(14)}</span>`;
            case 'css':
            case 'scss':
                return `<span class="file-icon css">${FileCss(14)}</span>`;
            case 'yml':
            case 'yaml':
            case 'json':
                return `<span class="file-icon json">${Braces(14)}</span>`;
            default:
                if (filePath.endsWith('/') || !ext) {
                    return `<span class="file-icon folder">${Folder(14)}</span>`;
                }
                return `<span class="file-icon">${FileText(14)}</span>`;
        }
    }

    private riskTone(score: number): string {
        if (score <= 3.5) return 'critical';
        if (score <= 6.0) return 'high';
        if (score <= 8.0) return 'medium';
        return 'low';
    }

    private buildHtml(state: AegisSidebarState): string {
        const nonce = this.nonce();

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src https://fonts.gstatic.com https://fonts.googleapis.com;">
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
            state.kind === 'dashboard' && state.active
                ? '<span class="status-badge active">● ACTIVE</span>'
                : state.kind === 'watching'
                ? '<span class="status-badge watching">● WATCHING</span>'
                : '';
        const isAuthed = state.kind !== 'auth';

        return `
            <div class="topbar">
                <div class="brand-row">
                    <span class="brand-text">AEGIS CODE</span>
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
                            ${isAuthed ? `<div class="dropdown-sep"></div><button class="dropdown-item danger" data-command="logout">${LogOut(12)} Sign Out</button>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    private body(state: AegisSidebarState): string {
        switch (state.kind) {
            case 'auth':
                return this.authBody();
            case 'offline':
                return this.offlineBody(state);
            case 'watching':
                return this.watchingBody(state);
            case 'dashboard':
            default:
                return this.dashboardBody(state);
        }
    }

    private authBody(): string {
        return `
            <div class="center-panel">
                <div class="center-icon shield">${Shield(32)}</div>
                <div class="hero-title">Authentication Required</div>
                <div class="hero-copy">Connect your account to access<br>Aegis Code security telemetry<br>and scan controls.</div>
                <div class="btn-stack">
                    <button class="primary-btn" data-command="signInGithub">${LogIn(14)} Sign in with GitHub</button>
                    <button class="secondary-btn" data-command="connectServer">${RefreshCcw(14)} Connect to Server</button>
                    <button class="text-btn" data-command="showOutput">${Monitor(12)} Check server status</button>
                </div>
            </div>
            <div class="footer-status">● AWAITING CONNECTION</div>
        `;
    }

    private offlineBody(state: Extract<AegisSidebarState, { kind: 'offline' }>): string {
        return `
            <div class="center-panel">
                <div class="center-icon offline">${ShieldOff(32)}</div>
                <div class="hero-title">Backend Offline</div>
                <div class="hero-copy">Connection to<br>AEGIS_CODE lost.<br>Authentication token may<br>have expired.</div>
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

    private dashboardBody(state: Extract<AegisSidebarState, { kind: 'dashboard' }>): string {
        const tone = this.riskTone(state.score);
        const riskScore = Math.max(0, Math.round((10 - state.score) * 10));

        const threats = [
            { label: 'CRITICAL', value: state.threatCounts.critical, severity: 'critical' as const },
            { label: 'HIGH', value: state.threatCounts.high, severity: 'high' as const },
            { label: 'MEDIUM', value: state.threatCounts.medium, severity: 'medium' as const },
            { label: 'LOW', value: state.threatCounts.low, severity: 'low' as const },
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
            .join('');

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
                  .join('')
            : '<div class="empty-copy">Run a scan to populate recent activity.</div>';

        const issueSummaryRows = [
            { label: 'Critical', value: state.threatCounts.critical, color: '#E05A5A' },
            { label: 'High', value: state.threatCounts.high, color: '#ff9d12' },
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
            .join('');

        return `
            <div class="meta-strip">
                <span>AEGIS_CODE</span>
                <span class="status-badge-inline ${state.active ? 'active' : ''}">${state.active ? '● ACTIVE' : '○ IDLE'}</span>
            </div>
            <div class="meta-strip sub">
                <span>V2.0.48_STABLE</span>
                <span>L_SCAN: ${this.escape(state.lastRunLabel)}</span>
            </div>
            ${state.username ? `
            <div class="user-strip">
                <div class="user-info">
                    <span class="user-avatar">${this.escape(state.username[0].toUpperCase())}</span>
                    <span class="user-name">@${this.escape(state.username)}</span>
                </div>
                <div class="user-actions">
                    <button class="logout-btn" data-command="logout" title="Sign out">${LogOut(12)}</button>
                </div>
            </div>
            ` : ''}

            <div class="summary-card">
                <div class="summary-left">
                    <div class="section-head">PROJECT RISK</div>
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
                <button class="primary-btn watch-btn" data-command="startWatch">${Eye(14)} ${state.active ? 'WATCH MODE ACTIVE' : 'START WATCH MODE'}</button>
                <div class="footer-meta">
                    <span>Last run: ${this.escape(state.lastRunLabel)}</span>
                    <span class="${state.active ? 'online' : 'idle'}">● ${state.active ? 'Engine Active' : 'Engine Idle'}</span>
                </div>
            </div>
        `;
    }

    private watchingBody(state: Extract<AegisSidebarState, { kind: 'watching' }>): string {
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
                          .join('');

                      return `
                        <div class="watch-file">
                            <div class="watch-file-head">
                                <span>${this.escape(this.relativePath(file.filePath))}</span>
                                <span class="watch-count">${file.issueCount} ${file.issueCount === 1 ? 'Issue' : 'Issues'}</span>
                            </div>
                            ${findings}
                        </div>
                    `;
                  })
                  .join('')
            : '<div class="empty-copy">Watching for file changes and live findings.</div>';

        return `
            <div class="watching-head">
                <div class="live-indicator">
                    <span class="live-dot"></span>
                    <span class="section-head muted">LIVE ANALYSIS</span>
                    ${Activity(14)}
                </div>
                <div class="live-line">${Scan(14)} scanning ${this.escape(this.basename(state.activeFile || 'workspace'))}...</div>
            </div>
            ${state.username ? `
            <div class="user-strip">
                <div class="user-info">
                    <span class="user-avatar">${this.escape(state.username[0].toUpperCase())}</span>
                    <span class="user-name">@${this.escape(state.username)}</span>
                </div>
                <div class="user-actions">
                    <button class="logout-btn" data-command="logout" title="Sign out">${LogOut(12)}</button>
                </div>
            </div>
            ` : ''}
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
        return `
            @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap');

            :root {
                --bg: #0E0D0C;
                --bg-2: #151412;
                --panel: #1A1714;
                --panel-2: #201D19;
                --border: #2E2A26;
                --border-subtle: rgba(255,255,255,0.04);
                --copy: #E8E2D9;
                --copy-dim: #A89F94;
                --copy-faint: #5C5650;
                --amber: #FF9D12;
                --amber-dark: #C4701F;
                --red: #E05A5A;
                --red-soft: #ffb2b0;
                --green: #7A9970;
                --green-soft: #bde5b0;
                --yellow: #dfc15b;
                --font-mono: "JetBrains Mono", "Fira Code", "Cascadia Code", "IBM Plex Mono", "Menlo", "Consolas", monospace;
                --font-sans: "Inter", "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif;
            }

            * { box-sizing: border-box; margin: 0; padding: 0; }

            body {
                background: var(--bg);
                color: var(--copy);
                font-family: var(--font-sans);
                font-size: 12px;
                line-height: 1.5;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }

            button {
                font-family: inherit;
                color: inherit;
                cursor: pointer;
                border: none;
                background: none;
                outline: none;
            }

            .shell {
                min-height: 100vh;
                display: flex;
                flex-direction: column;
            }

            .topbar {
                height: 48px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 12px;
                border-bottom: 1px solid var(--border-subtle);
                background: rgba(0,0,0,0.2);
            }

            .brand-row {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .brand-text {
                font-family: var(--font-mono);
                font-size: 13px;
                font-weight: 800;
                letter-spacing: 0.14em;
                color: var(--amber);
                text-transform: uppercase;
            }

            .status-badge {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                padding: 2px 8px;
                border-radius: 99px;
                font-family: var(--font-mono);
                font-size: 9px;
                font-weight: 700;
                letter-spacing: 0.1em;
            }

            .status-badge.active {
                background: rgba(122,153,112,0.12);
                color: var(--green-soft);
                border: 1px solid rgba(122,153,112,0.25);
            }

            .status-badge.watching {
                background: rgba(255,157,18,0.1);
                color: var(--amber);
                border: 1px solid rgba(255,157,18,0.25);
            }

            .top-actions {
                display: flex;
                gap: 2px;
            }

            .icon-btn {
                width: 28px;
                height: 28px;
                display: grid;
                place-items: center;
                border-radius: 6px;
                color: var(--copy-dim);
                transition: all 0.15s ease;
            }

            .icon-btn:hover {
                background: rgba(255,255,255,0.06);
                color: var(--copy);
            }

            .content {
                flex: 1;
                padding: 16px 12px 18px;
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            .center-panel {
                margin: auto 0;
                padding: 28px 16px 24px;
                text-align: center;
            }

            .center-icon {
                width: 64px;
                height: 64px;
                margin: 0 auto 20px;
                border-radius: 16px;
                display: grid;
                place-items: center;
            }

            .center-icon.shield {
                background: #282522;
                color: var(--amber);
            }

            .center-icon.offline {
                background: #331617;
                color: var(--red-soft);
            }

            .hero-title {
                font-size: 18px;
                font-weight: 700;
                color: var(--copy);
                margin-bottom: 10px;
            }

            .hero-copy {
                color: var(--copy-dim);
                font-size: 13px;
                line-height: 1.6;
                margin-bottom: 20px;
            }

            .error-box {
                background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.05);
                border-radius: 8px;
                padding: 12px 14px;
                text-align: left;
                margin-bottom: 20px;
            }

            .error-code {
                color: var(--red-soft);
                font-family: var(--font-mono);
                font-size: 11px;
                font-weight: 700;
                margin-bottom: 6px;
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .error-detail {
                color: var(--copy-faint);
                font-size: 11px;
                line-height: 1.5;
            }

            .btn-stack {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .footer-status {
                text-align: center;
                color: var(--copy-faint);
                font-family: var(--font-mono);
                font-size: 10px;
                letter-spacing: 0.18em;
                padding: 8px 0;
            }

            .primary-btn {
                width: 100%;
                background: var(--amber);
                color: #1A1000;
                padding: 14px 12px;
                font-size: 13px;
                font-weight: 800;
                font-family: var(--font-mono);
                letter-spacing: 0.06em;
                text-transform: uppercase;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                transition: all 0.15s ease;
                border: none;
            }

            .primary-btn:hover {
                background: #FFB040;
                transform: translateY(-1px);
                box-shadow: 0 4px 16px rgba(255,157,18,0.25);
            }

            .primary-btn:active {
                transform: translateY(0);
            }

            .primary-btn.watch-btn {
                background: transparent;
                border: 1px solid var(--border);
                color: var(--copy);
                font-size: 12px;
                padding: 12px;
            }

            .primary-btn.watch-btn:hover {
                background: var(--panel-2);
                box-shadow: none;
            }

            .secondary-btn {
                width: 100%;
                background: transparent;
                color: var(--copy);
                border: 1px solid var(--border);
                padding: 12px;
                font-size: 12px;
                font-weight: 600;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                transition: all 0.15s ease;
            }

            .secondary-btn:hover {
                background: var(--panel-2);
                border-color: var(--copy-faint);
            }

            .secondary-btn.compact {
                padding: 10px 8px;
                font-size: 11px;
            }

            .text-btn {
                width: 100%;
                padding: 8px 12px;
                color: var(--copy-dim);
                font-size: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                transition: color 0.15s ease;
            }

            .text-btn:hover {
                color: var(--copy);
            }

            .meta-strip {
                display: flex;
                justify-content: space-between;
                align-items: center;
                color: var(--copy-faint);
                font-family: var(--font-mono);
                font-size: 10px;
                font-weight: 600;
                letter-spacing: 0.08em;
            }

            .meta-strip.sub {
                margin-top: -10px;
                font-size: 9px;
                color: var(--copy-faint);
                opacity: 0.7;
            }

            .status-badge-inline {
                font-family: var(--font-mono);
                font-size: 9px;
                font-weight: 700;
                letter-spacing: 0.1em;
                padding: 2px 8px;
                border-radius: 99px;
                border: 1px solid var(--border);
                color: var(--copy-faint);
            }

            .status-badge-inline.active {
                background: rgba(122,153,112,0.1);
                color: var(--green-soft);
                border-color: rgba(122,153,112,0.3);
            }

            .summary-card {
                display: flex;
                justify-content: space-between;
                align-items: stretch;
                gap: 10px;
                background: var(--panel);
                border: 1px solid var(--border);
                padding: 16px;
            }

            .summary-left {
                display: flex;
                flex-direction: column;
            }

            .section-head {
                font-family: var(--font-mono);
                color: var(--copy-dim);
                font-size: 10px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                margin-bottom: 6px;
            }

            .score-row {
                display: flex;
                align-items: flex-end;
                gap: 2px;
            }

            .score-value {
                font-family: var(--font-mono);
                font-size: 42px;
                line-height: 1;
                font-weight: 800;
                color: var(--red-soft);
            }

            .score-max {
                font-family: var(--font-mono);
                color: var(--copy-faint);
                font-size: 13px;
                font-weight: 700;
                margin-bottom: 6px;
            }

            .risk-pill {
                min-width: 90px;
                background: var(--panel-2);
                border: 1px solid var(--border);
                padding: 10px 12px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                align-items: flex-end;
            }

            .risk-label-text {
                font-family: var(--font-mono);
                font-size: 11px;
                font-weight: 800;
                letter-spacing: 0.12em;
                text-transform: uppercase;
            }

            .risk-icon {
                margin-top: 8px;
            }

            .risk-critical { color: var(--red-soft); }
            .risk-high { color: var(--amber); }
            .risk-medium { color: var(--yellow); }
            .risk-low { color: var(--green-soft); }

            .section-title {
                font-family: var(--font-mono);
                color: var(--copy);
                font-size: 12px;
                font-weight: 800;
                letter-spacing: 0.12em;
                text-transform: uppercase;
                display: flex;
                align-items: center;
                gap: 8px;
                padding-top: 6px;
            }

            .threat-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 6px;
            }

            .threat-card {
                background: var(--panel);
                border: 1px solid var(--border-subtle);
                padding: 12px;
                min-height: 80px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
            }

            .threat-label {
                font-family: var(--font-mono);
                color: var(--copy);
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.06em;
                margin-bottom: 14px;
            }

            .threat-row {
                display: flex;
                align-items: flex-end;
                justify-content: space-between;
            }

            .threat-value {
                font-family: var(--font-mono);
                font-size: 24px;
                line-height: 1;
                font-weight: 800;
            }

            .recent-list {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            .recent-row {
                width: 100%;
                display: grid;
                grid-template-columns: 22px 1fr auto;
                gap: 10px;
                align-items: center;
                padding: 10px 4px;
                background: transparent;
                border: none;
                cursor: pointer;
                text-align: left;
                transition: background 0.12s ease;
            }

            .recent-row:hover {
                background: rgba(255,255,255,0.03);
            }

            .file-icon {
                display: flex;
                align-items: center;
                color: var(--copy-dim);
            }

            .file-icon.js { color: #F0DB4F; }
            .file-icon.py { color: #3572A5; }
            .file-icon.css { color: #563D7C; }
            .file-icon.json { color: var(--amber-dark); }
            .file-icon.folder { color: var(--amber); }

            .recent-file {
                font-family: var(--font-sans);
                color: var(--copy);
                font-size: 13px;
                font-weight: 500;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .recent-state {
                display: flex;
                align-items: center;
            }

            .issue-section {
                border: 1px solid var(--border);
                padding: 14px;
                margin-top: 4px;
            }

            .issue-row {
                display: flex;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px solid var(--border-subtle);
            }

            .issue-row:last-child {
                border-bottom: none;
            }

            .issue-row.total {
                border-top: 1px solid var(--border);
                margin-top: 4px;
                padding-top: 10px;
            }

            .issue-dot {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                margin-right: 10px;
                flex-shrink: 0;
            }

            .issue-label {
                flex: 1;
                font-size: 12px;
                color: var(--copy);
            }

            .issue-value {
                font-family: var(--font-mono);
                font-size: 13px;
                font-weight: 700;
                color: var(--copy);
            }

            .empty-copy {
                color: var(--copy-faint);
                font-size: 12px;
                font-style: italic;
                text-align: center;
                padding: 16px 0;
            }

            .footer-panel {
                margin-top: auto;
                padding-top: 12px;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .split-actions {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 6px;
            }

            .footer-meta {
                display: flex;
                justify-content: space-between;
                gap: 12px;
                font-family: var(--font-mono);
                color: var(--copy-faint);
                font-size: 10px;
                padding-top: 4px;
            }

            .online { color: var(--green-soft); }
            .idle { color: var(--copy-faint); }

            .watching-head {
                padding-top: 4px;
            }

            .live-indicator {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 4px;
            }

            .live-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: var(--amber);
                box-shadow: 0 0 8px var(--amber);
                animation: pulse 2s ease-in-out infinite;
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.4; transform: scale(0.85); }
            }

            .section-head.muted {
                color: var(--copy-faint);
                margin-bottom: 0;
                font-size: 9px;
            }

            .live-line {
                font-family: var(--font-mono);
                color: var(--amber);
                font-size: 13px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 6px;
                margin-top: 2px;
            }

            .watching-stack {
                display: flex;
                flex-direction: column;
                gap: 14px;
            }

            .watch-file {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            .watch-file-head {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-family: var(--font-mono);
                color: var(--copy-dim);
                font-size: 11px;
                font-weight: 600;
                padding: 4px 0;
                border-bottom: 1px solid var(--border-subtle);
            }

            .watch-count {
                color: var(--copy-faint);
                font-size: 11px;
            }

            .watch-card {
                background: var(--panel-2);
                border-left: 2px solid var(--yellow);
                padding: 12px 14px 10px;
            }

            .watch-critical { border-left-color: var(--red); }
            .watch-high { border-left-color: var(--amber); }
            .watch-medium { border-left-color: var(--yellow); }
            .watch-low, .watch-info { border-left-color: var(--green); }

            .watch-head {
                display: grid;
                grid-template-columns: 18px 1fr auto;
                gap: 8px;
                align-items: center;
                margin-bottom: 6px;
            }

            .watch-icon {
                display: flex;
                align-items: center;
            }

            .watch-title {
                font-size: 14px;
                font-weight: 700;
                color: var(--copy);
            }

            .watch-badge {
                font-family: var(--font-mono);
                font-size: 9px;
                font-weight: 800;
                letter-spacing: 0.06em;
                padding: 2px 6px;
                border: 1px solid rgba(255,255,255,0.1);
            }

            .sev-critical { color: var(--red); border-color: rgba(224,90,90,0.3); }
            .sev-high { color: var(--amber); border-color: rgba(255,157,18,0.3); }
            .sev-medium { color: var(--yellow); border-color: rgba(223,193,91,0.3); }
            .sev-low { color: var(--green); border-color: rgba(122,153,112,0.3); }

            .watch-copy {
                color: var(--copy-dim);
                font-size: 12px;
                line-height: 1.5;
                margin-bottom: 8px;
            }

            .watch-meta {
                font-family: var(--font-mono);
                color: var(--copy-faint);
                font-size: 10px;
            }

            .watch-sep {
                margin: 0 6px;
                opacity: 0.5;
            }

            .user-strip {
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: var(--panel);
                border: 1px solid var(--border-subtle);
                padding: 8px 12px;
                margin-top: -6px;
            }

            .user-info {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .user-avatar {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: var(--amber);
                color: #1A1000;
                font-family: var(--font-mono);
                font-size: 11px;
                font-weight: 800;
                display: grid;
                place-items: center;
                flex-shrink: 0;
            }

            .user-name {
                font-family: var(--font-mono);
                font-size: 11px;
                font-weight: 600;
                color: var(--copy);
                letter-spacing: 0.02em;
            }

            .ide-badge {
                display: flex;
                align-items: center;
                gap: 4px;
                font-family: var(--font-mono);
                font-size: 9px;
                font-weight: 700;
                color: var(--copy-dim);
                letter-spacing: 0.06em;
                background: var(--panel-2);
                border: 1px solid var(--border);
                padding: 3px 8px;
                border-radius: 4px;
            }

            .user-actions {
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .logout-btn {
                display: grid;
                place-items: center;
                padding: 4px;
                background: transparent;
                border: 1px solid var(--border);
                border-radius: 4px;
                color: var(--copy-dim);
                cursor: pointer;
                transition: all 0.15s ease;
            }

            .logout-btn:hover {
                background: rgba(224, 90, 90, 0.12);
                border-color: #E05A5A;
                color: #E05A5A;
            }

            .dropdown-wrap {
                position: relative;
            }

            .dropdown-menu {
                display: none;
                position: absolute;
                top: calc(100% + 6px);
                right: 0;
                min-width: 160px;
                background: var(--panel);
                border: 1px solid var(--border);
                border-radius: 6px;
                padding: 4px 0;
                z-index: 100;
                box-shadow: 0 8px 24px rgba(0,0,0,0.4);
                animation: dropIn 0.12s ease-out;
            }

            .dropdown-menu.open {
                display: block;
            }

            @keyframes dropIn {
                from { opacity: 0; transform: translateY(-4px); }
                to   { opacity: 1; transform: translateY(0); }
            }

            .dropdown-item {
                display: flex;
                align-items: center;
                gap: 8px;
                width: 100%;
                padding: 7px 12px;
                background: none;
                border: none;
                color: var(--copy);
                font-family: var(--font-mono);
                font-size: 11px;
                cursor: pointer;
                text-align: left;
                transition: background 0.1s;
            }

            .dropdown-item:hover {
                background: var(--panel-2);
            }

            .dropdown-item.danger {
                color: #E05A5A;
            }

            .dropdown-item.danger:hover {
                background: rgba(224, 90, 90, 0.1);
            }

            .dropdown-sep {
                height: 1px;
                background: var(--border);
                margin: 4px 0;
            }

            ::-webkit-scrollbar { width: 6px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
            ::-webkit-scrollbar-thumb:hover { background: var(--copy-faint); }
        `;
    }
}

export const aegisSidebarPanel = new AegisSidebarPanel();
