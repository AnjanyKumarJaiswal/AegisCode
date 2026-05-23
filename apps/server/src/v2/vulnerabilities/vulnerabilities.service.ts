import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Severity, VulnStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  extractCodeSnippet,
  formatDetectedAt,
  formatTriggerType,
  severityExploitability,
} from './vulnerability-detail.util';

type ListFilters = {
  q?: string;
  severity?: string;
  status?: string;
};

const SEVERITIES = new Set<string>(Object.values(Severity));
const STATUSES = new Set<string>(Object.values(VulnStatus));
const SEVERITY_RANK: Record<Severity, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
  INFO: 4,
};

function normaliseSeverity(value?: string): Severity | undefined {
  if (!value || value.toLowerCase() === 'all') return undefined;
  const normalized = value.toUpperCase();
  if (!SEVERITIES.has(normalized)) {
    throw new BadRequestException(`Unsupported severity: ${value}`);
  }
  return normalized as Severity;
}

function normaliseStatus(value?: string): VulnStatus | undefined {
  if (!value || value.toLowerCase() === 'all') return undefined;
  const normalized = value.toUpperCase();
  if (!STATUSES.has(normalized)) {
    throw new BadRequestException(`Unsupported vulnerability status: ${value}`);
  }
  return normalized as VulnStatus;
}

function fileName(filePath: string): string {
  return filePath.replace(/\\/g, '/').split('/').pop() || filePath;
}

@Injectable()
export class VulnerabilitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, filters: ListFilters) {
    const severity = normaliseSeverity(filters.severity);
    const status = normaliseStatus(filters.status);

    const vulnerabilities = await this.prisma.vulnerability.findMany({
      where: {
        scan: { session: { userId } },
        ...(severity ? { severity } : {}),
        ...(status ? { status } : {}),
        ...(filters.q
          ? {
              OR: [
                { title: { contains: filters.q, mode: 'insensitive' } },
                { category: { contains: filters.q, mode: 'insensitive' } },
                { fileLocation: { contains: filters.q, mode: 'insensitive' } },
                { description: { contains: filters.q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        scan: {
          select: {
            id: true,
            score: true,
            sessionId: true,
            createdAt: true,
          },
        },
      },
    });

    return vulnerabilities
      .sort(
        (a, b) =>
          SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
          b.createdAt.getTime() - a.createdAt.getTime(),
      )
      .map((vulnerability) => ({
        id: vulnerability.id,
        title: vulnerability.title,
        category: vulnerability.category,
        path: vulnerability.fileLocation,
        fileName: fileName(vulnerability.fileLocation),
        severity: vulnerability.severity,
        detected: vulnerability.createdAt.toISOString(),
        status: vulnerability.status,
        scanId: vulnerability.scanId,
        sessionId: vulnerability.scan.sessionId,
        lineNumber: vulnerability.lineNumber,
        score: vulnerability.scan.score,
      }));
  }

  async getById(userId: string, id: string) {
    const vulnerability = await this.prisma.vulnerability.findFirst({
      where: {
        id,
        scan: { session: { userId } },
      },
      include: {
        scan: {
          include: {
            session: {
              select: {
                id: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
      },
    });

    if (!vulnerability) {
      throw new NotFoundException('Vulnerability not found');
    }

    const scan = vulnerability.scan;
    const codeSnippet = extractCodeSnippet(
      scan.sourceContent,
      vulnerability.fileLocation,
      scan.languageId,
      vulnerability.lineNumber,
      vulnerability.description,
    );

    return {
      id: vulnerability.id,
      title: vulnerability.title,
      category: vulnerability.category,
      severity: vulnerability.severity,
      description: vulnerability.description,
      fixSuggestion: vulnerability.fixSuggestion,
      path: vulnerability.fileLocation,
      fileLocation: vulnerability.fileLocation,
      fileName: fileName(vulnerability.fileLocation),
      lineNumber: vulnerability.lineNumber,
      status: vulnerability.status,
      detected: vulnerability.createdAt.toISOString(),
      detectedLabel: formatDetectedAt(vulnerability.createdAt.toISOString()),
      scanId: vulnerability.scanId,
      sessionId: scan.sessionId,
      score: scan.score,
      triggerType: scan.triggerType,
      triggerLabel: formatTriggerType(scan.triggerType),
      scanCreatedAt: scan.createdAt.toISOString(),
      scanCreatedLabel: formatDetectedAt(scan.createdAt.toISOString()),
      languageId: scan.languageId,
      exploitability: severityExploitability(vulnerability.severity),
      sessionCreatedAt: scan.session.createdAt.toISOString(),
      codeSnippet,
    };
  }

  async updateStatus(userId: string, id: string, rawStatus?: string) {
    const status = normaliseStatus(rawStatus);
    if (!status) {
      throw new BadRequestException('status must be OPEN or FIXED');
    }

    await this.getById(userId, id);

    const vulnerability = await this.prisma.vulnerability.update({
      where: { id },
      data: { status },
    });

    return {
      id: vulnerability.id,
      status: vulnerability.status,
    };
  }
}
