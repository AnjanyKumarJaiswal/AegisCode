import { apiRequest } from './apiClient';
import { getIdeClientName } from '../utils/ideClient';

export interface SessionStartResponse {
    id: string;
    status: string;
    createdAt: string;
}

export interface SessionStopResponse {
    id: string;
    status: string;
    updatedAt: string;
}

export async function startSession(): Promise<SessionStartResponse> {
    return apiRequest<SessionStartResponse>('POST', '/api/v1/sessions', {
        ideClient: getIdeClientName(),
    });
}

export async function stopSession(id: string): Promise<SessionStopResponse> {
    return apiRequest<SessionStopResponse>('PATCH', `/api/v1/sessions/${id}/complete`);
}
