import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SessionStatus } from '@prisma/client';

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async startSession(userId: string) {
    return this.prisma.codingSession.create({
      data: { userId },
      select: {
        id: true,
        status: true,
        currentScore: true,
        createdAt: true,
      },
    });
  }

  async endSession(sessionId: string, userId: string) {
    const session = await this.prisma.codingSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Session not found`);
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('You do not have access to this session');
    }

    if (session.status === SessionStatus.COMPLETED) {
      throw new BadRequestException('Session is already completed');
    }

    return this.prisma.codingSession.update({
      where: { id: sessionId },
      data: { status: SessionStatus.COMPLETED },
      select: {
        id: true,
        status: true,
        currentScore: true,
        updatedAt: true,
      },
    });
  }

  async getSession(sessionId: string, userId: string) {
    const session = await this.prisma.codingSession.findUnique({
      where: { id: sessionId },
      include: {
        scans: {
          orderBy: { createdAt: 'desc' },
          include: {
            vulnerabilities: {
              orderBy: { severity: 'asc' },
            },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`Session not found`);
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('You do not have access to this session');
    }

    return session;
  }

  async updateScore(sessionId: string, score: number) {
    return this.prisma.codingSession.update({
      where: { id: sessionId },
      data: { currentScore: score },
    });
  }

  async validateSessionAccess(sessionId: string, userId: string) {
    const session = await this.prisma.codingSession.findUnique({
      where: { id: sessionId },
      select: { id: true, userId: true, status: true },
    });

    if (!session) {
      throw new NotFoundException(`Session not found`);
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('You do not have access to this session');
    }

    if (session.status === SessionStatus.COMPLETED) {
      throw new BadRequestException(
        'Cannot scan a completed session. Start a new session first.',
      );
    }

    return session;
  }
}
