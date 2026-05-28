import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  generateApiKey,
  hashApiKey,
  isApiKeyFormat,
  timingSafeEqual,
} from './api-key.util';

export type ApiKeyListItem = {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
};

export type CreatedApiKey = ApiKeyListItem & {
  key: string;
};

@Injectable()
export class ApiKeyService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string): Promise<ApiKeyListItem[]> {
    const keys = await this.prisma.apiKey.findMany({
      where: { userId, revokedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    return keys.map((key) => ({
      id: key.id,
      name: key.name,
      keyPrefix: `${key.keyPrefix}…`,
      createdAt: key.createdAt.toISOString(),
      lastUsedAt: key.lastUsedAt?.toISOString() ?? null,
    }));
  }

  async createForUser(userId: string, name?: string): Promise<CreatedApiKey> {
    const trimmedName = name?.trim() || 'API Key';
    const { rawKey, keyPrefix, keyHash } = generateApiKey();

    const key = await this.prisma.apiKey.create({
      data: {
        userId,
        name: trimmedName,
        keyPrefix,
        keyHash,
      },
    });

    return {
      id: key.id,
      name: key.name,
      keyPrefix: `${key.keyPrefix}…`,
      key: rawKey,
      createdAt: key.createdAt.toISOString(),
      lastUsedAt: null,
    };
  }

  async revokeForUser(userId: string, keyId: string): Promise<void> {
    const key = await this.prisma.apiKey.findFirst({
      where: { id: keyId, userId, revokedAt: null },
    });

    if (!key) {
      throw new NotFoundException('API key not found');
    }

    await this.prisma.apiKey.update({
      where: { id: keyId },
      data: { revokedAt: new Date() },
    });
  }

  async authenticate(rawKey: string): Promise<User> {
    const trimmed = rawKey.trim();
    if (!isApiKeyFormat(trimmed)) {
      throw new UnauthorizedException('Invalid API key');
    }

    const keyPrefix = trimmed.slice(0, 16);
    const keyHash = hashApiKey(trimmed);

    const candidates = await this.prisma.apiKey.findMany({
      where: { keyPrefix, revokedAt: null },
      include: { user: true },
    });

    const match = candidates.find((candidate) =>
      timingSafeEqual(candidate.keyHash, keyHash),
    );

    if (!match) {
      throw new UnauthorizedException('Invalid API key');
    }

    await this.prisma.apiKey.update({
      where: { id: match.id },
      data: { lastUsedAt: new Date() },
    });

    return match.user;
  }
}
