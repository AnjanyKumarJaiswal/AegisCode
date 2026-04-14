"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import "./signin.css";


const BOOT_LINES = [
  { text: "aegis  v1.0.0", isReady: false },
  { text: "initializing security context...", isReady: false },
  { text: "loading credential layer...", isReady: false },
  { text: "ready.", isReady: true },
];

const URL_ERRORS: Record<string, string> = {
  missing_token:
    "GitHub sign-in failed — no token was returned. Please try again.",
  expired_token:
    "The sign-in link expired before it could be used. Please try again.",
  auth_failed: "GitHub authentication failed. Please try again.",
  invalid_token: "The sign-in link was invalid. Please try again.",
};

type Mode = "login" | "register";
type BootPhase = "boot" | "fading" | "form";

export default function SignInPage() {
  const router = useRouter();
  const auth = useAuth();

  const [phase, setPhase] = useState<BootPhase>("boot");
  const [showBoot, setShowBoot] = useState(false);

  useEffect(() => {
    if (
      typeof sessionStorage !== "undefined" &&
      sessionStorage.getItem("aegis_booted")
    ) {
      setPhase("form");
      return;
    }
    sessionStorage.setItem("aegis_booted", "1");
    setShowBoot(true);

    const t1 = setTimeout(() => setPhase("fading"), 900);
    const t2 = setTimeout(() => setPhase("form"), 1300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  useEffect(() => {
    if (!auth.isLoading && auth.user) {
      router.replace("/dashboard");
    }
  }, [auth.isLoading, auth.user, router]);

  const [urlError, setUrlError] = useState<string | null>(null);
  const urlErrorRead = useRef(false);

  useEffect(() => {
    if (urlErrorRead.current) return;
    urlErrorRead.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("error");
    if (code && URL_ERRORS[code]) {
      setUrlError(URL_ERRORS[code]);
    }
  }, []);

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const activeError = auth.error ?? urlError;

  function clearErrors() {
    auth.clearError();
    setUrlError(null);
  }

  function switchMode() {
    setMode((m) => (m === "login" ? "register" : "login"));
    clearErrors();
    setPassword("");
  }

  function handleGithub() {
    window.location.href = auth.githubOAuthUrl();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    clearErrors();
    setSubmitting(true);

    try {
      if (mode === "login") {
        await auth.login({ email, password });
      } else {
        await auth.register({ email, password });
      }
      router.push("/dashboard");
    } catch {
    } finally {
      setSubmitting(false);
    }
  }


  const isForm = phase === "form";

  return (
    <div className="signin-page">
      {/* Boot sequence */}
      {showBoot && phase !== "form" && (
        <div
          className={`boot-sequence${phase === "fading" ? " fading" : ""}`}
          aria-live="polite"
        >
          {BOOT_LINES.map((line) => (
            <span
              key={line.text}
              className={`boot-line${line.isReady ? " boot-line--ready" : ""}`}
            >
              {line.text}
            </span>
          ))}
        </div>
      )}

      {/* Sign-in / Register form */}
      <div
        className={`signin-form-wrap${isForm ? " visible" : ""}`}
        aria-hidden={!isForm}
      >
        {/* Wordmark */}
        <div className="signin-wordmark-block">
          <span className="signin-wordmark">AegisCode</span>
          <span className="signin-descriptor">security guardian</span>
        </div>
        <div className="signin-rule" aria-hidden="true" />

        {/* Headline */}
        <h1 className="signin-headline">
          {mode === "login" ? "Access your workspace." : "Create your account."}
        </h1>
        <p className="signin-sub">
          {mode === "login"
            ? "Sign in to continue to AegisCode."
            : "Start securing your AI-generated code."}
        </p>

        {/* GitHub OAuth */}
        <button
          type="button"
          className="signin-github-btn"
          onClick={handleGithub}
          aria-label="Continue with GitHub"
        >
          {/* GitHub mark */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
          </svg>
          Continue with GitHub
        </button>

        {/* Divider */}
        <div className="signin-divider" aria-hidden="true">
          <span className="signin-divider-text">or</span>
        </div>

        {/* Error banner */}
        {activeError && (
          <div className="signin-error" role="alert">
            {activeError}
          </div>
        )}

        {/* Form */}
        <form className="signin-form" onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className="field-group">
            <label className="field-label" htmlFor="email">
              Email address
            </label>
            <div className="field-input-wrap">
              <input
                id="email"
                type="email"
                className="field-input"
                placeholder="you@example.com"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearErrors();
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="field-group">
            <label className="field-label" htmlFor="password">
              Password
            </label>
            <div className="field-input-wrap">
              <input
                id="password"
                type={showPw ? "text" : "password"}
                className="field-input has-toggle"
                placeholder="••••••••"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearErrors();
                }}
              />
              <button
                type="button"
                className={`pw-toggle${showPw ? " active" : ""}`}
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? "hide" : "show"}
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="signin-submit-wrap">
            <button
              type="submit"
              className="signin-submit"
              disabled={submitting}
              aria-label={mode === "login" ? "Sign in" : "Create account"}
            >
              {submitting ? (
                <>
                  <span className="dot-1">.</span>
                  <span className="dot-2">.</span>
                  <span className="dot-3">.</span>
                </>
              ) : mode === "login" ? (
                "Continue"
              ) : (
                "Create account"
              )}
            </button>
          </div>
        </form>

        {/* Mode toggle */}
        <p className="signin-secondary">
          {mode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <button type="button" onClick={switchMode}>
                Create one
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button type="button" onClick={switchMode}>
                Sign in
              </button>
            </>
          )}
        </p>
      </div>

      {/* Footer watermark */}
      <footer className="signin-footer" aria-hidden="true">
        AegisCode · Secured by dual-agent scanning
      </footer>
    </div>
  );
}
