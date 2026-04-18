export interface JwtPayload {
  sub: string;
  email: string;
}

export interface SanitizedUser {
  id: string;
  email: string;
  username: string | null;
  githubId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  user: SanitizedUser;
  token: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const AUTH_ROUTES = {
  REGISTER: "/api/v1/auth/register",
  LOGIN: "/api/v1/auth/login",
  GITHUB: "/api/v1/auth/github",
  GITHUB_CALLBACK: "/api/v1/auth/github/callback",
  ME: "/api/v1/auth/me",
} as const;

export enum AuthErrorCode {
  UNAUTHORIZED = "UNAUTHORIZED",
  CONFLICT = "CONFLICT",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  FORBIDDEN = "FORBIDDEN",
}
