import { app, BrowserWindow, ipcMain, protocol, session, shell } from "electron";
import { createClerkBridge } from "@clerk/electron";
import { storage } from "@clerk/electron/storage";
import { existsSync } from "fs";
import { isAbsolute, join, relative, resolve } from "path";
import { pathToFileURL } from "url";

import { IPC, type OAuthStatusPayload } from "../shared/types";
import { clerkEnvFromProcess } from "../shared/clerk-env";
import { config as loadDotenv } from "dotenv";

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
 *
 * Packaged builds skip filesystem dotenv — values are baked in at
 * `electron-vite build` time via Vite `define` (see electron.vite.config.ts).
 * Monorepo `.env` paths do not exist inside an installed app.
 */
export function loadDesktopEnvFiles() {
  if (app.isPackaged) return;

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

function isLocalhostUrl(url: string) {
  try {
    const { hostname } = new URL(url);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

/** Warn when a release build would talk to localhost or lack Clerk. */
export function assertPackagedRuntimeConfig() {
  if (!app.isPackaged) return;

  const clerk = getClerkConfig();
  if (!clerk.publishableKey) {
    console.error(
      "[knot] Packaged build is missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY. Rebuild with env set (see apps/desktop/README.md § Packaging).",
    );
  }
  if (isLocalhostUrl(clerk.webAppUrl)) {
    console.error(
      `[knot] Packaged build points at ${clerk.webAppUrl}. Set KNOT_WEB_APP_URL to your deployed web API before packaging, then rebuild.`,
    );
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
  assertPackagedRuntimeConfig();

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
    console.log(
      "[knot] Renderer must load over knot:// (not http://localhost) for Clerk native auth.",
    );
    console.log(`[knot] API / dashboard base: ${clerk.webAppUrl}`);
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
    userAgent: `Knot Desktop/${app.getVersion()}`,
  });

  clerkBridgeCleanup = () => {
    cancelPendingOAuth(new Error("Clerk: OAuth flow was cancelled."));
    bridge.cleanup();
  };

  // Replace Clerk's OAuth open handler so a stuck flow can be superseded.
  installResilientOAuthTransport();

  registerProtocolClient();
}

export function cleanupClerkBridge() {
  cancelPendingOAuth(new Error("Clerk: OAuth flow was cancelled."));
  clerkBridgeCleanup?.();
  clerkBridgeCleanup = null;
}

const OAUTH_OPEN = "clerk:oauth-transport:open";
const OAUTH_GET_REDIRECT = "clerk:oauth-transport:get-redirect-url";
const OAUTH_TIMEOUT_MS = 120_000;

type PendingOAuth = {
  resolve: (value: { callbackUrl: string }) => void;
  reject: (reason?: unknown) => void;
  timeout: ReturnType<typeof setTimeout>;
};

let pendingOAuth: PendingOAuth | null = null;

function broadcastOAuthStatus(payload: OAuthStatusPayload) {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send(IPC.oauthStatus, payload);
    }
  }
}

function cancelPendingOAuth(reason?: Error) {
  if (!pendingOAuth) return;
  const pending = pendingOAuth;
  clearTimeout(pending.timeout);
  pendingOAuth = null;
  if (reason) {
    const message = reason.message.replace(/^Clerk:\s*/i, "");
    if (!message.includes("replaced")) {
      broadcastOAuthStatus({ status: "error", message });
    } else {
      broadcastOAuthStatus({ status: "idle" });
    }
    pending.reject(reason);
  } else {
    broadcastOAuthStatus({ status: "idle" });
  }
}

function isOAuthCallbackUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== `${KNOT_RENDERER_SCHEME}:`) return false;
    if (parsed.host !== KNOT_RENDERER_HOST) return false;
    // Clerk may redirect to knot://app or knot://app/ — both are valid.
    const pathOk = parsed.pathname === "/" || parsed.pathname === "";
    // Require query/hash so a plain app reopen isn't treated as an OAuth return.
    return pathOk && (parsed.search.length > 1 || parsed.hash.length > 1);
  } catch {
    return false;
  }
}

function resolveOAuthCallback(url: string) {
  if (!pendingOAuth || !isOAuthCallbackUrl(url)) return false;
  const pending = pendingOAuth;
  clearTimeout(pending.timeout);
  pendingOAuth = null;
  console.log("[knot] OAuth callback received — completing sign-in.");
  broadcastOAuthStatus({ status: "idle" });
  pending.resolve({ callbackUrl: url });
  return true;
}

/** Public entry for deep-links (second-instance / open-url). */
export function tryResolveOAuthCallback(url: string) {
  return resolveOAuthCallback(url);
}

/**
 * Clerk's default open handler throws if a previous Google/GitHub click left a
 * pending flow (common when the deep-link never returned). Replace it so a new
 * click cancels the old wait and starts clean.
 */
