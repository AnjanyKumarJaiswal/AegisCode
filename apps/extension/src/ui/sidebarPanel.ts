import * as vscode from 'vscode';
import { setToken } from '../auth/tokenStore';
import { sessionManager } from '../session/sessionManager';
import { resultsPanel } from './resultsPanel';
import type { Vulnerability, ScanResponse } from '../api/scanApi';
import { logger } from '../utils/logger';

export type PanelState =
    | { kind: 'disconnected' }
    | { kind: 'connecting' }
    | { kind: 'idle'; scansToday: number; issuesFound: number }
    | { kind: 'active'; currentFile: string; scansToday: number; issuesFound: number }
    | { kind: 'alert'; currentFile: string; vulnerabilities: Vulnerability[]; lastResult: ScanResponse }
    | { kind: 'complete'; result: ScanResponse };

const ic = {
    shield:  `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:middle;flex-shrink:0"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5L12 1zm-1 14l-3-3 1.41-1.41L11 12.17l4.59-4.58L17 9l-6 6z"/></svg>`,
    check:   `<svg width="12" height="12" viewBox="0 0 24 24" fill="#7A9970" style="vertical-align:middle;flex-shrink:0"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>`,
    warning: `<svg width="13" height="13" viewBox="0 0 24 24" fill="#E05A5A" style="vertical-align:middle;flex-shrink:0"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>`,
    key:     `<svg width="12" height="12" viewBox="0 0 24 24" fill="#A89F94" style="vertical-align:middle;flex-shrink:0"><path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>`,
    search:  `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:middle;flex-shrink:0"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>`,
    info:    `<svg width="12" height="12" viewBox="0 0 24 24" fill="#C4701F" style="vertical-align:middle;flex-shrink:0"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>`,
    pin:     `<svg width="12" height="12" viewBox="0 0 24 24" fill="#4A4440" style="vertical-align:middle;flex-shrink:0"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`,
    chart:   `<svg width="12" height="12" viewBox="0 0 24 24" fill="#C4701F" style="vertical-align:middle;flex-shrink:0"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>`,
    stop:    `<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:middle;flex-shrink:0"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>`,
    refresh: `<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:middle;flex-shrink:0"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>`,
    external:`<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:middle;flex-shrink:0"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>`,
};

const frontend_url:string = process.env.FRONTEND_BASE_URL || "http://localhost:3000";

class SidebarPanel implements vscode.WebviewViewProvider {
    static readonly viewId = 'aegiscode.panel';

    private _view?: vscode.WebviewView;
    private _state: PanelState = { kind: 'disconnected' };

    resolveWebviewView(webviewView: vscode.WebviewView): void {
        this._view = webviewView;
        webviewView.webview.options = { enableScripts: true };
        webviewView.webview.html = this._buildHtml(this._state);

        webviewView.webview.onDidReceiveMessage(async (msg: { command: string; apiKey?: string }) => {
            logger.info(`Webview sent command: ${msg.command}`);
            switch (msg.command) {
                case 'connect':
                    if (msg.apiKey?.trim()) { await setToken(msg.apiKey.trim()); }
                    this.setState({ kind: 'connecting' });
                    await sessionManager.start();
                    break;
                case 'stopSession':
                    await sessionManager.stop();
                    break;
                case 'viewDetails':
                    vscode.commands.executeCommand('aegiscode.insertToChat');
                    break;
                case 'insertToChat':
                    vscode.commands.executeCommand('aegiscode.insertToChat');
                    break;
                case 'openDashboard':
                    vscode.env.openExternal(vscode.Uri.parse(frontend_url));
                    break;
                case 'scanProject':
                    vscode.commands.executeCommand('aegiscode.scanNow');
                    break;
                case 'disconnect':
                    vscode.commands.executeCommand('aegiscode.logout');
                    this.setState({ kind: 'disconnected' });
                    break;
                case 'newScan':
                    this.setState({ kind: 'idle', scansToday: 0, issuesFound: 0 });
                    break;
            }
        });
    }

    setState(state: PanelState): void {
        this._state = state;
        if (this._view) { this._view.webview.html = this._buildHtml(state); }
    }

