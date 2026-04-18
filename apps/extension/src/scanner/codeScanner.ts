import * as vscode from 'vscode';
import { scan } from '../api/scanApi';
import { sessionManager } from '../session/sessionManager';
import { debounce } from '../utils/debounce';
import { logger } from '../utils/logger';
import type { ScanResponse } from '../api/scanApi';

const DEBOUNCE_DELAY_MS = 5000;
const IGNORED_SCHEMES = new Set(['output', 'debug', 'walkThrough', 'vscode', 'git']);

type ScanResultHandler = (uri: vscode.Uri, result: ScanResponse) => void;
type ScanStartHandler = (uri: vscode.Uri) => void;

class CodeScanner {
    private disposable: vscode.Disposable | undefined;
    private listeners: ScanResultHandler[] = [];
    private scanStartListeners: ScanStartHandler[] = [];

    private readonly debouncedScan = debounce(async (document: vscode.TextDocument) => {
        const sessionId = sessionManager.getSessionId();
        if (!sessionId) {
            return;
        }

        const content = document.getText();
        if (content.trim().length === 0) {
            return;
        }

        try {
            logger.info('Scanning', document.fileName);
            this.scanStartListeners.forEach(listener => listener(document.uri));
            const result = await scan({
                sessionId,
                filePath: document.uri.fsPath,
                languageId: document.languageId,
                content,
            });
            logger.info(`Scan complete — ${result.vulnerabilities.length} issue(s)`, document.fileName);
            this.listeners.forEach(l => l(document.uri, result));
        } catch (err: any) {
            logger.error('Scan failed', err.message || err.toString(), err.stack);
        }
    }, DEBOUNCE_DELAY_MS);

    onScanResult(handler: ScanResultHandler): vscode.Disposable {
        this.listeners.push(handler);
        return new vscode.Disposable(() => {
            this.listeners = this.listeners.filter(l => l !== handler);
        });
    }

    onScanStart(handler: ScanStartHandler): vscode.Disposable {
        this.scanStartListeners.push(handler);
        return new vscode.Disposable(() => {
            this.scanStartListeners = this.scanStartListeners.filter(l => l !== handler);
        });
    }

    start(): void {
        if (this.disposable) {
            return;
        }

        this.disposable = vscode.workspace.onDidChangeTextDocument(event => {
            const document = event.document;

            if (IGNORED_SCHEMES.has(document.uri.scheme)) {
                return;
            }

            if (document.uri.fsPath.includes('node_modules')) {
                return;
            }

            if (!sessionManager.isActive()) {
                logger.info('Document changed but no active session - ignored', document.fileName);
                return;
            }

            logger.info('Document changed, starting debouncer...', document.fileName);
            this.debouncedScan(document);
        });

        logger.info('Scanner started');
    }

    stop(): void {
        this.disposable?.dispose();
        this.disposable = undefined;
        logger.info('Scanner stopped');
    }
}

export const codeScanner = new CodeScanner();