function installResilientOAuthTransport() {
  ipcMain.removeHandler(OAUTH_GET_REDIRECT);
  ipcMain.removeHandler(OAUTH_OPEN);

  ipcMain.handle(OAUTH_GET_REDIRECT, () => KNOT_OAUTH_REDIRECT_URL);

  ipcMain.handle(OAUTH_OPEN, async (_event, url: string) => {
    if (pendingOAuth) {
      console.warn("[knot] Cancelling previous OAuth flow to start a new one.");
      cancelPendingOAuth(new Error("Clerk: previous OAuth flow was replaced."));
    }

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new TypeError("Clerk: invalid OAuth URL");
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new TypeError(`Clerk: refusing to open unsupported OAuth URL protocol: ${parsed.protocol}`);
    }

    const callbackPromise = new Promise<{ callbackUrl: string }>((resolve, reject) => {
      pendingOAuth = {
        resolve,
        reject,
        timeout: setTimeout(() => {
          cancelPendingOAuth(
            new Error("Clerk: OAuth callback timed out. Click Google/GitHub again."),
          );
        }, OAUTH_TIMEOUT_MS),
      };
    });

    try {
      await shell.openExternal(url);
      broadcastOAuthStatus({ status: "waiting" });
      console.log("[knot] Opened system browser for OAuth. Waiting for knot://app/ return…");
    } catch (err) {
      cancelPendingOAuth(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }

    return callbackPromise;
  });
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

/**
 * Always load the control UI over knot:// — required by @clerk/electron.
 * Loading http://localhost makes Chromium send Origin while the SDK sends
 * Authorization, and Clerk rejects that with 400 (origin_authorization_headers_conflict).
 */
export function controlWindowUrl() {
  return `${KNOT_RENDERER_ORIGIN}/?window=control`;
}

export function overlayWindowUrl(windowName: string) {
  return `${KNOT_RENDERER_ORIGIN}/?window=${windowName}`;
}

/**
 * Serve the renderer over knot://.
 * - Dev: proxy to the Vite dev server (assets + HMR websocket still hit localhost).
 * - Prod: serve packaged renderer files.
 */
export async function registerKnotProtocol() {
  const { net } = await import("electron");

  const viteBase =
    isDev && process.env.ELECTRON_RENDERER_URL
      ? process.env.ELECTRON_RENDERER_URL.replace(/\/$/, "")
      : null;

  protocol.handle(KNOT_RENDERER_SCHEME, (request) => {
    const url = new URL(request.url);

    if (viteBase) {
      const pathname = url.pathname || "/";
      const target = `${viteBase}${pathname}${url.search}`;
      return net.fetch(target, {
        bypassCustomProtocolHandlers: true,
      });
    }

    const pathname = url.pathname === "/" ? "" : url.pathname;
    const rendererRoot = resolve(join(__dirname, "../renderer"));
    const unsafeRelative =
      pathname === "" || pathname === "/"
        ? "index.html"
        : decodeURIComponent(pathname.replace(/^\//, ""));
    const filePath = resolve(join(rendererRoot, unsafeRelative));
    const rel = relative(rendererRoot, filePath);
    if (rel.startsWith("..") || rel === ".." || isAbsolute(rel)) {
      return new Response("Not found", { status: 404 });
    }

    return net.fetch(pathToFileURL(filePath).toString());
  });

  console.log(
    viteBase
      ? `[knot] knot:// → Vite proxy ${viteBase}`
      : "[knot] knot:// → packaged renderer files",
  );
}

/**
 * @clerk/electron uses native mode (Authorization + _is_native=1).
 * Chromium still attaches Origin: knot://app on fetches, which makes Clerk
 * either reject (Origin+Authorization conflict) or omit CORS headers.
 *
 * Fix both sides:
 * 1) Strip Origin on outbound Clerk FAPI requests (native path).
 * 2) Ensure responses allow knot://app so the renderer can read the body.
 */
export function applyClerkNativeHeaderFix() {
  const fapiHost = clerkFapiHost();
  const urls = [
    `https://${fapiHost}/*`,
    "https://*.clerk.accounts.dev/*",
    "https://api.clerk.com/*",
    "https://*.clerk.com/*",
  ];

  session.defaultSession.webRequest.onBeforeSendHeaders({ urls }, (details, callback) => {
    const headers = { ...details.requestHeaders };
    // Always strip — native Electron must not send Origin with Authorization.
    delete headers.Origin;
    delete headers.origin;
    callback({ requestHeaders: headers });
  });

  session.defaultSession.webRequest.onHeadersReceived({ urls }, (details, callback) => {
    const responseHeaders = { ...(details.responseHeaders ?? {}) };

    // Drop any prior ACAO so we can set a single value Chromium accepts.
    delete responseHeaders["Access-Control-Allow-Origin"];
    delete responseHeaders["access-control-allow-origin"];

    responseHeaders["Access-Control-Allow-Origin"] = [KNOT_RENDERER_ORIGIN];
    responseHeaders["Access-Control-Allow-Credentials"] = ["true"];
    responseHeaders["Access-Control-Allow-Headers"] = [
      "Authorization, Content-Type, Prefer, Clerk-Session-Id, Clerk-Db-Jwt, X-Requested-With",
    ];
    responseHeaders["Access-Control-Allow-Methods"] = ["GET, POST, PUT, PATCH, DELETE, OPTIONS"];

    callback({ responseHeaders });
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
      resolveOAuthCallback(oauthUrl);
    }
    onSecondInstance(argv);
  });

  // macOS: open-url delivers knot:// when app is already running
  app.on("open-url", (event, url) => {
    if (isKnotOAuthCallbackUrl(url)) {
      event.preventDefault();
      console.log("[knot] OAuth open-url received.");
      resolveOAuthCallback(url);
      onSecondInstance([url]);
    }
  });

  return true;
}
