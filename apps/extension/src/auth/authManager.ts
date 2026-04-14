import * as vscode from "vscode";
import { getToken, setToken, deleteToken } from "./tokenStore";
import { logger } from "../utils/logger";
import { AuthApiClient, AuthApiError, isTokenExpired } from "@aegiscode/shared";

function createAuthClient(): AuthApiClient {
  const config = vscode.workspace.getConfiguration("aegiscode");
  const baseUrl = config.get<string>("serverUrl", "http://localhost:4000");
  return new AuthApiClient(baseUrl);
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
      "AegisCode: This token has expired. " +
        "Please sign in on the AegisCode dashboard and copy a fresh token.",
    );
    return false;
  }

  try {
    const client = createAuthClient();
    const user = await client.me(token);

    await setToken(token);
    logger.info(`Auth token validated and saved for ${user.email}`);
    vscode.window.showInformationMessage(
      `AegisCode: Signed in as ${user.email}.`,
    );
    return true;
  } catch (err) {
    if (err instanceof AuthApiError) {
      logger.error(`Token validation failed — HTTP ${err.status}`, err.message);

      if (err.status === 401) {
        vscode.window.showErrorMessage(
          "AegisCode: Token rejected by the server. " +
            "Please sign in on the dashboard and copy a fresh token.",
        );
      } else {
        vscode.window.showErrorMessage(
          `AegisCode: Could not reach the server (HTTP ${err.status}). ` +
            "Check the server URL in Settings → AegisCode and try again.",
        );
      }
    } else {
      logger.error("Token validation failed — network error", err);
      vscode.window.showErrorMessage(
        "AegisCode: Could not connect to the server. " +
          "Check your internet connection and the server URL in Settings → AegisCode.",
      );
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

  if (!token || token.length === 0) {
    return false;
  }

  if (isTokenExpired(token)) {
    await deleteToken();
    logger.warn("Stored token was expired — cleared automatically");
    return false;
  }

  return true;
}

export { getToken };
