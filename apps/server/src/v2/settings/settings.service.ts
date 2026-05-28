import * as crypto from 'crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type SettingsPayload = {
  criticalAlerts?: unknown;
  weeklySummary?: unknown;
};

type ProfilePayload = {
  name?: unknown;
  email?: unknown;
  role?: unknown;
  bio?: unknown;
  region?: unknown;
};

function asObject<T extends object>(body: unknown): T {
  if (!body || typeof body !== 'object') {
    throw new BadRequestException('Request body must be an object');
  }
  return body as T;
}

function optionalString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') {
    throw new BadRequestException(`${field} must be a string`);
  }
  return value.trim();
}

function optionalBoolean(value: unknown, field: string): boolean | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'boolean') {
    throw new BadRequestException(`${field} must be a boolean`);
  }
  return value;
}

function displayName(user: { email: string; username: string | null }): string {
  return user.username ?? user.email.split('@')[0] ?? 'Operator';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

type V2Prisma = PrismaService & {
  userSettings: any;
  userProfile: any;
};

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  private get db(): V2Prisma {
    return this.prisma as V2Prisma;
  }

  private async ensureSettings(userId: string) {
    const existing = await this.db.userSettings.findUnique({
      where: { userId },
    });

    if (existing) return existing;

    return this.db.userSettings.create({
      data: { userId },
    });
  }

  async getSettings(userId: string) {
    const [settings, lastSession] = await Promise.all([
      this.ensureSettings(userId),
      this.prisma.codingSession.findFirst({
        where: { userId, ideClient: { not: null } },
        orderBy: { updatedAt: 'desc' },
        select: { ideClient: true, updatedAt: true },
      }),
    ]);

    const ideClient =
      lastSession?.ideClient ?? settings.lastIdeClient ?? null;
    const lastIdeSyncAt =
      lastSession?.updatedAt?.toISOString() ??
      settings.lastIdeSyncAt?.toISOString() ??
      null;

    return {
      criticalAlerts: settings.criticalAlerts,
      weeklySummary: settings.weeklySummary,
      updatedAt: settings.updatedAt.toISOString(),
      integration: {
        ideClient,
        lastSyncAt: lastIdeSyncAt,
        connected: Boolean(ideClient),
      },
    };
  }

  async updateSettings(userId: string, rawBody: unknown) {
    const body = asObject<SettingsPayload>(rawBody);
    const criticalAlerts = optionalBoolean(
      body.criticalAlerts,
      'criticalAlerts',
    );
    const weeklySummary = optionalBoolean(body.weeklySummary, 'weeklySummary');

    await this.ensureSettings(userId);

    const settings = await this.db.userSettings.update({
      where: { userId },
      data: {
        ...(criticalAlerts !== undefined ? { criticalAlerts } : {}),
        ...(weeklySummary !== undefined ? { weeklySummary } : {}),
      },
    });

    return {
      criticalAlerts: settings.criticalAlerts,
      weeklySummary: settings.weeklySummary,
      updatedAt: settings.updatedAt.toISOString(),
    };
  }

  async getUserProfile(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [user, profile, todayScans, totalScans] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          credits: true,
          createdAt: true,
        },
      }),
      this.db.userProfile.findUnique({ where: { userId } }),
      this.prisma.scanReport.count({
        where: {
          session: { userId },
          createdAt: { gte: today },
        },
      }),
      this.prisma.scanReport.count({ where: { session: { userId } } }),
    ]);

    if (!user) throw new NotFoundException('User not found');

    return {
      id: user.id,
      name: profile?.name ?? displayName(user),
      username: user.username ?? displayName(user),
      email: user.email,
      tier: user.credits > 100 ? 'enterprise' : 'standard',
      todayScans,
      usage: clamp(totalScans * 5, 0, 100),
      region: profile?.region ?? 'local',
      role: profile?.role ?? 'Security Operator',
      bio: profile?.bio ?? 'Securing AI-generated code with AegisCode.',
      joinedAt: user.createdAt.toISOString(),
    };
  }

  async updateUserProfile(userId: string, rawBody: unknown) {
    const body = asObject<ProfilePayload>(rawBody);
    const name = optionalString(body.name, 'name');
    const email = optionalString(body.email, 'email');
    const role = optionalString(body.role, 'role');
    const bio = optionalString(body.bio, 'bio');
    const region = optionalString(body.region, 'region');

    if (email !== undefined && !email.includes('@')) {
      throw new BadRequestException('email must be valid');
    }

    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(email !== undefined ? { email } : {}),
          ...(name !== undefined ? { username: name } : {}),
        },
        select: {
          id: true,
          email: true,
          username: true,
          credits: true,
          createdAt: true,
        },
      });

      const profile = await this.db.userProfile.upsert({
        where: { userId },
        update: {
          ...(name !== undefined ? { name } : {}),
          ...(role !== undefined ? { role } : {}),
          ...(bio !== undefined ? { bio } : {}),
          ...(region !== undefined ? { region } : {}),
        },
        create: {
          userId,
          name: name ?? displayName(user),
          role: role ?? 'Security Operator',
          bio: bio ?? 'Securing AI-generated code with AegisCode.',
          region: region ?? 'local',
        },
      });

      return {
        id: user.id,
        name: profile.name ?? displayName(user),
        username: user.username ?? displayName(user),
        email: user.email,
        tier: user.credits > 100 ? 'enterprise' : 'standard',
        todayScans: 0,
        usage: 0,
        region: profile.region,
        role: profile.role ?? 'Security Operator',
        bio: profile.bio ?? 'Securing AI-generated code with AegisCode.',
        joinedAt: user.createdAt.toISOString(),
      };
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('Email is already in use');
      }
      throw error;
    }
  }
}
