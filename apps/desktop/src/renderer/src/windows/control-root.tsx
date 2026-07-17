import { ClerkProvider, useAuth } from "@clerk/electron/react";
import { useCallback, useEffect, useState } from "react";

import { CloudApiProvider } from "@/lib/cloud-api";
import { getRendererClerkEnv } from "@/lib/clerk-config";
import { clerkAppearance } from "@/lib/clerk-appearance";
import {
  DesktopAuthProvider,
  type DesktopAuthMode,
} from "@/lib/desktop-auth";

import { ControlApp } from "./control-app";
import { AuthScreen } from "./auth-screen";

const clerk = getRendererClerkEnv();

const ALLOWED_REDIRECT_PROTOCOLS = ["knot:"];

/** Show a soft warning after this; do NOT auto-force offline. */
const CLERK_SLOW_MS = 12_000;

if (typeof window !== "undefined") {
  console.info(
    "[knot] Clerk publishable key in renderer:",
    clerk.publishableKey ? `${clerk.publishableKey.slice(0, 12)}…` : "(missing)",
  );
}

function useRecordingsRoot() {
  const [recordingsRoot, setRecordingsRoot] = useState<string | null>(null);

  useEffect(() => {
    void window.knot.getRecordingsRoot().then(setRecordingsRoot).catch(() => {
      setRecordingsRoot(null);
    });
  }, []);

  return recordingsRoot;
}

function OfflineBanner({
  recordingsRoot,
  onRetrySignIn,
}: {
  recordingsRoot: string | null;
  onRetrySignIn: () => void;
}) {
  return (
    <div className="offline-banner" role="status">
      <div>
        <strong>Offline mode</strong>
        <span> — recording locally, cloud sync unavailable</span>
      </div>
      <div className="offline-banner-actions">
        <button type="button" className="btn-ghost" onClick={onRetrySignIn}>
          Try sign-in again
        </button>
        {recordingsRoot && (
          <button
            type="button"
            className="offline-banner-path"
            title="Open recordings folder"
            onClick={() => void window.knot.openRecordingsFolder(recordingsRoot)}
          >
            Saved in: <code>{recordingsRoot}</code>
          </button>
        )}
      </div>
    </div>
  );
}

function ClerkLoadGate({
  onOffline,
  children,
}: {
  onOffline: () => void;
  children: React.ReactNode;
}) {
  const { isLoaded } = useAuth();
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      setSlow(false);
      return;
    }
    const id = window.setTimeout(() => setSlow(true), CLERK_SLOW_MS);
    return () => window.clearTimeout(id);
  }, [isLoaded]);

  if (isLoaded) return children;

  return (
    <div className="auth-shell">
      <div className="auth-card auth-card--loading">
        <div className="auth-spinner" />
        <p>Starting Knot…</p>
        <p className="auth-loading-sub">
          {slow
            ? "Clerk is taking longer than usual. Check your network, or continue offline."
            : "Connecting to Clerk…"}
        </p>
        {slow && (
          <div className="auth-loading-actions">
            <button
              type="button"
              className="auth-retry"
              onClick={() => window.location.reload()}
            >
              Retry connection
            </button>
            <button type="button" className="auth-retry auth-retry--ghost" onClick={onOffline}>
              Continue offline
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ControlGate({
  onOffline,
  recordingsRoot,
}: {
  onOffline: () => void;
  recordingsRoot: string | null;
}) {
  const { isSignedIn } = useAuth();

  if (!isSignedIn) {
    return (
      <AuthScreen
        onContinueOffline={onOffline}
        recordingsRoot={recordingsRoot}
      />
    );
  }

  return (
    <CloudApiProvider>
      <ControlApp />
    </CloudApiProvider>
  );
}

function OfflineRecorder({
  recordingsRoot,
  onRetrySignIn,
}: {
  recordingsRoot: string | null;
  onRetrySignIn: () => void;
}) {
  return (
    <DesktopAuthProvider value={{ mode: "offline", recordingsRoot }}>
      <OfflineBanner recordingsRoot={recordingsRoot} onRetrySignIn={onRetrySignIn} />
      <ControlApp />
    </DesktopAuthProvider>
  );
}

export function ControlRoot() {
  const recordingsRoot = useRecordingsRoot();
  const [mode, setMode] = useState<DesktopAuthMode | "booting">(() =>
    clerk.publishableKey ? "booting" : "offline",
  );

  const goOffline = useCallback(() => setMode("offline"), []);
  const retrySignIn = useCallback(() => {
    if (!clerk.publishableKey) {
      console.warn("[knot] Cannot retry Clerk — publishable key missing in renderer.");
      return;
    }
    setMode("booting");
  }, []);

  if (!clerk.publishableKey) {
    return (
      <OfflineRecorder
        recordingsRoot={recordingsRoot}
        onRetrySignIn={() =>
          window.alert(
            "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing. Add it to apps/desktop/.env (same as web) and restart the desktop app.",
          )
        }
      />
    );
  }

  if (mode === "offline") {
    return (
      <OfflineRecorder recordingsRoot={recordingsRoot} onRetrySignIn={retrySignIn} />
    );
  }

  return (
    <DesktopAuthProvider value={{ mode: "online", recordingsRoot }}>
      <ClerkProvider
        publishableKey={clerk.publishableKey}
        signInUrl={clerk.signInUrl}
        signUpUrl={clerk.signUpUrl}
        appearance={clerkAppearance}
        allowedRedirectProtocols={ALLOWED_REDIRECT_PROTOCOLS}
      >
        <ClerkLoadGate onOffline={goOffline}>
          <ControlGate onOffline={goOffline} recordingsRoot={recordingsRoot} />
        </ClerkLoadGate>
      </ClerkProvider>
    </DesktopAuthProvider>
  );
}
