import * as vscode from 'vscode';
import { setToken } from '../auth/tokenStore';
import { sessionManager } from '../session/sessionManager';
import { resultsPanel } from './resultsPanel';
import type { Vulnerability, ScanResponse } from '../api/scanApi';

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
                    vscode.commands.executeCommand('aegiscode.scanNow');
                    break;
                case 'openDashboard':
                    vscode.env.openExternal(vscode.Uri.parse(frontend_url));
                    break;
                case 'scanProject':
                    vscode.commands.executeCommand('aegiscode.scanNow');
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
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
        }
    }

    private _disconnected(): string {
        return `
<p class="section-label">Connect to Security Platform</p>
<div class="field">
    <label class="field-label">${ic.key} API Key</label>
    <input id="apiKey" class="field-input" type="password" placeholder="Paste your API key..." />
</div>
<div class="row">
    <button class="btn-primary" data-cmd="connect">Connect</button>
    <button class="btn-secondary" data-cmd="openDashboard">Get Key ${ic.external}</button>
</div>
<p class="hint">New user? <a data-cmd="openDashboard">Sign up at aegiscode.com</a></p>`;
    }

    private _connecting(): string {
        return `
<div class="center">
    <p class="sub" style="margin-bottom:18px;">Activating AI Vulnerability<br>Detection...</p>
    <div class="loader">${'<div class="ldot"></div>'.repeat(8)}</div>
    <ul class="steps">
        <li>Connecting to security platform...</li>
        <li>Initializing AI models...</li>
        <li>Setting up real-time monitoring...</li>
    </ul>
</div>`;
    }

    private _idle(state: { scansToday: number; issuesFound: number }): string {
        return `
<div class="status-row"><span class="dot green"></span><span>Monitoring Active (Idle)</span></div>
<p class="sub" style="margin-bottom:14px;">No recent AI activity detected</p>
<hr class="divider">
<div class="infobox">
    <div class="infobox-title">${ic.info} Manual Scan</div>
    Want to scan existing code for vulnerabilities?
</div>
<div class="col-btns">
    <button class="btn-secondary full" data-cmd="scanProject">${ic.search} Scan Current File</button>
    <button class="btn-danger full" data-cmd="stopSession">${ic.stop} Stop Session</button>
</div>
<hr class="divider">
<div class="stats">
    <div class="stat-row"><span class="sk">Scans Today</span><span class="sv">${state.scansToday}</span></div>
    <div class="stat-row"><span class="sk">Issues Found</span><span class="sv">${state.issuesFound}</span></div>
</div>
<button class="btn-secondary full" data-cmd="openDashboard">Dashboard ${ic.external}</button>`;
    }

    private _active(state: { currentFile: string; scansToday: number; issuesFound: number }): string {
        return `
<div class="status-row"><span class="dot red pulse"></span><span>MONITORING ACTIVE</span></div>
<p class="sub" style="margin-bottom:14px;">Analyzing code changes...</p>
<div class="stats">
    <div class="stat-row"><span class="sk">Current File</span><span class="sv trunc">${state.currentFile ? this._basename(state.currentFile) : '—'}</span></div>
    <div class="stat-row"><span class="sk">Scans Today</span><span class="sv">${state.scansToday}</span></div>
    <div class="stat-row"><span class="sk">Issues Found</span><span class="sv">${state.issuesFound}</span></div>
</div>
<hr class="divider">
<div class="col-btns">
    <button class="btn-secondary full" data-cmd="openDashboard">Dashboard ${ic.external}</button>
    <button class="btn-danger full" data-cmd="stopSession">${ic.stop} Stop Session</button>
</div>`;
    }

    private _alert(state: { currentFile: string; vulnerabilities: Vulnerability[] }): string {
        const groups = { critical: [] as Vulnerability[], high: [] as Vulnerability[], medium: [] as Vulnerability[], low: [] as Vulnerability[] };
        for (const v of state.vulnerabilities) { groups[v.severity as keyof typeof groups]?.push(v); }
        const items = [
            ...groups.critical.map(v => `<li>${this._esc(v.type)}</li>`),
            ...groups.high.map(v => `<li class="high">${this._esc(v.type)}</li>`),
            ...groups.medium.map(v => `<li class="med">${this._esc(v.type)}</li>`),
            ...groups.low.map(v => `<li class="low">${this._esc(v.type)}</li>`),
        ].join('');
        return `
<div class="alert-head">${ic.warning}<span>VULNERABILITIES DETECTED</span></div>
<div class="infobox-title" style="margin-bottom:6px;">${ic.chart} Quick Summary:</div>
<ul class="vuln-list">${items}</ul>
<p class="loc">${ic.pin} <span>${state.currentFile ? this._basename(state.currentFile) : '—'}</span></p>
<div class="col-btns">
    <button class="btn-primary full" data-cmd="viewDetails">View Details</button>
    <button class="btn-secondary full" data-cmd="scanProject">${ic.refresh} Re-scan File</button>
    <button class="btn-danger full" data-cmd="stopSession">${ic.stop} Stop Session</button>
</div>`;
    }

    private _complete(state: { result: ScanResponse }): string {
        const v = state.result.vulnerabilities;
        const count = (s: string) => v.filter(x => x.severity === s).length;
        return `
<p class="section-label">Results Summary</p>
<ul class="sev-list">
    <li><span class="sev-dot" style="background:#E05A5A"></span><span class="sk">Critical</span><span class="sv">${count('critical')}</span></li>
    <li><span class="sev-dot" style="background:#D47C2F"></span><span class="sk">High</span><span class="sv">${count('high')}</span></li>
    <li><span class="sev-dot" style="background:#C4A020"></span><span class="sk">Medium</span><span class="sv">${count('medium')}</span></li>
    <li><span class="sev-dot" style="background:#62d13d"></span><span class="sk">Low</span><span class="sv">${count('low')}</span></li>
</ul>
<hr class="divider">
<div class="col-btns">
    <button class="btn-primary full" data-cmd="viewDetails">View Detailed Report</button>
    <button class="btn-secondary full" data-cmd="newScan">${ic.refresh} New Scan</button>
    <button class="btn-danger full" data-cmd="stopSession">${ic.stop} Stop Session</button>
</div>`;
    }

    private _css(): string {
        return `
*{box-sizing:border-box;margin:0;padding:0;}
body{background:#0E0D0C;color:#F5F2EE;font-family:'Menlo','Consolas',monospace;font-size:12px;line-height:1.6;overflow-x:hidden;}
.shell{display:flex;flex-direction:column;min-height:100vh;}
.topbar{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid #2E2A26;background:#141210;position:sticky;top:0;z-index:10;}
.logo{font-weight:700;font-size:11px;letter-spacing:0.3px;display:flex;align-items:center;gap:6px;}
.badge-ok{font-size:10px;color:#7A9970;display:flex;align-items:center;gap:4px;}
.body{padding:14px 12px;flex:1;}
.section-label{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#4A4440;margin-bottom:10px;}
.status-row{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;margin-bottom:12px;}
.dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
.green{background:#62d13d;box-shadow:0 0 6px #62d13d88;}
.red{background:#E05A5A;box-shadow:0 0 6px #E05A5A88;}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.3;}}
.pulse{animation:pulse 1.4s infinite;}
.divider{border:none;border-top:1px solid #2E2A26;margin:14px 0;}
.stats{display:flex;flex-direction:column;gap:4px;margin-bottom:14px;}
.stat-row,.sev-list li{display:flex;align-items:center;gap:8px;padding:3px 0;}
.sev-list{list-style:none;margin-bottom:14px;}
.sev-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
.sk{color:#A89F94;font-size:11px;flex:1;}
.sv{color:#F5F2EE;font-size:11px;font-weight:600;}
.trunc{max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
button{font-family:inherit;font-size:11px;padding:5px 10px;border-radius:4px;border:1px solid #2E2A26;cursor:pointer;transition:opacity 0.15s;display:flex;align-items:center;justify-content:center;gap:5px;}
button:hover{opacity:0.75;}
.btn-primary{background:#C4701F;color:#F5F2EE;border-color:#C4701F;font-weight:600;}
.btn-secondary{background:#1A1714;color:#A89F94;border-color:#2E2A26;}
.btn-danger{background:#1A1714;color:#E05A5A;border-color:#E05A5A44;}
.full{width:100%;}
.row{display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;}
.col-btns{display:flex;flex-direction:column;gap:6px;margin-top:10px;}
.field{margin-bottom:12px;}
.field-label{display:flex;align-items:center;gap:5px;font-size:10px;color:#A89F94;margin-bottom:5px;text-transform:uppercase;letter-spacing:0.5px;}
.field-input{width:100%;background:#141210;border:1px solid #2E2A26;border-radius:4px;padding:6px 8px;color:#F5F2EE;font-family:inherit;font-size:12px;outline:none;}
.field-input:focus{border-color:#C4701F;}
.hint{margin-top:12px;font-size:10px;color:#4A4440;}
.hint a{color:#C4701F;cursor:pointer;}
.sub{color:#A89F94;font-size:11px;}
.center{text-align:center;padding:16px 0;}
.loader{display:flex;justify-content:center;gap:4px;margin:16px 0;}
.ldot{width:8px;height:8px;border-radius:50%;background:#C4701F;}
.ldot:nth-child(1){animation:lp 1.2s 0s infinite;}.ldot:nth-child(2){animation:lp 1.2s .15s infinite;}.ldot:nth-child(3){animation:lp 1.2s .3s infinite;}.ldot:nth-child(4){animation:lp 1.2s .45s infinite;}
.ldot:nth-child(5){animation:lp 1.2s .6s infinite;background:#2E2A26;}.ldot:nth-child(6){animation:lp 1.2s .75s infinite;background:#2E2A26;}.ldot:nth-child(7){animation:lp 1.2s .9s infinite;background:#2E2A26;}.ldot:nth-child(8){animation:lp 1.2s 1.05s infinite;background:#2E2A26;}
@keyframes lp{0%,100%{opacity:0.3;transform:scale(0.8);}50%{opacity:1;transform:scale(1.1);}}
.steps{list-style:none;text-align:left;font-size:11px;color:#A89F94;line-height:2;}
.steps li::before{content:'– ';color:#C4701F;}
.infobox{background:#141210;border:1px solid #2E2A26;border-radius:4px;padding:10px 12px;margin:12px 0;font-size:11px;color:#A89F94;}
.infobox-title{display:flex;align-items:center;gap:5px;color:#C4701F;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;}
.alert-head{display:flex;align-items:center;gap:8px;color:#E05A5A;font-weight:700;font-size:12px;margin-bottom:12px;}
.vuln-list{list-style:none;margin-bottom:12px;}
.vuln-list li{font-size:11px;color:#A89F94;padding:2px 0 2px 10px;position:relative;}
.vuln-list li::before{content:'•';position:absolute;left:0;color:#E05A5A;}
.vuln-list li.high::before{color:#D47C2F;}.vuln-list li.med::before{color:#C4A020;}.vuln-list li.low::before{color:#62d13d;}
.loc{display:flex;align-items:center;gap:5px;font-size:10px;color:#4A4440;margin-bottom:14px;}.loc span{color:#A89F94;}`;
    }
}

export const sidebarPanel = new SidebarPanel();
