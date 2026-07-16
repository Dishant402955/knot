import { config as loadDotenv } from "dotenv";
import { clerkEnvFromProcess } from "../shared/clerk-env";
import { app, protocol, session } from "electron";
import { createClerkBridge } from "@clerk/electron";
import { storage } from "@clerk/electron/storage";
import { existsSync } from "fs";
import { join, resolve } from "path";
import { pathToFileURL } from "url";

export const KNOT_RENDERER_SCHEME = "knot";
export const KNOT_RENDERER_HOST = "app";
export const KNOT_RENDERER_ORIGIN = `${KNOT_RENDERER_SCHEME}://${KNOT_RENDERER_HOST}`;

/** Deep-link redirect Clerk uses for Google / GitHub OAuth (must match Dashboard). */
export const KNOT_OAUTH_REDIRECT_URL = `${KNOT_RENDERER_ORIGIN}/`;

const isDev = !app.isPackaged;

let clerkBridgeCleanup: (() => void) | null = null;

/**
 * Load Clerk env from desktop + web `.env` files into process.env.
 * Must run before createClerkBridge / any clerkEnvFromProcess() call.
 */
export function loadDesktopEnvFiles() {
  const desktopRoot = join(__dirname, "../..");
  const webRoot = join(__dirname, "../../../web");

  const files = [
    join(webRoot, ".env"),
    join(webRoot, ".env.local"),
    join(desktopRoot, ".env"),
    join(desktopRoot, ".env.local"),
  ];

  for (const file of files) {
    if (existsSync(file)) {
      loadDotenv({ path: file, override: true });
    }
  }
}

export const getClerkConfig = () => clerkEnvFromProcess();

export const clerkPublishableKey = () => getClerkConfig().publishableKey;

export const clerkFapiHost = () => {
  const explicit = process.env.VITE_CLERK_FAPI_HOST?.trim();
  if (explicit) return explicit;

  const key = clerkPublishableKey();
  const encoded = key.replace(/^pk_(test|live)_/, "");
  try {
    const decoded = Buffer.from(encoded, "base64").toString("utf8").replace(/\$$/, "");
    if (decoded.includes(".")) return decoded;
  } catch {
    // Fall through.
  }

  return "clerk.accounts.dev";
};

export const knotApiBaseUrl = () => getClerkConfig().webAppUrl;

export const knotDashboardUrl = () => getClerkConfig().dashboardUrl;

export function isKnotOAuthCallbackUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === `${KNOT_RENDERER_SCHEME}:` &&
      parsed.host === KNOT_RENDERER_HOST
    );
  } catch {
    return false;
  }
}

export function initClerkBridge() {
  loadDesktopEnvFiles();

  const clerk = getClerkConfig();

  if (!clerk.publishableKey) {
    console.warn(
      "[knot] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing — set it in apps/desktop/.env (same as apps/web).",
    );
  } else {
    console.log("[knot] Clerk publishable key loaded.");
    console.log(
      `[knot] OAuth redirect (Google/GitHub): ${KNOT_OAUTH_REDIRECT_URL} — add this in Clerk → Native applications`,
    );
    console.log(`[knot] Derived Frontend API host: ${clerkFapiHost()}`);
  }

  const bridge = createClerkBridge({
    storage: storage({
      name: "knot-clerk-tokens",
      unencryptedFallback: isDev,
    }),
    renderer: {
      scheme: KNOT_RENDERER_SCHEME,
      host: KNOT_RENDERER_HOST,
    },
    userAgent: "Knot Desktop/0.1.0",
  });

  clerkBridgeCleanup = () => bridge.cleanup();

  registerProtocolClient();
}

export function cleanupClerkBridge() {
  clerkBridgeCleanup?.();
  clerkBridgeCleanup = null;
}

/**
 * Register knot:// so Google/GitHub OAuth can return from the system browser.
 * Must use absolute paths in development or Windows will not re-open this app.
 */
