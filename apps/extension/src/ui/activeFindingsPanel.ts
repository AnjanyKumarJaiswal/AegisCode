import * as vscode from "vscode";
import type { Vulnerability, ScanResponse, Severity } from "../api/scanApi";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Code,
  Copy,
  MessageSquare,
  EyeOff,
  Sparkles,
  FileText,
  Filter,
  MoreHorizontal,
  Target,
} from "./icons";

type PanelCommand =
  | { command: "select"; id: string }
  | { command: "jump"; id: string }
  | { command: "copy"; id: string }
  | { command: "ignore"; id: string }
  | { command: "insertToChat" };

class ActiveFindingsPanel {
  private panel: vscode.WebviewPanel | undefined;
  private lastResult: ScanResponse | undefined;
  private selectedId: string | undefined;
  private ignoredIds = new Set<string>();

  show(result: ScanResponse): void {
    this.lastResult = {
      ...result,
      vulnerabilities: result.vulnerabilities.filter(
        (vuln) => !this.ignoredIds.has(vuln.id),
      ),
    };
    this.selectedId = this.lastResult.vulnerabilities[0]?.id;

    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.Beside);
      this.render();
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      "aegiscodeActiveFindings",
      "AegisCode - Active Findings",
      vscode.ViewColumn.Beside,
      { enableScripts: true, retainContextWhenHidden: true },
    );

    this.panel.webview.onDidReceiveMessage(async (message: PanelCommand) => {
      await this.handleMessage(message);
    });

    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });

    this.render();
  }

  clear(): void {
    this.lastResult = undefined;
    this.selectedId = undefined;
    this.ignoredIds.clear();
    this.render();
  }

  dispose(): void {
    this.panel?.dispose();
  }

  private async handleMessage(message: PanelCommand): Promise<void> {
    if (!this.lastResult) {
      return;
    }

    switch (message.command) {
      case "select":
        this.selectedId = message.id;
        this.render();
        return;
      case "jump": {
        const vuln = this.findVulnerability(message.id);
        if (!vuln) return;

        const document = await vscode.workspace.openTextDocument(vuln.filePath);
        const editor = await vscode.window.showTextDocument(document, {
          preview: false,
          viewColumn: vscode.ViewColumn.One,
        });
        const lineIndex = Math.max(0, vuln.line - 1);
        const range = new vscode.Range(lineIndex, 0, lineIndex, 0);
        editor.selection = new vscode.Selection(range.start, range.end);
        editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
        return;
      }
      case "copy": {
        const vuln = this.findVulnerability(message.id);
        if (!vuln) return;

        await vscode.env.clipboard.writeText(vuln.suggestion);
        void vscode.window.showInformationMessage(
          "AegisCode: Fix suggestion copied.",
        );
        return;
      }
      case "ignore":
        this.ignoredIds.add(message.id);
        this.lastResult.vulnerabilities =
          this.lastResult.vulnerabilities.filter(
            (vuln) => vuln.id !== message.id,
          );
        this.selectedId = this.lastResult.vulnerabilities[0]?.id;
        this.render();
        return;
      case "insertToChat":
        await vscode.commands.executeCommand("aegiscode.insertToChat");
        return;
    }
  }

  private findVulnerability(id: string): Vulnerability | undefined {
    return this.lastResult?.vulnerabilities.find((vuln) => vuln.id === id);
  }

  private render(): void {
    if (!this.panel) {
      return;
    }

    this.panel.webview.html = this.buildHtml();
  }

  private selectedFinding(): Vulnerability | undefined {
    return (
      this.lastResult?.vulnerabilities.find(
        (vuln) => vuln.id === this.selectedId,
      ) || this.lastResult?.vulnerabilities[0]
    );
  }

  private severityColor(severity: Severity): string {
    const map: Record<Severity, string> = {
      critical: "#E05A5A",
      high: "#ff9d12",
      medium: "#dfc15b",
      low: "#7A9970",
      info: "#7fa0b7",
    };
    return map[severity];
  }

  private severityIcon(severity: Severity, size = 14): string {
    switch (severity) {
      case "critical":
        return `<span style="color:#E05A5A">${AlertTriangle(size)}</span>`;
      case "high":
        return `<span style="color:#ff9d12">${AlertCircle(size)}</span>`;
      case "medium":
        return `<span style="color:#dfc15b">${Info(size)}</span>`;
      case "low":
        return `<span style="color:#7A9970">${CheckCircle(size)}</span>`;
      default:
        return `<span style="color:#7fa0b7">${Info(size)}</span>`;
    }
  }

  private severityMarker(severity: Severity): string {
    const markers: Record<Severity, string> = {
      critical: "CRITICAL",
      high: "HIGH SEVERITY",
      medium: "MEDIUM",
      low: "LOW",
      info: "INFO",
    };
    return markers[severity];
  }

  private basename(path: string): string {
    return path.replace(/\\/g, "/").split("/").pop() || path;
  }

  private relativePath(filePath: string): string {
    const parts = filePath.replace(/\\/g, "/").split("/");
    return parts.slice(-3).join("/");
  }

  private escape(str: string | undefined | null): string {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  private buildHtml(): string {
    const nonce = String(Date.now());
    const vulns = this.lastResult?.vulnerabilities || [];
    const selected = this.selectedFinding();

    const otherFindings = vulns.filter((v) => v.id !== selected?.id);
    const list = otherFindings
      .map((vuln) => {
        return `
                <button class="finding-item" data-command="select" data-id="${this.escape(vuln.id)}">
                    <div class="finding-row">
                        <span class="finding-icon">${this.severityIcon(vuln.severity, 13)}</span>
                        <div class="finding-copy">
                            <span class="finding-severity" style="color:${this.severityColor(vuln.severity)}">${vuln.severity.toUpperCase()}</span>
                            <span class="finding-title">${this.escape(vuln.title)}</span>
                        </div>
                        <span class="finding-location">${this.escape(this.relativePath(vuln.filePath))}:${vuln.line}</span>
                    </div>
                </button>
            `;
      })
      .join("");

    const body = selected
      ? `
            <div class="focus-card severity-${selected.severity}">
                <div class="focus-head">
                    <div class="focus-label" style="color:${this.severityColor(selected.severity)}">
                        ${this.severityIcon(selected.severity, 12)}
                        ${this.severityMarker(selected.severity)}
                    </div>
                    <div class="focus-confidence">Conf: ${selected.confidence}%</div>
                </div>
                <div class="focus-title">${this.escape(selected.title)}</div>
                <div class="focus-meta">
                    ${FileText(11)} ${this.escape(this.relativePath(selected.filePath))}
                    <span class="dot">|</span> Line ${selected.line}
                </div>

                <div class="section-label">DIAGNOSIS</div>
                <div class="focus-description">${this.escape(selected.description)}</div>

                <div class="section-label">REMEDIATION STRATEGY</div>
                <div class="code-card">
                    <div class="code-meta">
                        <span>${this.escape(this.relativePath(selected.filePath))}</span>
                        <span class="code-lang">TypeScript</span>
                    </div>
                    <pre class="code-block">${this.escape(selected.suggestion)}</pre>
                </div>

                <button class="primary-action" data-command="copy" data-id="${this.escape(selected.id)}">
                    ${Sparkles(14)} Apply Fix via Aegis Code
                </button>

                <div class="action-grid">
                    <button class="action-btn" data-command="jump" data-id="${this.escape(selected.id)}">
                        ${Code(13)} Jump to Code
                    </button>
                    <button class="action-btn" data-command="copy" data-id="${this.escape(selected.id)}">
                        ${Copy(13)} Copy Fix
                    </button>
                    <button class="action-btn" data-command="insertToChat">
                        ${MessageSquare(13)} Insert into Chat
                    </button>
                    <button class="action-btn" data-command="ignore" data-id="${this.escape(selected.id)}">
                        ${EyeOff(13)} Ignore
                    </button>
                </div>
            </div>

            ${
              otherFindings.length > 0
                ? `
                <div class="finding-list">${list}</div>
            `
                : ""
            }
        `
      : `
            <div class="empty-state">
                <div class="empty-icon">${Target(28)}</div>
                <div class="empty-title">No active findings</div>
                <div class="empty-copy">Run a scan to populate this panel.</div>
            </div>
        `;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AegisCode Active Findings</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap');

        :root {
            --bg: #0E0D0C;
            --panel: #1A1714;
            --panel-2: #201D19;
            --border: #2E2A26;
            --border-subtle: rgba(255,255,255,0.04);
            --copy: #E8E2D9;
            --copy-dim: #A89F94;
            --copy-faint: #5C5650;
            --amber: #FF9D12;
            --red: #E05A5A;
            --green: #7A9970;
            --yellow: #dfc15b;
            --font-mono: "JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas", monospace;
            --font-sans: "Inter", "Segoe UI", -apple-system, sans-serif;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            background: var(--bg);
            color: var(--copy);
            font-family: var(--font-sans);
            font-size: 13px;
            line-height: 1.5;
            -webkit-font-smoothing: antialiased;
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
            padding: 16px 14px 22px;
        }

        /* ── Header ─────────────────────────────────── */
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 18px;
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .header-title {
            font-family: var(--font-mono);
            color: var(--copy);
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
        }

        .count-badge {
            background: var(--panel-2);
            border-radius: 4px;
            padding: 2px 7px;
            font-family: var(--font-mono);
            font-size: 11px;
            font-weight: 700;
            color: var(--copy-dim);
        }

        .header-actions {
            display: flex;
            gap: 4px;
        }

        .icon-btn {
            width: 26px;
            height: 26px;
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

        /* ── Focus Card ──────────────────────────────── */
        .focus-card {
            background: var(--panel-2);
            border-left: 3px solid var(--amber);
            padding: 18px 16px;
            margin-bottom: 12px;
        }

        .severity-critical { border-left-color: var(--red); }
        .severity-high { border-left-color: var(--amber); }
        .severity-medium { border-left-color: var(--yellow); }
        .severity-low { border-left-color: var(--green); }
        .severity-info { border-left-color: #7fa0b7; }

        .focus-head {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }

        .focus-label {
            font-family: var(--font-mono);
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .focus-confidence {
            background: var(--panel);
            color: var(--copy-dim);
            padding: 3px 8px;
            font-family: var(--font-mono);
            font-size: 11px;
            font-weight: 700;
            border-radius: 4px;
        }

        .focus-title {
            font-size: 20px;
            font-weight: 700;
            line-height: 1.2;
            color: #f0efec;
            margin-bottom: 10px;
        }

        .focus-meta {
            color: var(--copy-dim);
            font-family: var(--font-mono);
            font-size: 11px;
            font-weight: 500;
            margin-bottom: 18px;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .dot {
            color: var(--copy-faint);
            margin: 0 4px;
        }

        /* ── Section Labels ──────────────────────────── */
        .section-label {
            font-family: var(--font-mono);
            color: var(--copy-faint);
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            margin-bottom: 8px;
        }

        .focus-description {
            color: var(--copy);
            font-size: 13px;
            line-height: 1.6;
            margin-bottom: 18px;
        }

        .focus-description code {
            font-family: var(--font-mono);
            background: rgba(255,255,255,0.06);
            padding: 1px 5px;
            border-radius: 3px;
            font-size: 12px;
            color: var(--amber);
        }

        /* ── Code Card ───────────────────────────────── */
        .code-card {
            background: var(--bg);
            border: 1px solid var(--border);
            border-radius: 4px;
            margin-bottom: 16px;
            overflow: hidden;
        }

        .code-meta {
            display: flex;
            justify-content: space-between;
            padding: 8px 12px;
            border-bottom: 1px solid var(--border);
            font-family: var(--font-mono);
            color: var(--copy-faint);
            font-size: 10px;
            font-weight: 600;
        }

        .code-lang {
            color: var(--copy-dim);
        }

        .code-block {
            margin: 0;
            padding: 14px 12px;
            white-space: pre-wrap;
            font-family: var(--font-mono);
            font-size: 11px;
            line-height: 1.65;
            color: var(--copy);
        }

        /* ── Primary Action Button ───────────────────── */
        .primary-action {
            width: 100%;
            background: var(--amber);
            color: #1A1000;
            padding: 14px 12px;
            font-family: var(--font-mono);
            font-size: 13px;
            font-weight: 800;
            letter-spacing: 0.02em;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-bottom: 10px;
            transition: all 0.15s ease;
        }

        .primary-action:hover {
            background: #FFB040;
            transform: translateY(-1px);
            box-shadow: 0 4px 16px rgba(255,157,18,0.25);
        }

        .primary-action:active {
            transform: translateY(0);
        }

        /* ── Action Grid ─────────────────────────────── */
        .action-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px;
            margin-bottom: 16px;
        }

        .action-btn {
            width: 100%;
            background: var(--panel);
            color: var(--copy);
            border: 1px solid var(--border);
            padding: 10px 10px;
            font-size: 11px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            transition: all 0.15s ease;
        }

        .action-btn:hover {
            background: var(--panel-2);
            border-color: var(--copy-faint);
        }

        /* ── Finding List ────────────────────────────── */
        .finding-list {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .finding-item {
            width: 100%;
            background: transparent;
            padding: 12px 10px;
            text-align: left;
            border-bottom: 1px solid var(--border-subtle);
            transition: background 0.12s ease;
        }

        .finding-item:hover {
            background: rgba(255,255,255,0.03);
        }

        .finding-row {
            display: grid;
            grid-template-columns: 16px 1fr auto;
            gap: 10px;
            align-items: center;
        }

        .finding-icon {
            display: flex;
            align-items: center;
        }

        .finding-copy {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        .finding-severity {
            font-family: var(--font-mono);
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.1em;
        }

        .finding-title {
            color: var(--copy);
            font-size: 13px;
            font-weight: 600;
        }

        .finding-location {
            font-family: var(--font-mono);
            color: var(--copy-faint);
            font-size: 10px;
            text-align: right;
        }

        /* ── Empty State ─────────────────────────────── */
        .empty-state {
            min-height: 70vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
        }

        .empty-icon {
            width: 60px;
            height: 60px;
            border-radius: 16px;
            background: var(--panel-2);
            display: grid;
            place-items: center;
            color: var(--amber);
            margin-bottom: 18px;
        }

        .empty-title {
            font-size: 20px;
            font-weight: 700;
            color: #f0eeea;
            margin-bottom: 8px;
        }

        .empty-copy {
            color: var(--copy-dim);
            font-size: 13px;
            max-width: 280px;
        }

        /* ── Scrollbar ───────────────────────────────── */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--copy-faint); }
    </style>
</head>
<body>
    <div class="shell">
        <div class="header">
            <div class="header-left">
                <span class="header-title">Active Findings</span>
                <span class="count-badge">${vulns.length}</span>
            </div>
            <div class="header-actions">
                <button class="icon-btn" title="Filter">${Filter(14)}</button>
                <button class="icon-btn" title="More">${MoreHorizontal(14)}</button>
            </div>
        </div>
        ${body}
    </div>
    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        document.addEventListener('click', (event) => {
            const target = event.target.closest('[data-command]');
            if (!target) {
                return;
            }
            vscode.postMessage({
                command: target.dataset.command,
                id: target.dataset.id
            });
        });
    </script>
</body>
</html>`;
  }
}

export const activeFindingsPanel = new ActiveFindingsPanel();
