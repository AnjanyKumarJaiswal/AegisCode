import { Suspense } from "react";
import AuthCallbackHandler from "./AuthCallbackHandler";


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
