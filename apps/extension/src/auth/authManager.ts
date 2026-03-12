import * as vscode from 'vscode';
import { getToken, setToken, deleteToken } from './tokenStore';
import { logger } from '../utils/logger';

export async function login(): Promise<boolean> {
    const token = await vscode.window.showInputBox({
        title: 'AegisCode — Sign In',
        prompt: 'Paste your AegisCode API token',
        password: true,
        ignoreFocusOut: true,
        validateInput: (value) => value.trim().length === 0 ? 'Token cannot be empty' : null,
    });

    if (!token) {
        logger.warn('Login cancelled by user');
        return false;
    }

    await setToken(token.trim());
    logger.info('Auth token saved');
    vscode.window.showInformationMessage('AegisCode: Signed in successfully.');
    return true;
}

export async function logout(): Promise<void> {
    await deleteToken();
    logger.info('Auth token cleared');
    vscode.window.showInformationMessage('AegisCode: Signed out.');
}

export async function isAuthenticated(): Promise<boolean> {
    const token = await getToken();
    return token !== undefined && token.length > 0;
}

export { getToken };
