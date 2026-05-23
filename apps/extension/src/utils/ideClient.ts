import * as vscode from 'vscode';
import { getToken } from '../auth/tokenStore';
import { logger } from './logger';

export function getIdeClientName(): string {
  const appName = vscode.env.appName?.trim();
  if (appName) {
    return appName;
  }

  const scheme = vscode.env.uriScheme?.trim();
  if (scheme) {
    return scheme.charAt(0).toUpperCase() + scheme.slice(1);
  }

  return 'IDE';
}

function getBaseUrl(): string {
  const config = vscode.workspace.getConfiguration('aegiscode');
  return config.get<string>('serverUrl', process.env.BACKEND_BASE_API_URL ?? 'http://localhost:4000');
}

export async function syncIdeClient(): Promise<void> {
  const token = await getToken();
  if (!token) return;

  try {
    const response = await fetch(`${getBaseUrl()}/api/v1/auth/ide-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ideClient: getIdeClientName() }),
    });

    if (!response.ok) {
      logger.warn('Failed to sync IDE client with server', await response.text());
    }
  } catch (err) {
    logger.warn('Failed to sync IDE client with server', err);
  }
}
