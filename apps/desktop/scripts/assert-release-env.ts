/**
 * Fail packaging when required production env is missing or still localhost.
 * Loads production env files last so packaging bakes the deployed API URL.
 *
 * Escape hatch: KNOT_ALLOW_LOCAL_PACKAGE=1 (local smoke packages only).
 */
import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFiles() {
  const desktopRoot = resolve(__dirname, "..");
  const webRoot = resolve(__dirname, "../../web");
  // Later files override earlier ones — production wins.
  for (const file of [
    resolve(webRoot, ".env"),
    resolve(webRoot, ".env.local"),
    resolve(desktopRoot, ".env"),
    resolve(desktopRoot, ".env.local"),
    resolve(webRoot, ".env.production"),
    resolve(webRoot, ".env.production.local"),
    resolve(desktopRoot, ".env.production"),
    resolve(desktopRoot, ".env.production.local"),
  ]) {
    if (existsSync(file)) config({ path: file, override: true });
  }
}

function isLocalhost(url: string) {
  try {
    const { hostname } = new URL(url);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return true;
  }
}

loadEnvFiles();

const allowLocal = process.env.KNOT_ALLOW_LOCAL_PACKAGE === "1";
const key =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ||
  process.env.VITE_CLERK_PUBLISHABLE_KEY?.trim() ||
  "";
const webUrl = (
  process.env.KNOT_WEB_APP_URL?.trim() ||
  process.env.VITE_KNOT_API_URL?.trim() ||
  "http://localhost:3000"
).replace(/\/$/, "");

const errors: string[] = [];

if (!key) {
  errors.push(
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing (required for signed-in upload + auth).",
  );
} else if (
  !allowLocal &&
  (key.includes("...") ||
    key === "pk_live_..." ||
    key === "pk_test_..." ||
    key.length < 20)
) {
  errors.push(
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY still looks like a placeholder — paste a real pk_live_ / pk_test_ key.",
  );
}

if (isLocalhost(webUrl) && !allowLocal) {
  errors.push(
    `KNOT_WEB_APP_URL is "${webUrl}" — set it to your deployed https Knot web URL before packaging.\n` +
      "  Prefer apps/desktop/.env.production (see example.env.production).\n" +
      "  For a local-only smoke package, set KNOT_ALLOW_LOCAL_PACKAGE=1.",
  );
}

if (!isLocalhost(webUrl) && !webUrl.startsWith("https://") && !allowLocal) {
  errors.push(
    `KNOT_WEB_APP_URL should use https for release builds (got "${webUrl}").`,
  );
}

if (
  !allowLocal &&
  (webUrl.includes("your-domain") || webUrl.includes("example.com"))
) {
  errors.push(
    `KNOT_WEB_APP_URL still looks like a placeholder ("${webUrl}"). Set your real https origin.`,
  );
}

if (errors.length) {
  console.error("[knot] Release env check failed:\n");
  for (const error of errors) console.error(`  • ${error}`);
  console.error("\nSee apps/desktop/README.md § Packaging.\n");
  process.exit(1);
}

console.log(`[knot] Release env OK — API base ${webUrl}`);
if (key.startsWith("pk_test_")) {
  console.warn(
    "[knot] Warning: using a Clerk pk_test_ key in a release build. Prefer pk_live_ for production.",
  );
}
