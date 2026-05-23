import { Injectable } from '@nestjs/common';
import { Severity } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

function fileName(filePath: string | null | undefined): string {
  if (!filePath) return 'Clean scan';
  return filePath.replace(/\\/g, '/').split('/').pop() || filePath;
}

function scanStatus(score: number, highestSeverity?: Severity): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'CLEAN' {
  if (highestSeverity) return highestSeverity === 'INFO' ? 'LOW' : highestSeverity;
  return score >= 9 ? 'CLEAN' : 'LOW';
}

function uiSeverity(status: string): 'critical' | 'high' | 'clean' {
  if (status === 'CRITICAL') return 'critical';
  if (status === 'HIGH') return 'high';
  return 'clean';
}

@Injectable()
export class LogsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const scans = await this.prisma.scanReport.findMany({
      where: { session: { userId } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        vulnerabilities: {
          orderBy: { severity: 'asc' },
          take: 1,
        },
      },
    });

    return scans.map((scan) => {
      const topFinding = scan.vulnerabilities[0];
      const status = scanStatus(scan.score, topFinding?.severity);

      return {
        id: scan.id,
        file: fileName(topFinding?.fileLocation),
        path: topFinding?.fileLocation ?? `session/${scan.sessionId}`,
        scanId: scan.id.slice(0, 8),
        engine: 'Gemini MCP',
        duration: 'n/a',
        status,
        severity: uiSeverity(status),
        createdAt: scan.createdAt.toISOString(),
        score: scan.score,
        findings: scan.vulnerabilities.length,
        triggerType: scan.triggerType,
      };
    });
  }
}
