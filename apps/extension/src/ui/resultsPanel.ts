import * as vscode from 'vscode';
import type { Vulnerability, ScanResponse } from '../api/scanApi';
import {
    AlertTriangle,
    AlertCircle,
    Info,
    CheckCircle,
    Shield,
} from './icons';

class ResultsPanel {
    private panel: vscode.WebviewPanel | undefined;
    private lastResult: ScanResponse | undefined;

    show(result: ScanResponse): void {
        this.lastResult = result;

        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.Beside);
            this.panel.webview.html = this.buildHtml(result);
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            'aegiscodeResults',
            'AegisCode — Scan Results',
            vscode.ViewColumn.Beside,
            { enableScripts: false, retainContextWhenHidden: true }
        );

        this.panel.webview.html = this.buildHtml(result);

        this.panel.onDidDispose(() => {
            this.panel = undefined;
        });
    }

    clear(): void {
        this.lastResult = undefined;
        if (this.panel) {
            this.panel.webview.html = this.buildHtml({ scanId: '', score: 10, vulnerabilities: [] });
        }
    }

    dispose(): void {
        this.panel?.dispose();
    }

    private severityColor(severity: string): string {
        const map: Record<string, string> = {
            critical: '#E05A5A',
            high: '#ff9d12',
            medium: '#dfc15b',
            low: '#7A9970',
        };
        return map[severity] ?? '#A89F94';
    }

    private severityIcon(severity: string, size = 14): string {
        switch (severity) {
            case 'critical':
                return `<span style="color:#E05A5A">${AlertTriangle(size)}</span>`;
            case 'high':
                return `<span style="color:#ff9d12">${AlertCircle(size)}</span>`;
            case 'medium':
                return `<span style="color:#dfc15b">${Info(size)}</span>`;
            case 'low':
                return `<span style="color:#7A9970">${CheckCircle(size)}</span>`;
            default:
                return `<span style="color:#A89F94">${Info(size)}</span>`;
        }
    }

    private buildVulnCard(vuln: Vulnerability): string {
        const color = this.severityColor(vuln.severity);
        return `
        <div class="card">
            <div class="card-header">
                <span class="badge" style="border-color:${color};color:${color}">${vuln.severity.toUpperCase()}</span>
                ${this.severityIcon(vuln.severity, 13)}
                <span class="vuln-type">${this.escape(vuln.type)}</span>
                <span class="line-ref">Line ${vuln.line}${vuln.endLine !== vuln.line ? `–${vuln.endLine}` : ''}</span>
            </div>
            <p class="description">${this.escape(vuln.description)}</p>
            ${vuln.suggestion ? `<p class="suggestion"><span class="suggestion-label">Fix:</span> ${this.escape(vuln.suggestion)}</p>` : ''}
        </div>`;
    }

    private escape(str: string | undefined | null): string {
        return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    private buildHtml(result: ScanResponse): string {
        const vulns = result.vulnerabilities;
        const issueCount = vulns.length;

        const cards = issueCount > 0
            ? vulns.map(v => this.buildVulnCard(v)).join('')
            : `<div class="empty">
                <span class="empty-icon">${Shield(32)}</span>
                <p>No vulnerabilities detected in this scan.</p>
               </div>`;

        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AegisCode Scan Results</title>
<style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap');

    :root {
        --bg: #0E0D0C;
        --panel: #1A1714;
        --panel-2: #201D19;
        --border: #2E2A26;
        --copy: #E8E2D9;
        --copy-dim: #A89F94;
        --copy-faint: #5C5650;
        --amber: #FF9D12;
        --amber-dark: #C4701F;
        --font-mono: "JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas", monospace;
        --font-sans: "Inter", "Segoe UI", -apple-system, sans-serif;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
        background: var(--bg);
        color: var(--copy);
        font-family: var(--font-sans);
        font-size: 13px;
        padding: 24px;
        min-height: 100vh;
        -webkit-font-smoothing: antialiased;
    }

    .header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--border);
    }

    .logo {
        font-family: var(--font-mono);
        font-size: 16px;
        font-weight: 800;
        color: var(--copy);
        letter-spacing: 0.04em;
    }

    .logo span { color: var(--amber); }

    .meta {
        margin-left: auto;
        color: var(--copy-dim);
        font-family: var(--font-mono);
        font-size: 11px;
    }

    .summary {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
    }

    .stat {
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 6px;
        padding: 12px 16px;
        flex: 1;
        text-align: center;
    }

    .stat-value {
        font-family: var(--font-mono);
        font-size: 22px;
        font-weight: 800;
        color: var(--copy);
    }

    .stat-label {
        font-family: var(--font-mono);
        font-size: 10px;
        color: var(--copy-dim);
        margin-top: 4px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
    }

    .card {
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 14px 16px;
        margin-bottom: 10px;
    }

    .card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
    }

    .badge {
        font-family: var(--font-mono);
        font-size: 9px;
        font-weight: 800;
        padding: 2px 7px;
        border-radius: 4px;
        border: 1px solid;
        letter-spacing: 0.06em;
        flex-shrink: 0;
    }

    .vuln-type {
        font-weight: 700;
        font-size: 13px;
        color: var(--copy);
    }

    .line-ref {
        margin-left: auto;
        font-family: var(--font-mono);
        font-size: 11px;
        color: var(--copy-dim);
        white-space: nowrap;
    }

    .description {
        color: var(--copy-dim);
        line-height: 1.6;
        font-size: 12px;
    }

    .suggestion {
        margin-top: 8px;
        padding: 8px 12px;
        background: var(--bg);
        border-left: 2px solid var(--amber);
        border-radius: 0 4px 4px 0;
        font-size: 12px;
        color: var(--copy);
        line-height: 1.6;
    }

    .suggestion-label {
        color: var(--amber);
        font-weight: 700;
        margin-right: 4px;
    }

    .empty {
        text-align: center;
        padding: 60px 24px;
        color: var(--copy-faint);
    }

    .empty-icon {
        display: block;
        margin: 0 auto 16px;
        color: #7A9970;
    }

    .empty p {
        color: var(--copy-dim);
        font-size: 14px;
    }

    .section-title {
        font-family: var(--font-mono);
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--copy-faint);
        margin-bottom: 12px;
        font-weight: 700;
    }

    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
</style>
</head>
<body>
<div class="header">
    <div class="logo">Aegis<span>Code</span></div>
    <div class="meta">Scan ID: ${this.escape(result.scanId || '—')}</div>
</div>

<div class="summary">
    <div class="stat">
        <div class="stat-value">${issueCount}</div>
        <div class="stat-label">Total Issues</div>
    </div>
    <div class="stat">
        <div class="stat-value" style="color:#E05A5A">${vulns.filter(v => v.severity === 'critical' || v.severity === 'high').length}</div>
        <div class="stat-label">High / Critical</div>
    </div>
    <div class="stat">
        <div class="stat-value" style="color:#dfc15b">${vulns.filter(v => v.severity === 'medium').length}</div>
        <div class="stat-label">Medium</div>
    </div>
    <div class="stat">
        <div class="stat-value" style="color:#7A9970">${vulns.filter(v => v.severity === 'low').length}</div>
        <div class="stat-label">Low</div>
    </div>
</div>

${issueCount > 0 ? '<p class="section-title">Vulnerabilities</p>' : ''}
${cards}
</body>
</html>`;
    }
}

export const resultsPanel = new ResultsPanel();
