import * as vscode from "vscode";
import { getToken, setToken, deleteToken, setUsername, getUsername } from "./tokenStore";
import { logger } from "../utils/logger";
import { AuthApiClient, AuthApiError, isTokenExpired } from "@aegiscode/shared";

function createAuthClient(): AuthApiClient {
  const config = vscode.workspace.getConfiguration("aegiscode");
  const baseUrl = config.get<string>("serverUrl", "http://localhost:4000");
  return new AuthApiClient(baseUrl);
}

function deriveDisplayName(user: { username?: string | null; email: string }): string {
  if (user.username && user.username.trim() !== '') {
    return user.username;
  }
  return user.email.split("@")[0] || "User";
}

export async function loginWithGithub(): Promise<void> {
  const client = createAuthClient();
  const ideScheme = vscode.env.uriScheme;
  const callbackUri = `${ideScheme}://aegiscode.aegiscode/auth/callback`;
  const frontendUrl = process.env.FRONTEND_BASE_URL || "http://localhost:3000";
  const loginUrl = `${frontendUrl}/sign-in?redirect_uri=${encodeURIComponent(callbackUri)}`;
  
  await vscode.env.openExternal(vscode.Uri.parse(loginUrl));
}

export async function handleOAuthCallback(token: string): Promise<boolean> {
  if (isTokenExpired(token)) {
    vscode.window.showErrorMessage(
      "AegisCode: The sign-in token has expired. Please try again.",
    );
    return false;
  }

  try {
    const client = createAuthClient();
    const user = await client.me(token);

    await setToken(token);
    const displayName = deriveDisplayName(user);
    await setUsername(displayName);

    logger.info(`OAuth: signed in as ${displayName} (${user.email})`);
    vscode.window.showInformationMessage(`AegisCode: Signed in as ${displayName}`);
    return true;
  } catch (err) {
    logger.error("OAuth token validation failed", err);
    vscode.window.showErrorMessage("AegisCode: Sign-in failed. Please try again.");
    return false;
  }
}

export async function login(): Promise<boolean> {
  const raw = await vscode.window.showInputBox({
    title: "AegisCode — Sign In",
    prompt: "Paste your AegisCode API token from the dashboard",
    password: true,
    ignoreFocusOut: true,
    validateInput: (value) =>
      value.trim().length === 0 ? "Token cannot be empty" : null,
  });

  if (!raw) {
    logger.warn("Login cancelled by user");
    return false;
  }

  const token = raw.trim();

  if (isTokenExpired(token)) {
    vscode.window.showErrorMessage(
      "AegisCode: This token has expired. Please copy a fresh token from the dashboard.",
    );
    return false;
  }

  try {
    const client = createAuthClient();
    const user = await client.me(token);

    await setToken(token);
    const displayName = deriveDisplayName(user);
    await setUsername(displayName);

    logger.info(`Signed in as ${displayName} (${user.email})`);
    vscode.window.showInformationMessage(`AegisCode: Signed in as ${displayName}.`);
    return true;
  } catch (err) {
    if (err instanceof AuthApiError) {
      logger.error(`Token validation failed — HTTP ${err.status}`, err.message);
      vscode.window.showErrorMessage(
        err.status === 401
          ? "AegisCode: Token rejected. Please copy a fresh token."
          : `AegisCode: Server error (HTTP ${err.status}). Check Settings → AegisCode.`,
      );
    } else {
      logger.error("Token validation failed — network error", err);
      vscode.window.showErrorMessage("AegisCode: Could not connect to the server.");
    }
    return false;
  }
}

export async function logout(): Promise<void> {
  await deleteToken();
  logger.info("Auth token cleared");
  vscode.window.showInformationMessage("AegisCode: Signed out.");
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken();
  if (!token || token.length === 0) return false;

  if (isTokenExpired(token)) {
    await deleteToken();
    logger.warn("Stored token was expired — cleared automatically");
    return false;
  }
  return true;
}

export async function getDisplayName(): Promise<string | undefined> {
  return getUsername();
}

export { getToken };
