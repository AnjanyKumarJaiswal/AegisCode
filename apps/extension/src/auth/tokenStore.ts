import * as vscode from 'vscode';

const TOKEN_KEY = 'aegiscode.authToken';
const USERNAME_KEY = 'aegiscode.username';

let secrets: vscode.SecretStorage;

export function initTokenStore(context: vscode.ExtensionContext): void {
    secrets = context.secrets;
}

export async function getToken(): Promise<string | undefined> {
    return secrets.get(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
    await secrets.store(TOKEN_KEY, token);
}

export async function deleteToken(): Promise<void> {
    await secrets.delete(TOKEN_KEY);
    await secrets.delete(USERNAME_KEY);
}

export async function getUsername(): Promise<string | undefined> {
    return secrets.get(USERNAME_KEY);
}

export async function setUsername(username: string): Promise<void> {
    await secrets.store(USERNAME_KEY, username);
}
