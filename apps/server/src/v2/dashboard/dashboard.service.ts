import { Injectable } from '@nestjs/common';
import { Severity } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const SEVERITY_ORDER: Severity[] = [
  Severity.CRITICAL,
  Severity.HIGH,
  Severity.MEDIUM,
  Severity.LOW,
  Severity.INFO,
];

function severityRank(severity: Severity): number {
  return SEVERITY_ORDER.indexOf(severity);
}

function fileName(filePath: string | null | undefined): string {
  if (!filePath) return 'unknown';
  return filePath.replace(/\\/g, '/').split('/').pop() || filePath;
}

function scoreToHealth(score: number | null | undefined): number {
  return Math.round(Math.min(100, Math.max(0, (score ?? 0) * 10)));
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(userId: string) {
    const [totalScans, avgScoreResult, activeThreats, vulnBySeverity] =
      await Promise.all([
        this.prisma.scanReport.count({
          where: { session: { userId } },
        }),
        this.prisma.scanReport.aggregate({
          where: { session: { userId } },
          _avg: { score: true },
        }),
        this.prisma.vulnerability.count({
          where: {
            scan: { session: { userId } },
            status: 'OPEN',
            severity: { in: ['CRITICAL', 'HIGH'] },
          },
        }),
        this.prisma.vulnerability.groupBy({
          by: ['severity'],
          where: {
            scan: { session: { userId } },
            status: 'OPEN',
          },
          _count: true,
        }),
      ]);

    return {
      healthScore: scoreToHealth(avgScoreResult._avg.score),
      totalScans,
      vulnBlocked: activeThreats,
      activeThreats: vulnBySeverity
        .map((v: { severity: Severity; _count: number }) => ({
          severity: v.severity,
          count: v._count,
        }))
        .sort((a, b) => severityRank(a.severity) - severityRank(b.severity)),
    };
  }

  async getThreatFeed(userId: string) {
    const recentScans = await this.prisma.scanReport.findMany({
      where: { session: { userId } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        vulnerabilities: {
          orderBy: { severity: 'asc' },
          take: 3,
        },
      },
    });

    return recentScans.map((scan) => {
      const latestVuln = scan.vulnerabilities[0];
      return {
        id: scan.id,
        timestamp: scan.createdAt.toISOString(),
        targetAsset: latestVuln?.fileLocation
          ? fileName(latestVuln.fileLocation)
          : `scan-${scan.id.slice(0, 8)}`,
        protocol: latestVuln?.category ?? 'general',
        status: latestVuln ? latestVuln.severity.toLowerCase() : 'clean',
        score: scan.score,
      };
    });
  }

  async getSessions(userId: string) {
    return this.prisma.codingSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        scans: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { vulnerabilities: true },
        },
      },
    });
  }
}
