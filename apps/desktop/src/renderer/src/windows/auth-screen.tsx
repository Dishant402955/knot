import { SignIn, SignUp, useAuth } from "@clerk/electron/react";
import { useEffect, useState } from "react";

import { getRendererClerkEnv } from "@/lib/clerk-config";
import { clerkAppearance } from "@/lib/clerk-appearance";

const clerk = getRendererClerkEnv();

declare global {
  interface Window {
    __clerk_internal_electron?: {
      oauthTransport?: {
        getRedirectUrl: () => Promise<string>;
        open: (url: string) => Promise<{ callbackUrl: string }>;
      };
    };
  }
}

function BrandMark() {
  return (
    <div className="brand-mark brand-mark--lg" aria-hidden>
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M5 4v16M5 12h6l7 8M11 12l7-8"
          stroke="#8fd3ff"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function AuthScreen() {
  const { isLoaded } = useAuth();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [oauthBridgeReady, setOauthBridgeReady] = useState(true);
  const [oauthRedirectUrl, setOauthRedirectUrl] = useState<string | null>(null);

  useEffect(() => {
    const transport = window.__clerk_internal_electron?.oauthTransport;
    if (!transport) {
      setOauthBridgeReady(false);
      return;
    }

    setOauthBridgeReady(true);
    void transport.getRedirectUrl().then((url) => {
      setOauthRedirectUrl(url);
    });
  }, []);

  // Parent ClerkLoadGate already waited for isLoaded; keep a tiny fallback.
  if (!isLoaded) {
    return null;
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <BrandMark />
          <div>
            <h1>Knot</h1>
            <p>Sign in with email, Google, or GitHub</p>
          </div>
        </div>

        {!oauthBridgeReady && (
          <div className="auth-banner auth-banner--error">
            OAuth bridge missing — restart the app. Google/GitHub login will not work until
            the Electron preload bridge loads.
          </div>
        )}

        <div className="auth-toggle" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "sign-in"}
            data-active={mode === "sign-in"}
            onClick={() => setMode("sign-in")}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "sign-up"}
            data-active={mode === "sign-up"}
            onClick={() => setMode("sign-up")}
          >
            Create account
          </button>
        </div>

        <div className="auth-clerk" data-theme="dark">
          {mode === "sign-in" ? (
            <SignIn
              routing="hash"
              signUpUrl={clerk.signUpUrl}
              fallbackRedirectUrl={clerk.afterSignInUrl}
              forceRedirectUrl={clerk.afterSignInUrl}
              appearance={clerkAppearance}
            />
          ) : (
            <SignUp
              routing="hash"
              signInUrl={clerk.signInUrl}
              fallbackRedirectUrl={clerk.afterSignUpUrl}
              forceRedirectUrl={clerk.afterSignUpUrl}
              appearance={clerkAppearance}
            />
          )}
        </div>

        <div className="auth-oauth-hint">
          <p>
            <strong>Google / GitHub:</strong> opens your system browser, then returns to
            Knot automatically.
          </p>
          {oauthRedirectUrl && (
            <p className="auth-oauth-redirect">
              Redirect URI: <code>{oauthRedirectUrl}</code>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
