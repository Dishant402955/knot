/**
 * Clerk settings shared with apps/web — reads the same NEXT_PUBLIC_* names as Next.js.
 *
 * Important: values must be read via static `process.env.KEY` / `import.meta.env.KEY`
 * access (or dotenv at runtime). Dynamic `process.env[key]` is NOT rewritten by Vite.
 */
export type ClerkEnvConfig = {
  publishableKey: string;
  webAppUrl: string;
  dashboardUrl: string;
  signInPath: string;
  signUpPath: string;
  signInUrl: string;
  signUpUrl: string;
  afterSignInUrl: string;
  afterSignUpUrl: string;
  webSignInUrl: string;
  webSignUpUrl: string;
};

const trim = (value: string | undefined) => (typeof value === "string" ? value.trim() : "");

/** Desktop home after sign-in — keep control window query for Vite / file loads. */
const DESKTOP_HOME = "/?window=control";

/** Map web dashboard redirect to desktop home (no /dashboard route in Electron). */
const desktopRedirect = (path: string) =>
  path === "/dashboard" || path === "/" ? DESKTOP_HOME : path;

export function buildClerkEnv(input: {
  publishableKey?: string;
  webAppUrl?: string;
  signInPath?: string;
  signUpPath?: string;
  signInFallback?: string;
  signUpFallback?: string;
}): ClerkEnvConfig {
  const publishableKey = trim(input.publishableKey);
  const webAppUrl = (
    trim(input.webAppUrl) || "http://localhost:3000"
  ).replace(/\/$/, "");

  const signInPath = trim(input.signInPath) || "/sign-in";
  const signUpPath = trim(input.signUpPath) || "/sign-up";
  const signInFallback = trim(input.signInFallback) || "/dashboard";
  const signUpFallback = trim(input.signUpFallback) || "/dashboard";

  return {
    publishableKey,
    webAppUrl,
    dashboardUrl: `${webAppUrl}/dashboard`,
    signInPath,
    signUpPath,
    signInUrl: signInPath,
    signUpUrl: signUpPath,
    afterSignInUrl: desktopRedirect(signInFallback),
    afterSignUpUrl: desktopRedirect(signUpFallback),
    webSignInUrl: `${webAppUrl}${signInPath}`,
    webSignUpUrl: `${webAppUrl}${signUpPath}`,
  };
}

/** Main / preload — static process.env reads so Vite `define` + dotenv both work. */
export function clerkEnvFromProcess(): ClerkEnvConfig {
  return buildClerkEnv({
    publishableKey:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
      process.env.VITE_CLERK_PUBLISHABLE_KEY,
    webAppUrl: process.env.KNOT_WEB_APP_URL || process.env.VITE_KNOT_API_URL,
    signInPath: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    signUpPath: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
    signInFallback: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL,
    signUpFallback: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL,
  });
}
