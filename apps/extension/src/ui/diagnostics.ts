import * as vscode from 'vscode';
import type { Vulnerability } from '../api/scanApi';

const SEVERITY_MAP: Record<string, vscode.DiagnosticSeverity> = {
    critical: vscode.DiagnosticSeverity.Error,
    high: vscode.DiagnosticSeverity.Error,
    medium: vscode.DiagnosticSeverity.Warning,
    low: vscode.DiagnosticSeverity.Information,
    info: vscode.DiagnosticSeverity.Information,
};

class Diagnostics {
    private collection: vscode.DiagnosticCollection;

    constructor() {
        this.collection = vscode.languages.createDiagnosticCollection('aegiscode');
    }

    apply(uri: vscode.Uri, vulnerabilities: Vulnerability[]): void {
        const diagnostics = vulnerabilities.map(vuln => {
            const startLine = Math.max(0, vuln.line - 1);
            const endLine = Math.max(startLine, vuln.endLine - 1);

            const range = new vscode.Range(
                new vscode.Position(startLine, 0),
                new vscode.Position(endLine, Number.MAX_SAFE_INTEGER)
            );

            const diagnostic = new vscode.Diagnostic(
                range,
                `[AegisCode] ${vuln.type}: ${vuln.description}`,
                SEVERITY_MAP[vuln.severity] ?? vscode.DiagnosticSeverity.Warning
            );

            diagnostic.source = 'AegisCode';
            diagnostic.code = vuln.id;

            return diagnostic;
        });

        this.collection.set(uri, diagnostics);
    }

    clearFile(uri: vscode.Uri): void {
        this.collection.delete(uri);
    }

    clearAll(): void {
        this.collection.clear();
    }

    dispose(): void {
        this.collection.dispose();
    }
}

export const diagnostics = new Diagnostics();
