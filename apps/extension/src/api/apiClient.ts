import * as vscode from 'vscode';
import { getToken } from '../auth/authManager';
import { logger } from '../utils/logger';

export class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = 'ApiError';
    }
}

function getBaseUrl(): string {
    const config = vscode.workspace.getConfiguration('aegiscode');
    return config.get<string>('serverUrl', process.env.BACKEND_BASE_API_URL ?? 'http://localhost:4000');
}

export async function apiRequest<T>(
    method: 'GET' | 'POST' | 'DELETE',
    path: string,
    body?: unknown
): Promise<T> {
    const token = await getToken();
    const url = `${getBaseUrl()}${path}`;
    const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (!response.ok) {
        const text = await response.text().catch(() => response.statusText);
        logger.error(`API ${method} ${path} failed`, response.status, text);
        throw new ApiError(response.status, text);
    }

    return response.json() as Promise<T>;
}
