import type {
  AuthResponse,
  ApiKeyLoginPayload,
  LoginPayload,
  RegisterPayload,
  SanitizedUser,
} from '../types/auth';
import { AUTH_ROUTES, AuthErrorCode } from '../types/auth';


export class AuthApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'AuthApiError';
  }

  get code(): AuthErrorCode {
    switch (this.status) {
      case 401:
        return AuthErrorCode.UNAUTHORIZED;
      case 403:
        return AuthErrorCode.FORBIDDEN;
      case 409:
        return AuthErrorCode.CONFLICT;
      default:
        return AuthErrorCode.UNAUTHORIZED;
    }
  }
}

export class AuthApiClient {
  constructor(private readonly baseUrl: string) {}
  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: unknown,
    token?: string,
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => response.statusText);
      throw new AuthApiError(response.status, text);
    }

    return response.json() as Promise<T>;
  }

  
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    return this.request<AuthResponse>('POST', AUTH_ROUTES.REGISTER, payload);
  }

  async login(payload: LoginPayload): Promise<AuthResponse> {
    return this.request<AuthResponse>('POST', AUTH_ROUTES.LOGIN, payload);
  }

  async loginWithApiKey(payload: ApiKeyLoginPayload): Promise<AuthResponse> {
    return this.request<AuthResponse>('POST', AUTH_ROUTES.API_KEY, payload);
  }

  async me(token: string): Promise<SanitizedUser> {
    return this.request<SanitizedUser>('GET', AUTH_ROUTES.ME, undefined, token);
  }

  githubOAuthUrl(redirectUri?: string): string {
    const base = `${this.baseUrl}${AUTH_ROUTES.GITHUB}`;
    return redirectUri ? `${base}?redirect_uri=${encodeURIComponent(redirectUri)}` : base;
  }
}
