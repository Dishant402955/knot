# Knot Desktop

Electron recorder for Knot — screen/window/region capture, webcam overlay, and independently playable ~5s WebM chunks saved locally. **Clerk auth** uses the **same env vars** as `apps/web` (Next.js).

## Features

- Source picker: full screen, window, or region
- Microphone + optional system audio
- Webcam overlay (drag / resize) with circle, square, rectangle shapes
- Canvas compositing into the recorded stream (window/region modes)
- Countdown, start / pause / resume / stop
- Screenshots (PNG)
- Floating recording indicator (tray bar) + system tray menu
- Global shortcuts: `Ctrl/⌘+Shift+R`, `Ctrl/⌘+Shift+P`, `Ctrl/⌘+Shift+S`
- **Sign in / sign up** — same Clerk application as the Next.js dashboard
- **Secure session storage** — tokens encrypted with OS keychain (`@clerk/electron`)
- **Live cloud upload** — while signed in, chunks upload during capture via Next.js → B2
- **Share link** — watch URL appears as soon as the recording session is created (playable after chunk 0)
- **Continue offline** — record without signing in (local files only)

## Recording flow

Order of operations when you press **Record**:

1. **Indicator tray** shows and must paint + acknowledge ready (`desktop:indicator-ready`).
2. Control window is parked off-screen (recorder lives there; it is not `hide()`n).
3. Capture is **prepared in parallel** (desktop/mic/cam streams + canvas) while the countdown runs.
4. **Center countdown** starts only after the tray is fully ready.
5. When the timer hits **0**, encoding **commits immediately** (cloud session was already created during countdown if signed in), and the tray switches to `recording`.
6. Each ~5s chunk is saved locally and uploaded (`PUT` to Next.js → B2) while capture continues.
7. On **Stop**, pending uploads flush and the video is marked `READY` (or `FAILED` if uploads broke).

### Chunks on disk

Each session folder under the app user-data `recordings/` directory contains:

| File | Meaning |
|------|---------|
| `chunk-0000.webm`, `chunk-0001.webm`, … | Independently playable WebM segments (~5s each) |
| `session.json` | Manifest (session id, chunk count, state) |

How chunks stay playable: the app **rotates `MediaRecorder`** on the same live stream (overlap + encoder flush), instead of using timeslice blobs (those lack a WebM header after the first slice and do not play alone).

Open any `chunk-*.webm` in a player. There is no single appended `recording.webm` — that approach broke independent playback.

### Cloud upload (signed-in)

Requires `apps/web` running with B2 env vars. The **API host** must reach Backblaze B2.

Chunks are uploaded with `PUT /api/videos/:id/segments/:index` (bytes go to Next.js; Next writes to B2). Desktop does **not** talk to B2 directly.

If the API runs on a machine where Cisco Umbrella blocks B2, uploads still fail — point `KNOT_WEB_APP_URL` at a cloud-hosted Knot web app, or allowlist `*.backblazeb2.com` for that host.

| Step | Endpoint |
|------|----------|
| Create session | `POST /api/videos` |
| Upload chunk | `PUT /api/videos/:id/segments/:index` |
| Finish | `PATCH /api/videos/:id` `{ status: "READY" }` |

Share URL format: `{KNOT_WEB_APP_URL}/watch/{videoId}` (also returned as `NEXT_PUBLIC_APP_URL` from the API).

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

**Option A — one file (easiest in dev):** only set Clerk vars in `apps/web/.env`. Desktop merges `apps/web/.env` (+ `.env.local`) automatically.

**Option B:** copy `example.env` → `apps/desktop/.env` and paste the same Clerk values from web.

