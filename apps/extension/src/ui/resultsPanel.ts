import * as vscode from 'vscode';
import type { Vulnerability, ScanResponse } from '../api/scanApi';

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
            this.panel.webview.html = this.buildHtml({ scanId: '', vulnerabilities: [] });
        }
    }

    dispose(): void {
        this.panel?.dispose();
    }

    private severityColor(severity: string): string {
        const map: Record<string, string> = {
            critical: '#E05A5A',
            high: '#D47C2F',
            medium: '#C4A020',
            low: '#62d13dff',
        };
        return map[severity] ?? '#A89F94';
    }

    private buildVulnCard(vuln: Vulnerability): string {
        const color = this.severityColor(vuln.severity);
        return `
        <div class="card">
            <div class="card-header">
                <span class="badge" style="border-color:${color};color:${color}">${vuln.severity.toUpperCase()}</span>
                <span class="vuln-type">${this.escape(vuln.type)}</span>
                <span class="line-ref">Line ${vuln.line}${vuln.endLine !== vuln.line ? `–${vuln.endLine}` : ''}</span>
            </div>
            <p class="description">${this.escape(vuln.description)}</p>
            ${vuln.suggestion ? `<p class="suggestion"><span class="suggestion-label">Fix:</span> ${this.escape(vuln.suggestion)}</p>` : ''}
        </div>`;
    }

    private escape(str: string): string {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    private buildHtml(result: ScanResponse): string {
        const vulns = result.vulnerabilities;
        const issueCount = vulns.length;

        const cards = issueCount > 0
            ? vulns.map(v => this.buildVulnCard(v)).join('')
            : `<div class="empty">
                <span class="empty-icon">✦</span>
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
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
        background: #0E0D0C;
        color: #F5F2EE;
        font-family: -apple-system, 'Segoe UI', sans-serif;
        font-size: 13px;
        padding: 24px;
        min-height: 100vh;
    }

    .header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 1px solid #2E2A26;
    }

    .logo { font-size: 18px; font-weight: 600; color: #F5F2EE; letter-spacing: -0.3px; }
    .logo span { color: #C4701F; }

    .meta { margin-left: auto; color: #A89F94; font-size: 12px; }

    .summary {
        display: flex;
        gap: 12px;
        margin-bottom: 20px;
    }

    .stat {
        background: #1A1714;
        border: 1px solid #2E2A26;
        border-radius: 6px;
        padding: 10px 16px;
        flex: 1;
        text-align: center;
    }

    .stat-value { font-size: 22px; font-weight: 600; color: #F5F2EE; }
    .stat-label { font-size: 11px; color: #A89F94; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.5px; }

    .card {
        background: #1A1714;
        border: 1px solid #2E2A26;
        border-radius: 8px;
        padding: 14px 16px;
        margin-bottom: 10px;
    }

    .card-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
    }

    .badge {
        font-size: 10px;
        font-weight: 700;
        padding: 2px 7px;
        border-radius: 4px;
        border: 1px solid;
        letter-spacing: 0.5px;
        flex-shrink: 0;
    }

    .vuln-type { font-weight: 600; font-size: 13px; color: #F5F2EE; }

    .line-ref {
        margin-left: auto;
        font-size: 11px;
        color: #A89F94;
        font-family: 'Menlo', 'Consolas', monospace;
        white-space: nowrap;
    }

    .description { color: #A89F94; line-height: 1.6; font-size: 12px; }

    .suggestion {
        margin-top: 8px;
        padding: 8px 10px;
        background: #141210;
        border-left: 2px solid #C4701F;
        border-radius: 0 4px 4px 0;
        font-size: 12px;
        color: #D4CFC9;
        line-height: 1.6;
    }

    .suggestion-label { color: #C4701F; font-weight: 600; margin-right: 4px; }

    .empty {
        text-align: center;
        padding: 60px 24px;
        color: #4A4440;
    }

    .empty-icon { font-size: 32px; display: block; margin-bottom: 12px; color: #7A9970; }
    .empty p { color: #A89F94; }

    .section-title {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        color: #4A4440;
        margin-bottom: 12px;
    }
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
        <div class="stat-value" style="color:#C4A020">${vulns.filter(v => v.severity === 'medium').length}</div>
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
