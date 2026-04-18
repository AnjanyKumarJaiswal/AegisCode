import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { User } from '@prisma/client';
import { encrypt, decrypt } from './crypto.util';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  private decryptUserTokens(user: User | null): User | null {
    if (!user) return null;
    if (user.githubToken) {
      try {
        user.githubToken = decrypt(user.githubToken);
      } catch (e) {
        
      }
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return this.decryptUserTokens(user);
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return this.decryptUserTokens(user);
  }

  async findByGithubId(githubId: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { githubId } });
    return this.decryptUserTokens(user);
  }

  async createLocalUser(email: string, passwordHash: string): Promise<User> {
    const user = await this.prisma.user.create({
      data: { email, passwordHash },
    });
    return this.decryptUserTokens(user) as User;
  }

  async createOrUpdateGithubUser(
    githubId: string,
    email: string,
    username: string | null,
    githubToken: string,
  ): Promise<User> {
    const encryptedToken = encrypt(githubToken);
    const createData: any = { email, githubId, githubToken: encryptedToken };
    if (username) {
      createData.username = username;
    }
    const user = await this.prisma.user.upsert({
      where: { githubId },
      update: { githubToken: encryptedToken, ...(username ? { username } : {}) },
      create: createData,
    });
    return this.decryptUserTokens(user) as User;
  }
}
