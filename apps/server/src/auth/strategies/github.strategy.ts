import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { AuthService } from '../auth.service';

const GITHUB_CONFIGURED =
  !!process.env.GITHUB_CLIENT_ID && !!process.env.GITHUB_CLIENT_SECRET;

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  private readonly logger = new Logger(GithubStrategy.name);

  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.GITHUB_CLIENT_ID || 'GITHUB_NOT_CONFIGURED',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || 'GITHUB_NOT_CONFIGURED',
      callbackURL: `${process.env.BACKEND_BASE_API_URL}/api/v1/auth/github/callback`,
      scope: ['user:email', 'repo', 'read:user'],
    });

    if (!GITHUB_CONFIGURED) {
      this.logger.warn(
        'GitHub OAuth is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in .env to enable it.',
      );
    }
  }

  async validate(accessToken: string, _refreshToken: string, profile: any) {
    if (!GITHUB_CONFIGURED) {
      throw new Error(
        'GitHub OAuth is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in .env.',
      );
    }

    const email = profile.emails?.[0]?.value ?? `${profile.id}@github.noemail`;

    return this.authService.validateGithubUser(
      String(profile.id),
      email,
      accessToken,
    );
  }
}
