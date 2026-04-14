import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByGithubId(githubId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { githubId } });
  }

  async createLocalUser(email: string, passwordHash: string): Promise<User> {
    return this.prisma.user.create({
      data: { email, passwordHash },
    });
  }

  async createOrUpdateGithubUser(
    githubId: string,
    email: string,
    githubToken: string,
  ): Promise<User> {
    return this.prisma.user.upsert({
      where: { githubId },
      update: { githubToken },
      create: { email, githubId, githubToken },
    });
  }
}
