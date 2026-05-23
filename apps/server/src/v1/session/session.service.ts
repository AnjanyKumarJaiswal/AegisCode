import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserService } from '../../auth/user.service';
import { SessionStatus } from '@prisma/client';

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  async startSession(userId: string, ideClient?: string) {
    const trimmedIde =
      typeof ideClient === 'string' ? ideClient.trim() : undefined;

    const session = await this.prisma.codingSession.create({
      data: {
        userId,
        ...(trimmedIde ? { ideClient: trimmedIde } : {}),
      },
      select: {
        id: true,
        status: true,
        currentScore: true,
        ideClient: true,
        createdAt: true,
      },
    });

    if (trimmedIde) {
      await this.userService.recordIdeClient(userId, trimmedIde);
    }

    return session;
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
