import { buildClerkEnv, type ClerkEnvConfig } from "@shared/clerk-env";

let cached: ClerkEnvConfig | null = null;

/** Renderer — static import.meta.env reads (Vite injects these). */
export function getRendererClerkEnv(): ClerkEnvConfig {
  if (cached) return cached;

  cached = buildClerkEnv({
    publishableKey:
      import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
      import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
    webAppUrl: import.meta.env.KNOT_WEB_APP_URL || import.meta.env.VITE_KNOT_API_URL,
    signInPath: import.meta.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    signUpPath: import.meta.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
    signInFallback: import.meta.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL,
    signUpFallback: import.meta.env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL,
  });

  return cached;
}
