import { Injectable } from '@nestjs/common';
import { VulnStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type Timeframe = '1d' | '7d' | '30d';

function normaliseTimeframe(value?: string): Timeframe {
  if (value === '1d' || value === '30d') return value;
  return '7d';
}

function startForTimeframe(timeframe: Timeframe): Date {
  const days = timeframe === '1d' ? 1 : timeframe === '30d' ? 30 : 7;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function bucketCount(timeframe: Timeframe): number {
  if (timeframe === '1d') return 8;
  if (timeframe === '30d') return 10;
  return 7;
}

function bucketLabel(timeframe: Timeframe, index: number): string {
  if (timeframe === '1d') return `${index * 3}h`;
  return `S${index + 1}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

@Injectable()
export class ThreatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRiskData(userId: string, rawTimeframe?: string) {
    const timeframe = normaliseTimeframe(rawTimeframe);
    const start = startForTimeframe(timeframe);
    const scans = await this.prisma.scanReport.findMany({
      where: {
        session: { userId },
        createdAt: { gte: start },
      },
      orderBy: { createdAt: 'asc' },
      select: {
        score: true,
        createdAt: true,
      },
    });

    const count = bucketCount(timeframe);
    const buckets = Array.from({ length: count }, () => ({ total: 0, count: 0 }));
    const spanMs = Math.max(1, Date.now() - start.getTime());
    const bucketMs = spanMs / count;

    for (const scan of scans) {
      const index = clamp(
        Math.floor((scan.createdAt.getTime() - start.getTime()) / bucketMs),
        0,
        count - 1,
      );
      buckets[index].total += scan.score;
      buckets[index].count += 1;
    }

    return buckets.map((bucket, index) => ({
      label: bucketLabel(timeframe, index),
      value:
        bucket.count > 0
          ? Math.round((bucket.total / bucket.count) * 10) / 10
          : 0,
    }));
  }

  async getStats(userId: string) {
    const weekStart = startForTimeframe('7d');
    const [totalScans, avgScore, resolved] = await Promise.all([
      this.prisma.scanReport.count({ where: { session: { userId } } }),
      this.prisma.scanReport.aggregate({
        where: {
          session: { userId },
          createdAt: { gte: weekStart },
        },
        _avg: { score: true },
      }),
      this.prisma.vulnerability.count({
        where: {
          scan: { session: { userId } },
          status: VulnStatus.FIXED,
        },
      }),
    ]);

    return {
      totalScans,
      avgRisk: Math.round((avgScore._avg.score ?? 0) * 10) / 10,
      resolved,
    };
  }
}