function registerProtocolClient() {
  if (process.defaultApp) {
    const entry = process.argv[1] ? resolve(process.argv[1]) : undefined;
    if (entry) {
      const ok = app.setAsDefaultProtocolClient(
        KNOT_RENDERER_SCHEME,
        process.execPath,
        [entry],
      );
      console.log(
        `[knot] Protocol ${KNOT_RENDERER_SCHEME}:// registered (dev): ${ok ? "ok" : "failed"}`,
      );
      return;
    }
  }

  const ok = app.setAsDefaultProtocolClient(KNOT_RENDERER_SCHEME);
  console.log(
    `[knot] Protocol ${KNOT_RENDERER_SCHEME}:// registered: ${ok ? "ok" : "failed"}`,
  );
}

/** Control window URL — Vite HTTP in dev (HMR works); knot:// in production. */
export function controlWindowUrl() {
  if (isDev && process.env.ELECTRON_RENDERER_URL) {
    const base = process.env.ELECTRON_RENDERER_URL.replace(/\/$/, "");
    return `${base}/?window=control`;
  }

  return `${KNOT_RENDERER_ORIGIN}/?window=control`;
}

/**
 * Serve packaged renderer over knot:// (production only).
 * Dev loads Vite directly — proxying HMR through a custom scheme breaks scripts.
 * OAuth deep links still work via setAsDefaultProtocolClient + second-instance.
 */
export async function registerKnotProtocol() {
  if (isDev) {
    return;
  }

  const { net } = await import("electron");

  protocol.handle(KNOT_RENDERER_SCHEME, (request) => {
    const url = new URL(request.url);
    const pathname = url.pathname === "/" ? "" : url.pathname;

    const rendererRoot = join(__dirname, "../renderer");
    const filePath =
      pathname === "" || pathname === "/"
        ? join(rendererRoot, "index.html")
        : join(rendererRoot, pathname.replace(/^\//, ""));

    return net.fetch(pathToFileURL(filePath).toString());
  });
}

export function applyClerkContentSecurityPolicy() {
  if (isDev) return;

  const fapiHost = clerkFapiHost();
  const clerk = getClerkConfig();

  const policy = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' https://${fapiHost} https://challenges.cloudflare.com`,
    `connect-src 'self' https://${fapiHost} https://api.clerk.com ${clerk.webAppUrl}`,
    "img-src 'self' https://img.clerk.com data: blob:",
    "style-src 'self' 'unsafe-inline'",
    "worker-src 'self' blob:",
    "frame-src 'self' https://challenges.cloudflare.com",
    "form-action 'self'",
    "media-src 'self' blob: mediastream:",
  ].join("; ");

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    if (!details.url.startsWith(KNOT_RENDERER_ORIGIN)) {
      callback({ responseHeaders: details.responseHeaders });
      return;
    }

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [policy],
      },
    });
  });
}

/**
 * Single-instance lock is required for OAuth: Windows delivers knot:// callbacks
 * to a second process; we forward argv to the first via `second-instance`.
 * Call this as early as possible (before ready).
 */
export function ensureSingleInstance(onSecondInstance: (argv: string[]) => void) {
  const gotLock = app.requestSingleInstanceLock();
  if (!gotLock) {
    app.quit();
    return false;
  }

  app.on("second-instance", (_event, argv) => {
    const oauthUrl = argv.find((arg) => isKnotOAuthCallbackUrl(arg));
    if (oauthUrl) {
      console.log("[knot] OAuth deep-link received (Google/GitHub callback).");
    }
    onSecondInstance(argv);
  });

  // macOS: open-url delivers knot:// when app is already running
  app.on("open-url", (event, url) => {
    if (isKnotOAuthCallbackUrl(url)) {
      event.preventDefault();
      console.log("[knot] OAuth open-url received.");
      onSecondInstance([url]);
    }
  });

  return true;
}
