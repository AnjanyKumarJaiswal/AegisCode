import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE = "aegiscode.token";
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/logs",
  "/threats",
  "/vulnerabilities",
  "/settings",
];

function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(normalized);
    return JSON.parse(decoded) as { exp?: number };
  } catch {
    return null;
  }
}

function isExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") return true;
  return Date.now() >= payload.exp * 1000;
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (token && !isExpired(token)) {
    return NextResponse.next();
  }

  const signInUrl = new URL("/sign-in", request.url);
  signInUrl.searchParams.set("next", `${pathname}${search}`);

  const response = NextResponse.redirect(signInUrl);
  response.cookies.delete(AUTH_COOKIE);
  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/logs/:path*",
    "/threats/:path*",
    "/vulnerabilities/:path*",
    "/settings/:path*",
  ],
};
