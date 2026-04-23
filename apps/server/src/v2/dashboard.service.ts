import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(userId: string) {
    const [
      totalScans,
      avgScoreResult,
      activeThreats,
      vulnBySeverity,
    ] = await Promise.all([
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

    const healthScore = avgScoreResult._avg.score ?? 0;

    return {
      healthScore: Math.round(healthScore),
      totalScans,
      vulnBlocked: activeThreats,
      activeThreats: vulnBySeverity.map((v: { severity: string; _count: number }) => ({
        severity: v.severity,
        count: v._count,
      })),
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

    return recentScans.map((scan: { id: string; createdAt: Date; vulnerabilities: Array<{ category?: string; severity: string }> }) => {
      const latestVuln = scan.vulnerabilities[0];
      return {
        id: scan.id,
        timestamp: scan.createdAt.toISOString(),
        targetAsset: `scan-${scan.id.slice(0, 8)}`,
        protocol: latestVuln?.category ?? 'general',
        status: latestVuln ? latestVuln.severity.toLowerCase() : 'clean',
        score: 0,
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