import * as vscode from 'vscode';
import { initTokenStore } from './auth/tokenStore';
import { login, logout, isAuthenticated, loginWithGithub, handleOAuthCallback, getDisplayName } from './auth/authManager';
import { sessionManager } from './session/sessionManager';
import { codeScanner } from './scanner/codeScanner';
import { statusBar } from './ui/statusBar';
import { diagnostics } from './ui/diagnostics';
import { activeFindingsPanel } from './ui/activeFindingsPanel';
import {
    aegisSidebarPanel,
    type ThreatCounts,
    type RecentScanItem,
    type LiveFileItem,
} from './ui/aegisSidebarPanel';
import { scan, type ScanResponse, type Severity, type Vulnerability } from './api/scanApi';
import { getIdeClientName } from './utils/ideClient';
import { logger } from './utils/logger';

export async function activate(context: vscode.ExtensionContext) {
    initTokenStore(context);
    logger.info('AegisCode activated');

    const sidebarRegistration = vscode.window.registerWebviewViewProvider(
        SidebarPanelViewId,
        aegisSidebarPanel,
        { webviewOptions: { retainContextWhenHidden: true } }
    );

    let lastRunLabel = 'never';
    let currentActiveFile = '';
    let lastScanResult: ScanResponse | undefined;
    const findingsByFile = new Map<string, Vulnerability[]>();
    let recentScans: RecentScanItem[] = [];

    const zeroCounts = (): ThreatCounts => ({
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
    });

    const highestSeverity = (vulnerabilities: Vulnerability[]): Severity | 'clean' => {
        if (vulnerabilities.some(v => v.severity === 'critical')) return 'critical';
        if (vulnerabilities.some(v => v.severity === 'high')) return 'high';
        if (vulnerabilities.some(v => v.severity === 'medium')) return 'medium';
        if (vulnerabilities.some(v => v.severity === 'low')) return 'low';
        if (vulnerabilities.some(v => v.severity === 'info')) return 'info';
        return 'clean';
    };

    const calculateCounts = (): ThreatCounts => {
        const counts = zeroCounts();
        for (const vulnerabilities of findingsByFile.values()) {
            for (const vulnerability of vulnerabilities) {
                if (vulnerability.severity === 'critical') counts.critical++;
                else if (vulnerability.severity === 'high') counts.high++;
                else if (vulnerability.severity === 'medium') counts.medium++;
                else counts.low++;
            }
        }
        return counts;
    };

    const totalIssues = (): number => {
        const counts = calculateCounts();
        return counts.critical + counts.high + counts.medium + counts.low;
    };

    const currentScore = (): number => {
        return lastScanResult?.score ?? 10;
    };

    const scoreLabel = (score: number): string => {
        if (score >= 9) return 'LOW';
        if (score >= 7) return 'MEDIUM';
        if (score >= 5) return 'HIGH';
        return 'CRITICAL';
    };

    const liveFiles = (): LiveFileItem[] => {
        const preferredOrder = recentScans.map(item => item.filePath);
        const files = Array.from(findingsByFile.entries())
            .filter(([, vulnerabilities]) => vulnerabilities.length > 0)
            .sort((a, b) => {
                const aIdx = preferredOrder.indexOf(a[0]);
                const bIdx = preferredOrder.indexOf(b[0]);
                return (aIdx === -1 ? Number.MAX_SAFE_INTEGER : aIdx) - (bIdx === -1 ? Number.MAX_SAFE_INTEGER : bIdx);
            })
            .slice(0, 4);

        return files.map(([filePath, vulnerabilities]) => ({
            filePath,
            issueCount: vulnerabilities.length,
            findings: vulnerabilities.slice(0, 3),
        }));
    };

    const renderSidebar = async (): Promise<void> => {
        const authed = await isAuthenticated();
        const username = await getDisplayName();

        if (!authed) {
            aegisSidebarPanel.setState({ kind: 'auth' });
            return;
        }

        if (sessionManager.getState() === 'error') {
            aegisSidebarPanel.setState({
                kind: 'offline',
                code: 'ERR_CONN_REFUSED',
                detail: 'Attempted to contact the backend but no response was received.',
            });
            return;
        }

        if (sessionManager.isActive()) {
            aegisSidebarPanel.setState({
                kind: 'watching',
                activeFile: currentActiveFile,
                lastRunLabel,
                threatCounts: calculateCounts(),
                totalIssues: totalIssues(),
                liveFiles: liveFiles(),
                username: username || undefined,
                ide: getIdeClientName(),
            });
            return;
        }

        const score = currentScore();
        aegisSidebarPanel.setState({
            kind: 'dashboard',
            score,
            riskLabel: scoreLabel(score),
            lastRunLabel,
            active: false,
            threatCounts: calculateCounts(),
            totalIssues: totalIssues(),
            recentScans,
            username: username || undefined,
            ide: getIdeClientName(),
        });
    };

    const recordRecentScan = (filePath: string, vulnerabilities: Vulnerability[]): void => {
        const nextItem: RecentScanItem = {
            filePath,
            status: highestSeverity(vulnerabilities),
            issueCount: vulnerabilities.length,
            scannedAtLabel: 'just now',
        };

        recentScans = [nextItem, ...recentScans.filter(item => item.filePath !== filePath)].slice(0, 5);
    };

    const applyScanResult = (uri: vscode.Uri, result: ScanResponse, revealPanel: boolean): void => {
        currentActiveFile = uri.fsPath;
        lastScanResult = result;
        findingsByFile.set(uri.fsPath, result.vulnerabilities);
        recordRecentScan(uri.fsPath, result.vulnerabilities);
        lastRunLabel = 'just now';

        diagnostics.apply(uri, result.vulnerabilities);
        statusBar.updateIssueCount(result.vulnerabilities.length);

        if (result.vulnerabilities.length > 0 && revealPanel) {
            activeFindingsPanel.show(result);
        }

        void renderSidebar();
    };

    const ensureSession = async (): Promise<{ sessionId?: string; temporary: boolean }> => {
        let sessionId = sessionManager.getSessionId();
        if (sessionId) {
            return { sessionId, temporary: false };
        }

        await sessionManager.start();
        sessionId = sessionManager.getSessionId();
        return { sessionId, temporary: !!sessionId };
    };

    const scanDocument = async (
        document: vscode.TextDocument,
        sessionId: string,
        revealPanel: boolean,
    ): Promise<ScanResponse> => {
        currentActiveFile = document.uri.fsPath;
        await renderSidebar();

        const result = await scan({
            sessionId,
            filePath: document.uri.fsPath,
            languageId: document.languageId,
            content: document.getText(),
        });

        applyScanResult(document.uri, result, revealPanel);
        return result;
    };

    const handleOffline = async (detail: string): Promise<void> => {
        logger.error('AegisCode backend unavailable', detail);
        aegisSidebarPanel.setState({
            kind: 'offline',
            code: 'ERR_CONN_REFUSED',
            detail,
        });
    };

    await renderSidebar();

    const onStateChange = sessionManager.onStateChange(state => {
        statusBar.syncWithState(state);
        if (state === 'active') {
            codeScanner.start();
        } else {
            codeScanner.stop();
            diagnostics.clearAll();
            if (state !== 'error') {
                activeFindingsPanel.clear();
            }
        }
        void renderSidebar();
    });

    const onScanStart = codeScanner.onScanStart((uri) => {
        currentActiveFile = uri.fsPath;
        void renderSidebar();
    });

    const onScanResult = codeScanner.onScanResult((uri, result) => {
        applyScanResult(uri, result, true);
    });

    const startSession = vscode.commands.registerCommand('aegiscode.startSession', async () => {
        logger.info('Command: aegiscode.startSession triggered');
        await sessionManager.start();
        await renderSidebar();
    });

    const stopSession = vscode.commands.registerCommand('aegiscode.stopSession', async () => {
        await sessionManager.stop();
        await renderSidebar();
    });

    const scanNow = vscode.commands.registerCommand('aegiscode.scanNow', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('AegisCode: No active file to scan.');
            return;
        }

        const document = editor.document;
        let temporary = false;
        try {
            const ensured = await ensureSession();
            if (!ensured.sessionId) {
                return;
            }
            temporary = ensured.temporary;
            logger.info('Manual scan started', document.fileName);
            await scanDocument(document, ensured.sessionId, true);
            logger.info('Manual scan complete', document.fileName);
        } catch (err: any) {
            logger.error('Manual scan failed', err.message || err.toString());
            await handleOffline(err.message || 'Manual scan failed.');
            vscode.window.showErrorMessage('AegisCode: Scan failed. Check the output panel.');
        } finally {
            if (temporary) {
                await sessionManager.stop();
                await renderSidebar();
            }
        }
    });

    const scanWorkspace = vscode.commands.registerCommand('aegiscode.scanWorkspace', async () => {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders || folders.length === 0) {
            void vscode.window.showWarningMessage('AegisCode: Open a workspace to scan.');
            return;
        }

        const include = '**/*';
        const exclude = '**/{node_modules,.git,.turbo,dist,.next,coverage,out}/**';
        const allowedExtensions = new Set([
            'ts', 'tsx', 'js', 'jsx', 'py', 'java', 'go', 'rb', 'php', 'cs',
            'json', 'yml', 'yaml', 'env', 'sql', 'md', 'css', 'scss', 'html',
        ]);

        let temporary = false;
        try {
            const ensured = await ensureSession();
            if (!ensured.sessionId) {
                return;
            }

            temporary = ensured.temporary;
            const sessionId = ensured.sessionId;
            const uris = await vscode.workspace.findFiles(include, exclude, 25);
            const candidates: vscode.Uri[] = [];

            for (const uri of uris) {
                const ext = uri.fsPath.split('.').pop()?.toLowerCase() || '';
                if (ext && !allowedExtensions.has(ext)) {
                    continue;
                }

                const stat = await vscode.workspace.fs.stat(uri);
                if (stat.size > 120_000) {
                    continue;
                }

                candidates.push(uri);
            }

            await vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: 'AegisCode: Scanning workspace',
                    cancellable: false,
                },
                async (progress) => {
                    for (let index = 0; index < candidates.length; index++) {
                        const uri = candidates[index];
                        progress.report({
                            message: `${index + 1}/${candidates.length} ${uri.path.split('/').pop()}`,
                            increment: candidates.length === 0 ? 100 : 100 / candidates.length,
                        });

                        const document = await vscode.workspace.openTextDocument(uri);
                        if (document.getText().trim().length === 0) {
                            continue;
                        }

                        await scanDocument(document, sessionId, index === candidates.length - 1);
                    }
                }
            );
        } catch (err: any) {
            logger.error('Workspace scan failed', err.message || err.toString());
            await handleOffline(err.message || 'Workspace scan failed.');
            void vscode.window.showErrorMessage('AegisCode: Workspace scan failed.');
        } finally {
            if (temporary) {
                await sessionManager.stop();
                await renderSidebar();
            }
        }
    });

    const insertToChat = vscode.commands.registerCommand('aegiscode.insertToChat', async () => {
        logger.info('Executing aegiscode.insertToChat command');
        const vulnerabilities = lastScanResult?.vulnerabilities || [];
        const targetFile = vulnerabilities[0]?.filePath || currentActiveFile || 'Multiple / Workspace';

        if (!vulnerabilities || vulnerabilities.length === 0) {
            logger.warn('Insert to chat aborted: no vulnerabilities in current report.');
            vscode.window.showInformationMessage('AegisCode: No vulnerabilities to insert. (Code is secure or scan has not run).');
            return;
        }

        let md = `# AegisCode Security Audit Report\n\n`;
        md += `**Target File:** \`${targetFile}\`\n`;
        md += `**Total Issues Flagged:** ${vulnerabilities.length}\n\n`;
        md += `---\n\n`;

        vulnerabilities.forEach((v, i) => {
            md += `### ${i + 1}. [${v.severity}] ${v.title || v.type || 'Vulnerability'}\n`;
            if (v.line) {
                md += `- **Line Number:** ${v.line}\n`;
            }
            md += `- **Description:** ${v.description}\n`;
            
            const fix = v.suggestion || 'Please review and secure this code.';
            md += `- **Recommendation:** ${fix}\n\n`;
        });

        const folderUri = vscode.workspace.workspaceFolders?.[0]?.uri;
        let reportUri: vscode.Uri;
        
        if (folderUri) {
            reportUri = vscode.Uri.joinPath(folderUri, 'aegiscode-audit.md');
        } else {
    
            logger.warn('No workspace folder found, creating untitled document instead.');
            try {
                const doc = await vscode.workspace.openTextDocument({
                    content: md,
                    language: 'markdown'
                });
                await vscode.window.showTextDocument(doc, { preview: false, viewColumn: vscode.ViewColumn.Beside });
                
                const prompt = `Please read the markdown file I just opened and apply the recommended security fixes to my code in ${targetFile}.`;
                await vscode.env.clipboard.writeText(prompt);
                
                vscode.window.showInformationMessage('AegisCode: Report created! The prompt has been copied to your clipboard.');
                logger.info('Untitled markdown report generated and prompt copied.');
                return;
            } catch (fallbackErr: any) {
                logger.error('Failed to create untitled markdown report', fallbackErr.message);
                vscode.window.showErrorMessage('AegisCode: Failed to generate report file.');
                return;
            }
        }

        try {
            logger.info(`Writing markdown report to: ${reportUri.fsPath}`);
            await vscode.workspace.fs.writeFile(reportUri, Buffer.from(md, 'utf8'));

            logger.info('Opening markdown report in editor');
            const doc = await vscode.workspace.openTextDocument(reportUri);
            await vscode.window.showTextDocument(doc, { preview: false, viewColumn: vscode.ViewColumn.Beside });

            const prompt = `Please read the aegiscode-audit.md file and apply the recommended security fixes to my code in ${targetFile}.`;
            await vscode.env.clipboard.writeText(prompt);

            vscode.window.showInformationMessage('AegisCode: Report created! The prompt has been copied to your clipboard. Paste it into your AI chat and hit enter!');
            logger.info('Markdown report successfully generated and prompt copied to clipboard.');
        } catch (e: any) {
            logger.error('Failed to create markdown report', e.message || e.toString());
            vscode.window.showErrorMessage('AegisCode: Failed to generate report file.');
        }
    });

    const signIn = vscode.commands.registerCommand('aegiscode.login', async () => {
        const success = await login();
        await renderSidebar();
        return success;
    });
    const signOut = vscode.commands.registerCommand('aegiscode.logout', async () => {
        await logout();
        await renderSidebar();
    });

    const signInGithub = vscode.commands.registerCommand('aegiscode.signInGithub', async () => {
        await loginWithGithub();
    });

    const uriHandler = vscode.window.registerUriHandler({
        async handleUri(uri: vscode.Uri) {
            if (uri.path === '/auth/callback') {
                const params = new URLSearchParams(uri.query);
                const token = params.get('token');
                if (token) {
                    const success = await handleOAuthCallback(token);
                    if (success) {
                        await renderSidebar();
                        vscode.commands.executeCommand('workbench.view.extension.aegiscode');
                    }
                } else {
                    logger.warn('OAuth callback URI received without token');
                    vscode.window.showErrorMessage('AegisCode: Sign-in failed — no token received.');
                }
            }
        }
    });

    context.subscriptions.push(
        sidebarRegistration,
        onStateChange,
        onScanStart,
        onScanResult,
        startSession,
        stopSession,
        scanNow,
        scanWorkspace,
        insertToChat,
        signIn,
        signOut,
        signInGithub,
        uriHandler,
        statusBar,
        diagnostics,
        activeFindingsPanel,
        { dispose: () => logger.dispose() }
    );
}

const SidebarPanelViewId = 'aegiscode.panel';

export function deactivate() {}
