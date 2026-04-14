import { Severity, ScanTrigger } from '@prisma/client';
import type { PrismaService } from '../../../prisma/prisma.service';
import type {
  ScanContext,
  VulnerabilityFinding,
  FindingSeverity,
} from '../types';

const SEVERITY_MAP: Record<FindingSeverity, Severity> = {
  CRITICAL: Severity.CRITICAL,
  HIGH: Severity.HIGH,
  MEDIUM: Severity.MEDIUM,
  LOW: Severity.LOW,
  INFO: Severity.INFO,
};

const TRIGGER_MAP: Record<ScanContext['triggerType'], ScanTrigger> = {
  AUTO_INACTIVITY: ScanTrigger.AUTO_INACTIVITY,
  MANUAL: ScanTrigger.MANUAL,
};

export interface SavedScanReport {
  scanId: string;
  sessionId: string;
  score: number;
  triggerType: ScanTrigger;
  totalFindings: number;
  vulnerabilities: SavedVulnerability[];
  createdAt: Date;
}

export interface SavedVulnerability {
  id: string;
  category: string;
  severity: Severity;
  title: string;
  description: string;
  fileLocation: string;
  lineNumber: number | null;
  fixSuggestion: string;
}

export async function saveReport(
  prisma: PrismaService,
  ctx: ScanContext,
  findings: VulnerabilityFinding[],
  score: number,
): Promise<SavedScanReport> {
  return prisma.$transaction(async (tx) => {
    const report = await tx.scanReport.create({
      data: {
        sessionId: ctx.sessionId,
        triggerType: TRIGGER_MAP[ctx.triggerType],
        score,
        vulnerabilities: {
          create: findings.map((f) => ({
            category: f.category,
            severity: SEVERITY_MAP[f.severity],
            title: f.title,
            description: f.description,
            fileLocation: ctx.filePath,
            lineNumber: f.lineNumber,
            fixSuggestion: f.fixSuggestion,
          })),
        },
      },
      include: {
        vulnerabilities: {
          orderBy: { severity: 'asc' },
        },
      },
    });

    await tx.codingSession.update({
      where: { id: ctx.sessionId },
      data: { currentScore: score },
    });

    return {
      scanId: report.id,
      sessionId: report.sessionId,
      score: report.score,
      triggerType: report.triggerType,
      totalFindings: report.vulnerabilities.length,
      vulnerabilities: report.vulnerabilities.map((v) => ({
        id: v.id,
        category: v.category,
        severity: v.severity,
        title: v.title,
        description: v.description,
        fileLocation: v.fileLocation,
        lineNumber: v.lineNumber,
        fixSuggestion: v.fixSuggestion,
      })),
      createdAt: report.createdAt,
    };
  });
}