    private _nonce(): string {
        let t = '';
        const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) t += c.charAt(Math.floor(Math.random() * c.length));
        return t;
    }

    private _esc(s: string): string {
        return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    private _basename(p: string): string {
        return p.replace(/\\/g, '/').split('/').pop() ?? p;
    }

    private _buildHtml(state: PanelState): string {
        const nonce = this._nonce();
        const isConnected = state.kind !== 'disconnected' && state.kind !== 'connecting';
        const isDone = state.kind === 'complete';
        const badge = isConnected
            ? `<span class="badge-ok">${ic.check} Connected</span>`
            : '';
        const logoText = isDone ? 'AegisCode &mdash; Done' : 'AegisCode';

        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>${this._css()}</style>
</head>
<body>
<div class="shell">
    <div class="topbar">
        <span class="logo">${ic.shield} ${logoText}</span>
        ${badge}
    </div>
    <div class="body">${this._body(state)}</div>
</div>
<script nonce="${nonce}">${this._script(state)}</script>
</body></html>`;
    }

    private _css(): string {
        return `
:root {
    --bg: #0E0D0C;
    --bg-sec: #141210;
    --surface: #1A1714;
    --border: #2E2A26;
    --white: #F5F2EE;
    --grey-sub: #A89F94;
    --grey-dim: #4A4440;
    --amber: #C4701F;
    --amber-grad: linear-gradient(135deg, #D47C2F 0%, #E8C97A 100%);
    --sage: #7A9970;
    --red: #E05A5A;
}

*{box-sizing:border-box;margin:0;padding:0;}
body {
    background: var(--bg);
    color: var(--white);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 12px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
}

.shell { display: flex; flex-direction: column; min-height: 100vh; padding: 16px 12px; gap: 20px; }

.topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.logo { font-family: "IBM Plex Mono", "Menlo", monospace; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--white); display: flex; align-items: center; gap: 8px; }
.badge-ok { font-size: 10px; color: var(--sage); font-weight: 500; display: flex; align-items: center; gap: 4px; background: rgba(122, 153, 112, 0.1); padding: 2px 8px; border-radius: 12px; border: 1px solid rgba(122, 153, 112, 0.2); }

.card { background: var(--bg-sec); border: 1px solid var(--border); border-radius: 8px; padding: 14px; position: relative; overflow: hidden; }
.card-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1.2px; color: var(--grey-dim); margin-bottom: 8px; font-weight: 700; display: block; }

.status-row { display: flex; align-items: center; gap: 8px; font-weight: 700; }
.dot { width: 6px; height: 6px; border-radius: 50%; }
.green { background: var(--sage); box-shadow: 0 0 8px var(--sage); }
.red { background: var(--red); box-shadow: 0 0 8px var(--red); }
@keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.9); } }
.pulse { animation: pulse 2s ease-in-out infinite; }

.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 12px; }
.stat-box { background: var(--surface); border: 1px solid var(--border); padding: 10px; border-radius: 6px; }
.stat-val { font-family: "IBM Plex Mono", monospace; font-size: 16px; font-weight: 600; color: var(--white); display: block; margin-top: 2px; }
.stat-key { font-size: 9px; color: var(--grey-sub); text-transform: uppercase; letter-spacing: 0.5px; }

