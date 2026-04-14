import type { ToolDefinition } from '@aegiscode/shared';

export type FindingSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export type ScanTriggerType = 'AUTO_INACTIVITY' | 'MANUAL';

export interface VulnerabilityFinding {
  category: string;
  title: string;
  severity: FindingSeverity;
  lineNumber: number | null;
  description: string;
  fixSuggestion: string;
}

export interface ScanContext {
  sessionId: string;
  userId: string;
  filePath: string;
  language: string;
  code: string;
  triggerType: ScanTriggerType;
  findings: VulnerabilityFinding[];
}

export interface McpTool {
  definition: ToolDefinition;
  handler: (
    args: Record<string, unknown>,
    ctx: ScanContext,
  ) => Promise<unknown>;
}
