import type { KnotDesktopApi } from "../../preload/index";

interface ImportMetaEnv {
  readonly NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string;
  readonly NEXT_PUBLIC_CLERK_SIGN_IN_URL?: string;
  readonly NEXT_PUBLIC_CLERK_SIGN_UP_URL?: string;
  readonly NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL?: string;
  readonly NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL?: string;
  readonly KNOT_WEB_APP_URL?: string;
  /** @deprecated use NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY */
  readonly VITE_CLERK_PUBLISHABLE_KEY?: string;
  /** @deprecated use KNOT_WEB_APP_URL */
  readonly VITE_KNOT_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    knot: KnotDesktopApi;
  }
}

export {};
