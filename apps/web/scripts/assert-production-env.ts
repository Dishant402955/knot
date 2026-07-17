/**
 * Validate production-oriented web env (B2 + public URL).
 * Escape hatch: KNOT_ALLOW_LOCAL_PRODUCTION=1
 */
import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFiles() {
  const root = resolve(__dirname, "..");
  for (const file of [
    resolve(root, ".env"),
    resolve(root, ".env.local"),
    resolve(root, ".env.production"),
    resolve(root, ".env.production.local"),
  ]) {
    if (existsSync(file)) config({ path: file, override: true });
  }
}

function isLocalhost(url: string) {
  try {
    const { hostname, protocol } = new URL(url);
    if (protocol !== "https:" && hostname !== "localhost" && hostname !== "127.0.0.1") {
      // non-https non-local is suspicious for production
    }
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return true;
  }
}

loadEnvFiles();

const allowLocal = process.env.KNOT_ALLOW_LOCAL_PRODUCTION === "1";
const errors: string[] = [];

const appUrl = (
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  process.env.KNOT_WEB_APP_URL?.trim() ||
  ""
).replace(/\/$/, "");

const b2 = {
  keyId: process.env.B2_KEY_ID?.trim(),
  appKey: process.env.B2_APPLICATION_KEY?.trim(),
  bucket: process.env.B2_BUCKET?.trim(),
  endpoint: process.env.B2_ENDPOINT?.trim(),
  region: process.env.B2_REGION?.trim(),
};

if (!appUrl) {
  errors.push("NEXT_PUBLIC_APP_URL (or KNOT_WEB_APP_URL) is missing.");
} else if (isLocalhost(appUrl) && !allowLocal) {
  errors.push(
    `Public app URL is "${appUrl}" — set NEXT_PUBLIC_APP_URL to your https production origin.`,
  );
} else if (!isLocalhost(appUrl) && !appUrl.startsWith("https://") && !allowLocal) {
  errors.push(
    `Public app URL should use https in production (got "${appUrl}").`,
  );
}

if (!b2.keyId) errors.push("B2_KEY_ID is missing.");
if (!b2.appKey) errors.push("B2_APPLICATION_KEY is missing.");
if (!b2.bucket) errors.push("B2_BUCKET is missing.");
if (!b2.endpoint) errors.push("B2_ENDPOINT is missing.");
if (!b2.region) errors.push("B2_REGION is missing.");

if (!process.env.DATABASE_URL?.trim()) {
  errors.push("DATABASE_URL is missing.");
}

if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim()) {
  errors.push("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing.");
}

if (!process.env.CLERK_SECRET_KEY?.trim()) {
  errors.push("CLERK_SECRET_KEY is missing.");
}

if (errors.length) {
  console.error("[knot] Production env check failed:\n");
  for (const error of errors) console.error(`  • ${error}`);
  console.error("\nSee docs/b2-production.md\n");
  process.exit(1);
}

console.log("[knot] Production env OK");
console.log(`  • App URL: ${appUrl}`);
console.log(`  • B2 bucket: ${b2.bucket}`);
console.log(`  • B2 endpoint: ${b2.endpoint}`);
