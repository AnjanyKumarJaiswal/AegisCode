import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from './user.service';
import type { User } from '@prisma/client';
import {
  JwtPayload,
  type AuthResponse,
  type SanitizedUser,
} from '@aegiscode/shared';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  private signToken(user: User): string {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    return this.jwtService.sign(payload);
  }

  private sanitizeUser(user: User): SanitizedUser {
    const { passwordHash, githubToken, ...safe } = user;
    return safe as SanitizedUser;
  }

  async register(email: string, password: string): Promise<AuthResponse> {
    const existing = await this.userService.findByEmail(email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await this.userService.createLocalUser(email, passwordHash);
    const token = this.signToken(user);

    return { user: this.sanitizeUser(user), token };
  }

  async validateLocalUser(
    email: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.userService.findByEmail(email);
    if (!user || !user.passwordHash) return null;

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    return isMatch ? user : null;
  }

  async login(user: User): Promise<AuthResponse> {
    const token = this.signToken(user);
    return { user: this.sanitizeUser(user), token };
  }

  async validateGithubUser(
    githubId: string,
    email: string,
    accessToken: string,
  ) {
    return this.userService.createOrUpdateGithubUser(
      githubId,
      email,
      accessToken,
    );
  }

  async loginWithGithub(user: User) {
    const token = this.signToken(user);
    return { user: this.sanitizeUser(user), token };
  }

  async me(userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) throw new UnauthorizedException();
    return this.sanitizeUser(user);
  }
}
