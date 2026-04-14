import { Suspense } from "react";
import AuthCallbackHandler from "./AuthCallbackHandler";

/**
 * /auth/callback
 *
 * Landing page for the GitHub OAuth redirect from the backend.
 * The backend sends the user here after a successful GitHub login:
 *
 *   FRONTEND_BASE_URL/auth/callback?token=<jwt>
 *
 * useSearchParams() inside AuthCallbackHandler requires a Suspense boundary
 * per Next.js App Router rules — without it the build will warn and the page
 * will be excluded from static optimisation.
 */
export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--bg, #080705)",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "13px",
              color: "#4A4440",
              letterSpacing: "0.08em",
            }}
          >
            completing sign in...
          </p>
        </div>
      }
    >
      <AuthCallbackHandler />
    </Suspense>
  );
}
