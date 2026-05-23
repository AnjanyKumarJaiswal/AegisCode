const IDE_HANDOFF_FLAG = "aegiscode.ideHandoff";
const HANDOFF_TOKEN_KEY = "aegiscode.handoff.token";
const HANDOFF_REDIRECT_KEY = "aegiscode.handoff.redirect_uri";

export function getRedirectUriFromSearch(search: string): string | null {
  const params = new URLSearchParams(search);
  return params.get("redirect_uri");
}

export function isIdeAuthCallbackUri(redirectUri: string): boolean {
  try {
    const url = new URL(redirectUri);
    if (
      url.protocol === "http:" ||
      url.protocol === "https:" ||
      url.protocol === "javascript:"
    ) {
      return false;
    }

    const path = url.pathname.replace(/\/+$/, "") || "/";
    return path === "/auth/callback";
  } catch {
    return false;
  }
}

export function getIdeLabelFromRedirectUri(redirectUri: string): string {
  try {
    const scheme = new URL(redirectUri).protocol.replace(":", "");
    if (!scheme) return "your IDE";
    return scheme.charAt(0).toUpperCase() + scheme.slice(1);
  } catch {
    return "your IDE";
  }
}

export function buildIdeCallbackUrl(
  redirectUri: string,
  token: string,
): string | null {
  if (!isIdeAuthCallbackUri(redirectUri)) return null;

  const url = new URL(redirectUri);
  url.searchParams.set("token", token);
  return url.toString();
}

export function markIdeHandoffPending(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(IDE_HANDOFF_FLAG, "1");
}

export function isIdeHandoffPending(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(IDE_HANDOFF_FLAG) === "1";
}

export function clearIdeHandoffPending(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(IDE_HANDOFF_FLAG);
  sessionStorage.removeItem(HANDOFF_TOKEN_KEY);
  sessionStorage.removeItem(HANDOFF_REDIRECT_KEY);
}

export function storeIdeHandoff(redirectUri: string, token: string): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(HANDOFF_TOKEN_KEY, token);
  sessionStorage.setItem(HANDOFF_REDIRECT_KEY, redirectUri);
  markIdeHandoffPending();
}

export function readStoredIdeHandoff(): {
  redirectUri: string;
  token: string;
} | null {
  if (typeof sessionStorage === "undefined") return null;

  const redirectUri = sessionStorage.getItem(HANDOFF_REDIRECT_KEY);
  const token = sessionStorage.getItem(HANDOFF_TOKEN_KEY);
  if (!redirectUri || !token) return null;

  return { redirectUri, token };
}

export function redirectToIde(redirectUri: string, token: string): boolean {
  const target = buildIdeCallbackUrl(redirectUri, token);
  if (!target) return false;

  storeIdeHandoff(redirectUri, token);
  window.location.replace(target);
  return true;
}

export function beginIdeHandoff(redirectUri: string, token: string): void {
  storeIdeHandoff(redirectUri, token);
  window.location.href = "/auth/ide-handoff";
}

export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "Never";

  const diffMs = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diffMs) || diffMs < 0) return "Just now";

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
