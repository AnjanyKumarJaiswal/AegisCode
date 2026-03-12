import { apiRequest } from './apiClient';

export interface SessionStartResponse {
    sessionId: string;
    startedAt: string;
}

export interface SessionStopResponse {
    sessionId: string;
    stoppedAt: string;
}

export async function startSession(): Promise<SessionStartResponse> {
    return apiRequest<SessionStartResponse>('POST', '/v1/session/start');
}

export async function stopSession(sessionId: string): Promise<SessionStopResponse> {
    return apiRequest<SessionStopResponse>('POST', '/v1/session/stop', { sessionId });
}