.btn-group { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
button { font-family: inherit; font-size: 11px; font-weight: 600; padding: 10px; border-radius: 6px; border: 1px solid var(--border); cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; outline: none; }
button:hover { filter: brightness(1.1); transform: translateY(-1px); }
button:active { transform: translateY(0); }

.btn-primary { background: var(--amber-grad); color: #000; border: none; box-shadow: 0 4px 12px rgba(196, 112, 31, 0.2); }
.btn-secondary { background: var(--surface); color: var(--white); border-color: var(--border); }
.btn-danger { background: rgba(224, 90, 90, 0.05); color: var(--red); border-color: rgba(224, 90, 90, 0.2); }
.btn-ghost { background: transparent; color: var(--grey-dim); border: none; font-size: 10px; margin-top: 4px; font-weight: 400; }
.btn-ghost:hover { color: var(--grey-sub); background: transparent; }

.field { margin-bottom: 4px; }
.field-input { width: 100%; background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 10px; color: var(--white); font-family: "IBM Plex Mono", monospace; font-size: 12px; outline: none; transition: border-color 0.2s; }
.field-input:focus { border-color: var(--amber); }

.vuln-item { padding: 8px 0; border-bottom: 1px solid var(--border); display: flex; align-items: flex-start; gap: 10px; }
.vuln-item:last-child { border-bottom: none; }
.vuln-sev { width: 4px; height: 16px; border-radius: 2px; flex-shrink: 0; margin-top: 2px; }
.sev-critical { background: var(--red); box-shadow: 0 0 6px var(--red); }
.sev-high { background: #D47C2F; }
.sev-medium { background: #C4A020; }
.sev-low { background: var(--sage); }
.vuln-meta { display: flex; flex-direction: column; gap: 2px; }
.vuln-name { font-weight: 700; font-size: 11px; color: var(--white); }
.vuln-file { font-size: 9px; color: var(--grey-dim); font-family: "IBM Plex Mono", monospace; }

.infobox { font-size: 11px; color: var(--grey-sub); font-style: italic; text-align: center; padding: 0 10px; }
.loader-container { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 20px 0; }
.loader-bar { width: 100%; height: 2px; background: var(--border); border-radius: 1px; overflow: hidden; position: relative; }
.loader-progress { position: absolute; width: 30%; height: 100%; background: var(--amber-grad); animation: slide 1.5s infinite linear; }
@keyframes slide { from { left: -30%; } to { left: 100%; } }

.hint { font-size: 10px; color: var(--grey-dim); text-align: center; margin-top: 10px; }
.hint a { color: var(--amber); text-decoration: underline; cursor: pointer; }
`;
    }

    private _script(state: PanelState): string {
        const isLogin = state.kind === 'disconnected';
        return `const vsc=acquireVsCodeApi();
document.addEventListener('click',function(e){
    const b=e.target.closest('[data-cmd]');
    if(!b)return;
    const cmd=b.dataset.cmd;
    ${isLogin ? `if(cmd==='connect'){const k=document.getElementById('apiKey');vsc.postMessage({command:'connect',apiKey:k?k.value:''});return;}` : ''}
    vsc.postMessage({command:cmd});
});
${isLogin ? `document.addEventListener('keydown',function(e){if(e.key==='Enter'){const k=document.getElementById('apiKey');vsc.postMessage({command:'connect',apiKey:k?k.value:''});}});` : ''}`;
    }

    private _body(state: PanelState): string {
        switch (state.kind) {
            case 'disconnected': return this._disconnected();
            case 'connecting':   return this._connecting();
            case 'idle':         return this._idle(state);
            case 'active':       return this._active(state);
            case 'alert':        return this._alert(state);
            case 'complete':     return this._complete(state);
            default: return '';
        }
    }

    private _disconnected(): string {
        return `
    <div class="card">
        <span class="card-label">Security Gateway</span>
        <div class="field">
            <input id="apiKey" class="field-input" type="password" placeholder="Enter API Key" />
        </div>
        <div class="btn-group">
            <button class="btn-primary" data-cmd="connect">Authenticate Session</button>
            <button class="btn-secondary" data-cmd="openDashboard">Get Web Key ${ic.external}</button>
        </div>
        <p class="hint">No account? <a data-cmd="openDashboard">Go to dashboard</a></p>
    </div>`;
    }

    private _connecting(): string {
        return `
    <div class="loader-container">
        <p class="card-label">Initializing Pipeline</p>
        <div class="loader-bar"><div class="loader-progress"></div></div>
        <p class="infobox">Establishing secure tunnel to intelligence loop...</p>
    </div>`;
    }

    private _idle(state: { scansToday: number; issuesFound: number }): string {
        return `
    <div class="card">
        <div class="status-row">
            <span class="dot green pulse"></span>
            <span class="card-label" style="margin:0">Monitoring Service Idle</span>
        </div>
        <div class="stats-grid">
            <div class="stat-box">
                <span class="stat-val">${state.scansToday}</span>
                <span class="stat-key">Scans Done</span>
            </div>
            <div class="stat-box">
                <span class="stat-val">${state.issuesFound}</span>
                <span class="stat-key">Risk Flags</span>
            </div>
        </div>
    </div>
    <div class="btn-group">
        <button class="btn-primary" data-cmd="scanProject">${ic.search} Manual Audit</button>
        <button class="btn-danger" data-cmd="stopSession">${ic.stop} Close Pipeline</button>
        <button class="btn-ghost" data-cmd="disconnect">Disconnect Account</button>
    </div>
    <p class="infobox" style="margin-top:20px;">Watching for real-time AI code generation events...</p>`;
    }

    private _active(state: { currentFile: string; scansToday: number; issuesFound: number }): string {
        return `
    <div class="card">
        <div class="status-row">
            <span class="dot red pulse"></span>
            <span class="card-label" style="margin:0">Deep Analysis Active</span>
        </div>
        <p class="sub" style="margin-top:8px; font-size:10px; color:var(--grey-sub)">Inspecting: <span style="color:var(--white)">${state.currentFile ? this._basename(state.currentFile) : 'Scanning...'}</span></p>
        <div class="stats-grid">
            <div class="stat-box">
                <span class="stat-val">${state.scansToday}</span>
                <span class="stat-key">Audit Loop</span>
            </div>
            <div class="stat-box">
                <span class="stat-val">${state.issuesFound}</span>
                <span class="stat-key">Vulnerabilities</span>
            </div>
        </div>
    </div>
    <div class="btn-group">
        <button class="btn-danger" data-cmd="stopSession">${ic.stop} Terminate</button>
        <button class="btn-ghost" data-cmd="disconnect">Disconnect</button>
    </div>`;
    }

    private _alert(state: { currentFile: string; vulnerabilities: Vulnerability[] }): string {
        const items = state.vulnerabilities.map(v => `
        <div class="vuln-item">
            <div class="vuln-sev sev-${v.severity}"></div>
            <div class="vuln-meta">
                <span class="vuln-name">${this._esc(v.type)}</span>
                <span class="vuln-file">${v.severity.toUpperCase()} REASONING</span>
            </div>
        </div>`).join('');

        return `
    <div class="card" style="border-color:rgba(224, 90, 90, 0.3)">
        <div class="status-row" style="color:var(--red)">
            ${ic.warning}
            <span class="card-label" style="margin:0; color:var(--red)">Vulnerabilities Flagged</span>
        </div>
        <div style="margin-top:12px;">
            ${items}
        </div>
    </div>
    <div class="btn-group">
        <button class="btn-primary" data-cmd="insertToChat">Insert to Chat 💬</button>
        <button class="btn-secondary" data-cmd="scanProject">${ic.refresh} Re-Analyze</button>
        <button class="btn-danger" data-cmd="stopSession">${ic.stop} Stop</button>
        <button class="btn-ghost" data-cmd="disconnect">Disconnect</button>
    </div>`;
    }

    private _complete(state: { result: ScanResponse }): string {
        const v = state.result.vulnerabilities;
        const count = (s: string) => v.filter(x => x.severity === s).length;
        
        return `
    <div class="card">
        <span class="card-label">Audit Complete</span>
        <div class="stats-grid">
            <div class="stat-box" style="border-color:var(--red)">
                <span class="stat-val" style="color:var(--red)">${count('critical') + count('high')}</span>
                <span class="stat-key">High Risk</span>
            </div>
            <div class="stat-box">
                <span class="stat-val">${count('medium') + count('low')}</span>
                <span class="stat-key">Warnings</span>
            </div>
        </div>
    </div>
    <div class="btn-group">
        <button class="btn-primary" data-cmd="insertToChat">Insert to Chat 💬</button>
        <button class="btn-secondary" data-cmd="newScan">${ic.refresh} New Audit</button>
        <button class="btn-danger" data-cmd="stopSession">${ic.stop} Stop</button>
        <button class="btn-ghost" data-cmd="disconnect">Disconnect</button>
    </div>`;
    }
}

export const sidebarPanel = new SidebarPanel();
