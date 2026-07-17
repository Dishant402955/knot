/**
 * Fail packaging when required production env is missing or still localhost.
 * Escape hatch: KNOT_ALLOW_LOCAL_PACKAGE=1 (local smoke tests only).
 */
import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFiles() {
  const desktopRoot = resolve(__dirname, "..");
  const webRoot = resolve(__dirname, "../../web");
  for (const file of [
    resolve(webRoot, ".env"),
    resolve(webRoot, ".env.local"),
    resolve(desktopRoot, ".env"),
    resolve(desktopRoot, ".env.local"),
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
}

if (isLocalhost(webUrl) && !allowLocal) {
  errors.push(
    `KNOT_WEB_APP_URL is "${webUrl}" — set it to your deployed Knot web URL before packaging.\n` +
      "  For a local-only smoke package, set KNOT_ALLOW_LOCAL_PACKAGE=1.",
  );
}

if (errors.length) {
  console.error("[knot] Release env check failed:\n");
  for (const error of errors) console.error(`  • ${error}`);
  console.error("\nSee apps/desktop/README.md § Packaging.\n");
  process.exit(1);
}

console.log(`[knot] Release env OK — API base ${webUrl}`);
