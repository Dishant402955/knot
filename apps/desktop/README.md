# Knot Desktop

Electron recorder for Knot — screen/window/region capture, webcam overlay, and 5s WebM chunks saved locally. **Clerk auth** uses the **same env vars** as `apps/web` (Next.js).

## Features (Phase A)

- Source picker: full screen, window, or region
- Microphone + optional system audio
- Webcam overlay window (drag / resize) with circle, square, rectangle shapes
- Canvas compositing into the recorded stream
- Countdown, start / pause / resume / stop
- Screenshots (PNG)
- Floating recording indicator + system tray status
- Global shortcuts: `Ctrl/⌘+Shift+R`, `Ctrl/⌘+Shift+P`, `Ctrl/⌘+Shift+S`
- **Sign in / sign up** — same Clerk application as the Next.js dashboard
- **Secure session storage** — tokens encrypted with OS keychain
- **Authenticated API client** — `useKnotApi()` calls `http://localhost:3000` (your web app)

## Auth setup

Use the **same Clerk block** as `apps/web/.env`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard

KNOT_WEB_APP_URL=http://localhost:3000
```

**Option A — one file (easiest in dev):** only set Clerk vars in `apps/web/.env`. Desktop dev merges `apps/web/.env` automatically.

**Option B:** copy `example.env` → `apps/desktop/.env` and paste the same Clerk values from web.

Also in [Clerk Dashboard → Native applications](https://dashboard.clerk.com/~/native-applications):

- Enable **Native API**
- Allowed redirect URL (exact): `knot://app/`

For **Google / GitHub** buttons:

- Enable those social connections in Clerk (same instance as the web app)
- Desktop opens the system browser, then returns via `knot://app/`
- You do **not** need to add `knot://` inside the Google/GitHub developer consoles — Clerk’s hosted callback handles that, then deep-links into Knot

After sign-in on desktop, “Open dashboard” goes to `{KNOT_WEB_APP_URL}/dashboard` — the same Next.js app.

## Develop

```bash
pnpm install
cp apps/desktop/example.env apps/desktop/.env   # optional if web .env already has Clerk keys
pnpm --filter desktop dev
```

Run the **web app** on port 3000 when testing API calls (`pnpm --filter web dev`).

## API usage

```tsx
import { useKnotApi } from "@/lib/use-knot-api";

const api = useKnotApi();
await api.json("/api/videos", { method: "POST", body: "..." });
```

Requests use `Authorization: Bearer <token>` against `KNOT_WEB_APP_URL` (default `http://localhost:3000`).
