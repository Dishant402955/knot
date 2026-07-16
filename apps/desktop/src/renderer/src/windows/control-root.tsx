import { ClerkProvider, useAuth } from "@clerk/electron/react";
import { useCallback, useEffect, useState } from "react";

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

/** Fail open to offline recording if Clerk is slow/unreachable. */
const CLERK_LOAD_TIMEOUT_MS = 8_000;

function useRecordingsRoot() {
  const [recordingsRoot, setRecordingsRoot] = useState<string | null>(null);

  useEffect(() => {
    void window.knot.getRecordingsRoot().then(setRecordingsRoot).catch(() => {
      setRecordingsRoot(null);
    });
  }, []);

  return recordingsRoot;
}

function OfflineBanner({ recordingsRoot }: { recordingsRoot: string | null }) {
  return (
    <div className="offline-banner" role="status">
      <div>
        <strong>Offline mode</strong>
        <span> — recording locally, cloud sync unavailable</span>
      </div>
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
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (isLoaded) return;
    const id = window.setTimeout(() => setTimedOut(true), CLERK_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [isLoaded]);

  // Auto-enter offline when Clerk never becomes ready.
  useEffect(() => {
    if (timedOut && !isLoaded) onOffline();
  }, [timedOut, isLoaded, onOffline]);

  if (isLoaded) return children;

  return (
    <div className="auth-shell">
      <div className="auth-card auth-card--loading">
        <div className="auth-spinner" />
        <p>Starting Knot…</p>
        <p className="auth-loading-sub">
          Connecting to Clerk… (offline recording unlocks in a few seconds if this fails)
        </p>
        <button type="button" className="auth-retry auth-retry--ghost" onClick={onOffline}>
          Continue offline now
        </button>
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

  return <ControlApp />;
}

function OfflineRecorder({ recordingsRoot }: { recordingsRoot: string | null }) {
  return (
    <DesktopAuthProvider value={{ mode: "offline", recordingsRoot }}>
      <OfflineBanner recordingsRoot={recordingsRoot} />
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

  if (mode === "offline") {
    return <OfflineRecorder recordingsRoot={recordingsRoot} />;
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