Also in [Clerk Dashboard → Native applications](https://dashboard.clerk.com/~/native-applications):

- Enable **Native API**
- Allowed redirect URL (exact): `knot://app/`

The desktop window loads over **`knot://app`** (not `http://localhost`). That is required by `@clerk/electron` — loading Vite over HTTP makes Clerk return HTTP 400 (`Origin` + `Authorization` conflict).

For **Google / GitHub** buttons:

- Enable those social connections in Clerk (same instance as the web app)
- Desktop opens the system browser, then returns via `knot://app/`
- A stuck OAuth flow can be superseded by clicking Google/GitHub again
- You do **not** need to add `knot://` inside the Google/GitHub developer consoles — Clerk’s hosted callback handles that, then deep-links into Knot

After sign-in on desktop, “Open dashboard” goes to `{KNOT_WEB_APP_URL}/dashboard` — the same Next.js app.

## Develop

```bash
pnpm install
cp apps/desktop/example.env apps/desktop/.env   # optional if web .env already has Clerk keys
pnpm --filter desktop dev
```

Run the **web app** on port 3000 when testing API calls (`pnpm --filter web dev`).

### Unpackaged production smoke test

Compiles to `out/` and runs Electron without an installer:

```bash
pnpm --filter desktop build
pnpm --filter desktop preview
```

## API usage

```tsx
import { useKnotApi } from "@/lib/use-knot-api";

const api = useKnotApi();
await api.json("/api/videos", { method: "POST", body: "..." });
```

Requests use `Authorization: Bearer <token>` against `KNOT_WEB_APP_URL` (default `http://localhost:3000`).

## Packaging (installers)

Knot uses **electron-vite** to compile (`out/`) and **electron-builder** to produce installers under `apps/desktop/release/`.

| Script | Output |
|--------|--------|
| `pnpm --filter desktop package:win` | Windows NSIS setup (`Knot-<version>-Setup.exe`) |
| `pnpm --filter desktop package:mac` | macOS DMG (run on a Mac) |
| `pnpm --filter desktop package:linux` | Linux AppImage |
| `pnpm --filter desktop package:dir` | Unpacked app dir only (fast local smoke) |
| `pnpm --filter desktop package` | Alias for `package:win` |

Config: `electron-builder.yml`. Branding assets: `packaging/` (add `icon.png` ≥512×512 when ready).

### Before you package (required)

Env is **baked at build time**. Packaged apps do **not** read monorepo `.env` files.

1. Set in `apps/desktop/.env` and/or `apps/web/.env` (desktop wins on conflict):
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — same as web
   - `KNOT_WEB_APP_URL` — **deployed** Knot web URL (not `localhost` for real releases)
2. Clerk Native redirect still: `knot://app/`
3. The package scripts run `assert-release-env` and refuse localhost unless you opt in:

```bash
# Local smoke installer only (points at localhost API)
KNOT_ALLOW_LOCAL_PACKAGE=1 pnpm --filter desktop package:win
```

### After you change code — how to refresh packaging

Every code or env change needs a **full rebuild** of the installer (Vite bakes env into the JS bundles):

1. **Bump version** in `apps/desktop/package.json` when you intend to ship (`0.1.0` → `0.1.1`, etc.). Installer filenames include `${version}`.
2. **Update env** if the API URL or Clerk key changed (`.env`).
3. **Rebuild the installer** for each OS you ship:

```bash
pnpm --filter desktop package:win    # Windows
pnpm --filter desktop package:mac    # macOS (on a Mac)
pnpm --filter desktop package:linux  # Linux
```

4. **Test** the new artifact from `apps/desktop/release/` (install fresh, sign in, record one short clip, confirm watch URL).
5. **Distribute** the new setup/DMG/AppImage (replace the previous release asset, or attach to a new tag).

You do **not** need to edit `electron-builder.yml` for ordinary app code changes. Edit that file only when packaging behavior changes (app id, targets, icons, protocols, signing).

| Change type | What to do |
|-------------|------------|
| App / UI / upload code | Bump version (if shipping) → `package:*` |
| Clerk key or `KNOT_WEB_APP_URL` | Update `.env` → `package:*` (must rebuild) |
| App icon | Drop `packaging/icon.png` (or `.ico` / `.icns`) → `package:*` |
| Installer options / protocol / OS targets | Edit `electron-builder.yml` → `package:*` |
| Auto-update channel | Not wired yet — see below |

### Code signing & auto-update (not required for first local builds)

- **Windows:** unsigned installs show SmartScreen warnings. For public releases, set `CSC_LINK` / `CSC_KEY_PASSWORD` (or Azure Trusted Signing) when you package.
- **macOS:** enable `hardenedRuntime` + entitlements in `electron-builder.yml`, then notarize (`APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`).
- **Auto-update:** not enabled yet. When ready, add `electron-updater`, uncomment `publish` in `electron-builder.yml`, and ship via GitHub Releases.

### Next (optional)

- App icons under `packaging/`
- Code signing + macOS notarization
- `electron-updater` + GitHub Releases
