import * as vscode from "vscode";
import type { Vulnerability, ScanResponse, Severity } from "../api/scanApi";
import {
  buildWebviewStyles,
  severityColor as themeSeverityColor,
  WEBVIEW_FONT_CSP,
} from "./webviewTheme";
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
    return themeSeverityColor(severity);
  }

  private severityIcon(severity: Severity, size = 14): string {
    const color = this.severityColor(severity);
    switch (severity) {
      case "critical":
        return `<span style="color:${color}">${AlertTriangle(size)}</span>`;
      case "high":
        return `<span style="color:${color}">${AlertCircle(size)}</span>`;
      case "medium":
        return `<span style="color:${color}">${Info(size)}</span>`;
      case "low":
        return `<span style="color:${color}">${CheckCircle(size)}</span>`;
      default:
        return `<span style="color:${color}">${Info(size)}</span>`;
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

                <div class="section-head">Why this is a risk</div>
                <div class="focus-description">${this.escape(selected.description)}</div>

                <div class="section-head">Recommended fix</div>
                <div class="code-card">
                    <div class="code-meta">
                        <span>${this.escape(this.relativePath(selected.filePath))}</span>
                        <span class="code-lang">TypeScript</span>
                    </div>
                    <pre class="code-block">${this.escape(selected.suggestion)}</pre>
                </div>

                <button class="primary-action" data-command="copy" data-id="${this.escape(selected.id)}">
                    ${Sparkles(14)} Copy Recommended Fix
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
                <div class="empty-copy-text">Run a scan to populate this panel.</div>
            </div>
        `;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; script-src 'nonce-${nonce}'; ${WEBVIEW_FONT_CSP}">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AegisCode Active Findings</title>
    <style>${buildWebviewStyles("findings")}</style>
</head>
<body>
    <div class="shell findings-shell">
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
