import * as vscode from 'vscode';
const channel = vscode.window.createOutputChannel('AegisCode');

function timestamp(): string {
    return new Date().toLocaleTimeString('en-US', { hour12: false });
}

export const logger = {
    info(message: string, ...args: unknown[]): void {
        channel.appendLine(`[${timestamp()}] [INFO]  ${message} ${args.length ? JSON.stringify(args) : ''}`.trimEnd());
    },
    warn(message: string, ...args: unknown[]): void {
        channel.appendLine(`[${timestamp()}] [WARN]  ${message} ${args.length ? JSON.stringify(args) : ''}`.trimEnd());
    },
    error(message: string, ...args: unknown[]): void {
        channel.appendLine(`[${timestamp()}] [ERROR] ${message} ${args.length ? JSON.stringify(args) : ''}`.trimEnd());
    },
    show(): void {
        channel.show(true);
    },
    dispose(): void {
        channel.dispose();
    },
};
