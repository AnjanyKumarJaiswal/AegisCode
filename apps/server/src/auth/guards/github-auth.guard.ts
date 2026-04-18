import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GithubAuthGuard extends AuthGuard('github') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const source = typeof request.query?.source === 'string' ? request.query.source : undefined;
    const redirectUri = typeof request.query?.redirect_uri === 'string' ? request.query.redirect_uri : undefined;

    const callbackBase = `${process.env.BACKEND_BASE_API_URL}/api/v1/auth/github/callback`;
    const params = new URLSearchParams();
    
    if (source) {
      params.append('source', source);
    }
    if (redirectUri) {
      params.append('redirect_uri', redirectUri);
    }

    if (params.toString()) {
      return {
        callbackURL: `${callbackBase}?${params.toString()}`,
      };
    }

    return undefined;
  }
}
