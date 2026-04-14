import { apiRequest } from './apiClient';

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface Vulnerability {
    id: string;
    line: number;
    endLine: number;
    severity: Severity;
    type: string;
    description: string;
    suggestion: string;
}

export interface ScanRequest {
    sessionId: string;
    filePath: string;
    languageId: string;
    content: string;
}

export interface ScanResponse {
    scanId: string;
    vulnerabilities: Vulnerability[];
}

export async function scan(request: ScanRequest): Promise<ScanResponse> {
    return apiRequest<ScanResponse>('POST', '/api/v1/scan', request);
}
