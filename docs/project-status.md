# Project status

Snapshot for humans returning to Knot (last updated July 2026).

Deep design: [architecture.md](./architecture.md)  
How to run / ship: [getting-started.md](./getting-started.md), [operations.md](./operations.md)

---

## Done (core product)

| Area | Notes |
|------|--------|
| Monorepo | `apps/web` + `apps/desktop` + shared packages |
| Auth | Clerk on web + desktop (`knot://app` Native OAuth) |
| Capture | Screen / window / region, mic + system audio (mixed), webcam overlay, screenshots |
| Live upload | Chunks → Next API → B2; share link while `RECORDING` |
| Progressive watch | Multi-segment WebM playlist, live poll, seek, hotkeys, poster |
| Visibility | PRIVATE / PUBLIC / AUTHENTICATED; 404 on deny; short-link checks before redirect |
| Share | Copy link, `/r/{slug}`, embed iframe (PUBLIC) |
| Dashboard | Videos, folders, settings, notifications |
| Comments | Timestamps, delete, `@mentions` + autocomplete, author names/avatars |
| Notifications | COMMENT, MENTION, RECORDING_READY, VIDEO_SHARED |
| Thumbnails | Desktop JPEG after chunk 0; dashboard cards + video poster |
| Packaging | electron-builder, icon, signing/notarize hooks, auto-update, release env assert |
| Production B2 docs | [b2-production.md](./b2-production.md) |

The **record → upload → share → watch → comment → notify** loop is complete.

---

## Intentional decisions (not bugs)

| Decision | Why |
|----------|-----|
| Desktop create defaults to **PUBLIC** | Share link must work for viewers without an account during/after recording. Dashboard creates stay **PRIVATE**. |
| Access denied → **404** | Avoid confirming that a video id exists. |
| Short link access check **before** redirect | Avoid leaking UUID for PRIVATE videos. |
| Embed = PUBLIC only | Iframes are world-reachable; no auth chrome. |
| Desktop never talks to B2 | Secrets + firewalls; API is the only writer. |
| Packaged env is bake-time | Installers cannot rely on monorepo `.env`. |

---

## Optional future work (not required for MVP)

| Idea | Notes |
|------|--------|
| Desktop visibility picker | Choose PRIVATE / AUTHENTICATED / PUBLIC at record time |
| Allowlisted embed parents | Tighten CSP `frame-ancestors` away from `*` |
| View counts / analytics | Mentioned in architecture as future |
| HLS / remux for better seeking | Today: sequential independent WebM segments |
| Delete B2 objects when deleting a video | Today: DB rows cascade; objects may remain |
| Multi-monitor region picker | Region capture is weakest on non-primary displays |
| Rate limits | Comments, mention search, playback poll, uploads |
| Decouple stop from in-flight PUTs further | Local save vs cloud queue (stop can still wait on network) |

---

## Operational leftover (deploy, not code)

When you ship for real users:

1. Host web with production `DATABASE_URL`, Clerk live keys, B2, https `NEXT_PUBLIC_APP_URL`.
2. CORS on B2 for that origin + `knot://app`.
3. Bake `KNOT_WEB_APP_URL` into desktop `.env.production` and run `package:*` / `release:*`.
4. Optional: Windows signing (`CSC_*`), macOS notarization (`APPLE_*`), `GH_TOKEN` for updates.

---

## Security notes worth remembering

- Do **not** re-export `createNotification` from a `"use server"` module (forgery). Keep creates in `lib/notifications.ts` only.
- Cap segment indexes on all upload/register routes (`MAX_SEGMENT_INDEX`).
- Revalidate `/watch/:id` and `/embed/:id` whenever visibility changes.
- Signed GET URLs remain valid until expiry (~1h) even after you lock a video down — expected for B2 signed URLs.

---

## Where documentation lives

| Topic | Doc |
|-------|-----|
| Index | [README.md](./README.md) |
| Setup | [getting-started.md](./getting-started.md) |
| Env | [environment.md](./environment.md) |
| Code map | [codebase-map.md](./codebase-map.md) |
| Ops | [operations.md](./operations.md) |
| Design | [architecture.md](./architecture.md) |
| B2 prod | [b2-production.md](./b2-production.md) |
| Desktop detail | [apps/desktop/README.md](../apps/desktop/README.md) |
