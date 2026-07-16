import { ClerkProvider, useAuth } from "@clerk/electron/react";
import { useEffect, useState } from "react";

import { getRendererClerkEnv } from "@/lib/clerk-config";
import { clerkAppearance } from "@/lib/clerk-appearance";

import { ControlApp } from "./control-app";
import { AuthScreen } from "./auth-screen";

const clerk = getRendererClerkEnv();

/** Always allow knot: deep links from Google/GitHub OAuth. */
const ALLOWED_REDIRECT_PROTOCOLS = ["knot:"];

/** Clerk normally loads in <2s; hang past this = CSP/network/Native API issue. */
const CLERK_LOAD_TIMEOUT_MS = 12_000;

function ClerkLoadGate({ children }: { children: React.ReactNode }) {
  const { isLoaded } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (isLoaded) return;
    const id = window.setTimeout(() => setTimedOut(true), CLERK_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [isLoaded]);

  if (isLoaded) return children;

  if (timedOut) {
    return (
      <div className="auth-shell">
        <div className="auth-card auth-card--error">
          <h1>Clerk took too long to load</h1>
          <p>
            The app waited {CLERK_LOAD_TIMEOUT_MS / 1000}s and Clerk never became ready.
            Usually this means the Frontend API host is blocked, offline, or Native API is
            disabled.
          </p>
          <ul className="auth-fix-list">
            <li>
              Clerk Dashboard → <strong>Native applications</strong> → enable Native API
            </li>
            <li>
              Allowed redirect URL: <code>knot://app/</code>
            </li>
            <li>Check your network / VPN can reach <code>*.clerk.accounts.dev</code></li>
            <li>
              Confirm <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> matches the web app
            </li>
          </ul>
          <button
            type="button"
            className="auth-retry"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="auth-card auth-card--loading">
        <div className="auth-spinner" />
        <p>Starting Knot…</p>
        <p className="auth-loading-sub">Connecting to Clerk…</p>
      </div>
    </div>
  );
}

function ControlGate() {
  const { isSignedIn } = useAuth();

  if (!isSignedIn) {
    return <AuthScreen />;
  }

  return <ControlApp />;
}

export function ControlRoot() {
  if (!clerk.publishableKey) {
    return (
      <div className="auth-shell">
        <div className="auth-card auth-card--error">
          <h1>Missing Clerk key</h1>
          <p>
            Set <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> in{" "}
            <code>apps/desktop/.env</code> — use the <strong>same value</strong> as{" "}
            <code>apps/web/.env</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider
      publishableKey={clerk.publishableKey}
      signInUrl={clerk.signInUrl}
      signUpUrl={clerk.signUpUrl}
      appearance={clerkAppearance}
      allowedRedirectProtocols={ALLOWED_REDIRECT_PROTOCOLS}
    >
      <ClerkLoadGate>
        <ControlGate />
      </ClerkLoadGate>
    </ClerkProvider>
  );
}
