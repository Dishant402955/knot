import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin, loadEnv } from "electron-vite";
import react from "@vitejs/plugin-react";

/**
 * Merge apps/web + apps/desktop env so the same NEXT_PUBLIC_CLERK_* keys work.
 * Desktop values override web when both are set.
 */
function mergeEnv(mode: string) {
  const webDir = resolve(__dirname, "../web");
  const desktopDir = __dirname;
  return {
    ...loadEnv(mode, webDir, ""),
    ...loadEnv(mode, desktopDir, ""),
  };
}

function defineProcessEnv(env: Record<string, string>, keys: string[]) {
  const define: Record<string, string> = {};
  for (const key of keys) {
    if (env[key]) {
      define[`process.env.${key}`] = JSON.stringify(env[key]);
    }
  }
  return define;
}

const CLERK_KEYS = [
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_CLERK_SIGN_IN_URL",
  "NEXT_PUBLIC_CLERK_SIGN_UP_URL",
  "NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL",
  "NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL",
  "KNOT_WEB_APP_URL",
  "VITE_CLERK_PUBLISHABLE_KEY",
  "VITE_KNOT_API_URL",
];

export default defineConfig(({ mode }) => {
  const env = mergeEnv(mode);
  const processDefines = defineProcessEnv(env, CLERK_KEYS);

  return {
    main: {
      plugins: [externalizeDepsPlugin()],
      resolve: {
        alias: {
          "@shared": resolve("src/shared"),
        },
      },
      define: processDefines,
    },
    preload: {
      plugins: [externalizeDepsPlugin()],
      resolve: {
        alias: {
          "@shared": resolve("src/shared"),
        },
      },
      define: processDefines,
    },
    renderer: {
      resolve: {
        alias: {
          "@": resolve("src/renderer/src"),
          "@shared": resolve("src/shared"),
        },
      },
      plugins: [react()],
      // Expose Next.js-style + Knot keys to import.meta.env
      envPrefix: ["VITE_", "NEXT_PUBLIC_", "KNOT_"],
      // Ensure web .env keys are available even if only present in apps/web/.env
      define: Object.fromEntries(
        CLERK_KEYS.map((key) => [
          `import.meta.env.${key}`,
          JSON.stringify(env[key] ?? ""),
        ]),
      ),
      // Page loads over knot://app (proxied to Vite). Do NOT set server.origin to
      // http://localhost — that forces absolute font/asset URLs and breaks CORS.
      // Keep HMR on localhost; asset paths stay relative so they go through knot://.
      server: {
        cors: {
          origin: ["knot://app", "http://localhost:5173", /^knot:\/\//],
        },
        hmr: {
          protocol: "ws",
          host: "localhost",
          clientPort: 5173,
        },
      },
    },
  };
});
