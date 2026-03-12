import * as vscode from 'vscode';
import { sessionManager, SessionState } from '../session/sessionManager';

class StatusBar {
    private item: vscode.StatusBarItem;

    constructor() {
        this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.item.command = 'aegiscode.scanNow';
        this.renderIdle();
        this.item.show();
    }

    private renderIdle(): void {
        this.item.text = '$(shield) AegisCode';
        this.item.tooltip = 'AegisCode — Click to scan now';
        this.item.backgroundColor = undefined;
        this.item.color = undefined;
    }

    private renderActive(issueCount?: number): void {
        if (issueCount === undefined) {
            this.item.text = '$(shield) LIVE';
            this.item.tooltip = 'AegisCode — Session active, monitoring...';
            this.item.color = new vscode.ThemeColor('statusBarItem.warningForeground');
            this.item.backgroundColor = undefined;
        } else if (issueCount === 0) {
            this.item.text = '$(shield-check) Clean';
            this.item.tooltip = 'AegisCode — No issues detected';
            this.item.color = undefined;
            this.item.backgroundColor = undefined;
        } else {
            this.item.text = `$(warning) ${issueCount} issue${issueCount !== 1 ? 's' : ''}`;
            this.item.tooltip = `AegisCode — ${issueCount} vulnerability${issueCount !== 1 ? 'ies' : 'y'} detected`;
            this.item.color = new vscode.ThemeColor('statusBarItem.errorForeground');
            this.item.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        }
    }

    private renderError(): void {
        this.item.text = '$(warning) AegisCode';
        this.item.tooltip = 'AegisCode — Error connecting to server';
        this.item.color = new vscode.ThemeColor('statusBarItem.errorForeground');
        this.item.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
    }

    syncWithState(state: SessionState): void {
        if (state === 'idle') {
            this.renderIdle();
        } else if (state === 'active') {
            this.renderActive();
        } else {
            this.renderError();
        }
    }

    updateIssueCount(count: number): void {
        if (sessionManager.isActive()) {
            this.renderActive(count);
        }
    }

    dispose(): void {
        this.item.dispose();
    }
}

export const statusBar = new StatusBar();
