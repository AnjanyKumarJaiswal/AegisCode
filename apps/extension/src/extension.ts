import * as vscode from 'vscode';
import { initTokenStore } from './auth/tokenStore';
import { login, logout, isAuthenticated } from './auth/authManager';
import { sessionManager } from './session/sessionManager';
import { codeScanner } from './scanner/codeScanner';
import { statusBar } from './ui/statusBar';
import { diagnostics } from './ui/diagnostics';
import { resultsPanel } from './ui/resultsPanel';
import { sidebarPanel } from './ui/sidebarPanel';
import { scan } from './api/scanApi';
import { logger } from './utils/logger';

export async function activate(context: vscode.ExtensionContext) {
    initTokenStore(context);
    logger.info('AegisCode activated');

    const sidebarRegistration = vscode.window.registerWebviewViewProvider(
        SidebarPanelViewId,
        sidebarPanel,
        { webviewOptions: { retainContextWhenHidden: true } }
    );

    const authed = await isAuthenticated();
    sidebarPanel.setState(
        authed
            ? { kind: 'idle', scansToday: 0, issuesFound: 0 }
            : { kind: 'disconnected' }
    );

    let totalScans = 0;
    let totalIssues = 0;

    const onStateChange = sessionManager.onStateChange(state => {
        statusBar.syncWithState(state);
        if (state === 'active') {
            codeScanner.start();
            sidebarPanel.setState({ kind: 'active', currentFile: '', scansToday: totalScans, issuesFound: totalIssues });
        } else {
            codeScanner.stop();
            diagnostics.clearAll();
            resultsPanel.clear();
            totalScans = 0;
            totalIssues = 0;
            sidebarPanel.setState({ kind: 'idle', scansToday: 0, issuesFound: 0 });
        }
    });

    const onScanResult = codeScanner.onScanResult((uri, result) => {
        diagnostics.apply(uri, result.vulnerabilities);
        statusBar.updateIssueCount(result.vulnerabilities.length);
        totalScans++;
        totalIssues += result.vulnerabilities.length;

        if (result.vulnerabilities.length > 0) {
            resultsPanel.show(result);
            sidebarPanel.setState({
                kind: 'alert',
                currentFile: uri.fsPath,
                vulnerabilities: result.vulnerabilities,
                lastResult: result,
            });
        } else {
            sidebarPanel.setState({
                kind: 'active',
                currentFile: uri.fsPath,
                scansToday: totalScans,
                issuesFound: totalIssues,
            });
        }
    });

    const startSession = vscode.commands.registerCommand('aegiscode.startSession', () => {
        sessionManager.start();
    });

    const stopSession = vscode.commands.registerCommand('aegiscode.stopSession', () => {
        sessionManager.stop();
    });

    const scanNow = vscode.commands.registerCommand('aegiscode.scanNow', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('AegisCode: No active file to scan.');
            return;
        }
        if (!sessionManager.isActive()) {
            vscode.window.showWarningMessage('AegisCode: Start a session first.');
            return;
        }
        const sessionId = sessionManager.getSessionId()!;
        const document = editor.document;
        try {
            const result = await scan({
                sessionId,
                filePath: document.uri.fsPath,
                languageId: document.languageId,
                content: document.getText(),
            });
            diagnostics.apply(document.uri, result.vulnerabilities);
            statusBar.updateIssueCount(result.vulnerabilities.length);
            resultsPanel.show(result);
            sidebarPanel.setState({ kind: 'complete', result });
        } catch (err) {
            logger.error('Manual scan failed', err);
            vscode.window.showErrorMessage('AegisCode: Scan failed. Check the output panel.');
        }
    });

    const signIn = vscode.commands.registerCommand('aegiscode.login', () => login());
    const signOut = vscode.commands.registerCommand('aegiscode.logout', () => logout());

    context.subscriptions.push(
        sidebarRegistration,
        onStateChange,
        onScanResult,
        startSession,
        stopSession,
        scanNow,
        signIn,
        signOut,
        statusBar,
        diagnostics,
        resultsPanel,
        { dispose: () => logger.dispose() }
    );
}

const SidebarPanelViewId = 'aegiscode.panel';

export function deactivate() {}
