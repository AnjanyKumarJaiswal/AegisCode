import * as vscode from 'vscode';
import { startSession as apiStartSession, stopSession as apiStopSession } from '../api/sessionApi';
import { isAuthenticated, login } from '../auth/authManager';
import { logger } from '../utils/logger';

export type SessionState = 'idle' | 'active' | 'error';

type SessionChangeHandler = (state: SessionState) => void;

class SessionManager {
    private sessionId: string | undefined;
    private state: SessionState = 'idle';
    private listeners: SessionChangeHandler[] = [];

    getState(): SessionState {
        return this.state;
    }

    getSessionId(): string | undefined {
        return this.sessionId;
    }

    isActive(): boolean {
        return this.state === 'active';
    }

    onStateChange(handler: SessionChangeHandler): vscode.Disposable {
        this.listeners.push(handler);
        return new vscode.Disposable(() => {
            this.listeners = this.listeners.filter(l => l !== handler);
        });
    }

    private setState(state: SessionState): void {
        this.state = state;
        this.listeners.forEach(l => l(state));
    }

    async start(): Promise<void> {
        if (this.state === 'active') {
            vscode.window.showWarningMessage('AegisCode: A session is already active.');
            return;
        }

        const authed = await isAuthenticated();
        if (!authed) {
            const success = await login();
            if (!success) {
                return;
            }
        }

        try {
            const response = await apiStartSession();
            this.sessionId = response.id;
            this.setState('active');
            logger.info('Session started', this.sessionId);
            vscode.window.showInformationMessage('AegisCode: Security session started.');
        } catch (err) {
            this.setState('error');
            logger.error('Failed to start session', err);
            vscode.window.showErrorMessage('AegisCode: Failed to start session. Is the server running?');
        }
    }

    async stop(): Promise<void> {
        if (this.state !== 'active' || !this.sessionId) {
            vscode.window.showWarningMessage('AegisCode: No active session to stop.');
            return;
        }

        try {
            await apiStopSession(this.sessionId);
            logger.info('Session stopped', this.sessionId);
        } catch (err) {
            logger.warn('Failed to notify server of session stop', err);
        } finally {
            this.sessionId = undefined;
            this.setState('idle');
            vscode.window.showInformationMessage('AegisCode: Session stopped.');
        }
    }
}

export const sessionManager = new SessionManager();
