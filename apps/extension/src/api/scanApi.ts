import { apiRequest } from './apiClient';

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface Vulnerability {
    id: string;
    line: number;
    endLine: number;
    severity: Severity;
    type: string;
    description: string;
    suggestion: string;
    filePath: string;
    title: string;
    category: string;
    confidence: number;
    ruleId: string;
}

export interface ScanRequest {
    sessionId: string;
    filePath: string;
    languageId: string;
    content: string;
}

export interface ScanResponse {
    scanId: string;
    score: number;
    vulnerabilities: Vulnerability[];
}

interface RawServerVulnerability {
    id?: string;
    severity?: string;
    title?: string;
    category?: string;
    description?: string;
    line?: number;
    lineNumber?: number | null;
    endLine?: number;
    suggestion?: string;
    fixSuggestion?: string;
    filePath?: string;
    fileLocation?: string;
}

interface RawServerScanResponse {
    scanId?: string;
    score?: number;
    vulnerabilities?: RawServerVulnerability[];
}

function normaliseSeverity(value: string | undefined): Severity {
    switch ((value || '').toLowerCase()) {
        case 'critical':
            return 'critical';
        case 'high':
            return 'high';
        case 'medium':
            return 'medium';
        case 'info':
            return 'info';
        default:
            return 'low';
    }
}

function confidenceForSeverity(severity: Severity): number {
    switch (severity) {
        case 'critical':
            return 98;
        case 'high':
            return 94;
        case 'medium':
            return 89;
        case 'info':
            return 80;
        default:
            return 84;
    }
}

function ruleIdForFinding(category: string, severity: Severity): string {
    const root = (category || severity || 'SEC')
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-+|-+$/g, '')
        .toUpperCase()
        .slice(0, 8);

    return `${root || 'SEC'}-${severity.toUpperCase().slice(0, 3)}`;
}

function normaliseVulnerability(
    vuln: RawServerVulnerability,
    fallbackFilePath: string,
): Vulnerability {
    const severity = normaliseSeverity(vuln.severity);
    const line = Math.max(1, vuln.lineNumber ?? vuln.line ?? 1);
    const filePath = vuln.fileLocation || vuln.filePath || fallbackFilePath;
    const title = vuln.title || vuln.category || 'Security finding';
    const category = vuln.category || vuln.title || 'Security finding';

    return {
        id: vuln.id || `${filePath}:${line}:${title}`,
        line,
        endLine: Math.max(line, vuln.endLine ?? line),
        severity,
        type: title,
        title,
        category,
        description: vuln.description || 'Potential vulnerability detected.',
        suggestion: vuln.fixSuggestion || vuln.suggestion || 'Review and remediate this code path.',
        filePath,
        confidence: confidenceForSeverity(severity),
        ruleId: ruleIdForFinding(category, severity),
    };
}

function normaliseScanResponse(
    response: RawServerScanResponse,
    request: ScanRequest,
): ScanResponse {
    const vulnerabilities = Array.isArray(response.vulnerabilities)
        ? response.vulnerabilities.map((vuln) =>
              normaliseVulnerability(vuln, request.filePath),
          )
        : [];

    return {
        scanId: response.scanId || `${request.filePath}:${Date.now()}`,
        score: typeof response.score === 'number' ? response.score : 10,
        vulnerabilities,
    };
}

export async function scan(request: ScanRequest): Promise<ScanResponse> {
    const response = await apiRequest<RawServerScanResponse>('POST', '/api/v1/scan', request);
    return normaliseScanResponse(response, request);
}
