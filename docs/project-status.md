# Project Status

Where [Knot](../README.md) stands today (July 2026) vs. the [target architecture](./architecture.md).

## At a glance

| Area | Status |
|------|--------|
| Monorepo + web scaffold | Done |
| Marketing / landing site | Done |
| Auth (Clerk) — web | Mostly done |
| Dashboard shell + sidebar | Done |
| Folders (CRUD + UI) | Done |
| Videos (metadata) | Partial |
| B2 storage | Prototype only |
| Watch page & playback | Not started |
| Share links | Not started |
| Comments & notifications | Partial (list UI only) |
| API routes (desktop) | Not started |
| Desktop (Electron) app | Phase A done (local capture) |
| Infra (CI, tests) | Not started |

---

## Done

- **Tooling** — pnpm + Turborepo, shared ESLint/TS config packages, Prettier, TS 5.9.
- **Web foundation** — Next.js 16 App Router, React 19, Tailwind v4, shadcn/ui, Drizzle + Neon client, env template.
- **Database schema** — `folders`, `videos`, `video_segments`, `comments`, `notifications` + enums (`db/schema.ts`).
- **Marketing site** — landing page (Hero, Features, Use Cases, Pricing, Footer) + navbar.
- **Auth (web)** — Clerk provider, sign-in/sign-up pages, `proxy.ts` route protection (Next.js 16), `currentUser()` guards in folder server actions, post-login redirect to `/dashboard`.
- **Dashboard** — layout with header bar (sidebar trigger + `UserButton`), icon-collapsible sidebar with active-route highlight, home page with recent folders/videos and shared grid/list toggle, notifications list page, settings (`UserProfile`).
- **Folders** — full CRUD, nested folders, duplicate-name validation, root list page, detail page (`/dashboard/folder/:id`), breadcrumbs, grid/list view toggle, folder cards + rows, 3-dot actions menu, real video counts, recursive delete.
- **Videos (metadata)** — `getAllUserVideos`, videos list page (read-only), video row component for list view.
- **Notifications** — `getAllUserNotifications`, list page with empty state (read-only).
- **Desktop (Phase A)** — Electron app in `apps/desktop`: source picker (screen/window/region), mic + system audio, webcam overlay (drag/resize, circle/square/rectangle), canvas compositing, 5s WebM chunks saved locally, countdown, pause/resume/stop, screenshots, tray + global shortcuts, floating recording indicator.

---

## Remaining — web app

Everything below is web-only work. Desktop API routes (`/api/videos`, upload-url, segments, bearer auth) are listed separately at the end.

### Foundation

| # | Task | Notes |
|---|------|-------|
| 1 | **Database migrations** | Generate and commit Drizzle migrations; run against Postgres (`drizzle/` is empty) |

### Dashboard — videos

| # | Task | Notes |
|---|------|-------|
| 2 | **Video metadata CRUD** | Create / edit / delete server actions + UI on videos page, folder detail, optional video detail page |
| 3 | **Folder assignment** | Wire `folderId` so videos can be organized into folders (schema exists, not used in app) |
| 4 | **Videos page polish** | Grid/list toggle (like folders), actions menu, richer empty states |
| 5 | **Folder detail — videos section** | Grid/list toggle + video actions once CRUD exists; read-only cards today |

### Core product — playback & sharing

| # | Task | Notes |
|---|------|-------|
| 6 | **Watch page** (`/watch/[videoId]`) | Load video + segments; progressive playback (MSE); poll for new chunks while `RECORDING`; "still recording" UI |
| 7 | **B2 playback integration** | Signed GET URLs for chunks and thumbnails (upload prototype exists; playback not productized) |
| 8 | **Visibility enforcement** | `PRIVATE` / `PUBLIC` / `AUTHENTICATED` checks before serving watch page or signed URLs |
| 9 | **`proxy.ts` public routes** | Allow `/watch/:id` without sign-in for public videos; short links (`/r/[slug]`) later |
| 10 | **Share links UX** | Copy-link from dashboard; open watch page |

### Social & notifications

| # | Task | Notes |
|---|------|-------|
| 11 | **Comments** | Schema only — UI + server actions (likely on watch page) |
| 12 | **Notifications polish** | Mark as read; create notifications on events; optional real-time |

### Auth (web remainder)

| # | Task | Notes |
|---|------|-------|
| 13 | **Watch-page auth rules** | Public route exceptions + visibility logic in `proxy.ts` and watch page |

### Polish & infra

| # | Task | Notes |
|---|------|-------|
| 14 | **VideoCard improvements** | Thumbnails, status badges, links to watch/edit |
| 15 | **Tests & CI** | None yet |
| 16 | **Production B2 config** | Env, bucket policies, error handling beyond dev script |

### Suggested web build order

| Step | Task | Depends on |
|------|------|------------|
| 1 | Migrations | — |
| 2 | Video CRUD + folder assignment | Migrations |
| 3 | B2 signed playback URLs | Migrations |
| 4 | Watch page + visibility + `proxy.ts` | Step 3 |
| 5 | Share link UX | Step 4 |
| 6 | Comments + notification polish | Step 4 |

---

## Remaining — desktop & API

Phase A (local capture shell) is done. Still required for the full Knot loop:

| Task | Notes |
|------|-------|
| **Desktop auth** | Clerk session token stored in OS keychain |
| **API routes** | `POST /api/videos`, `/upload-url`, `/segments`, `PATCH /api/videos/:id` |
| **Chunked upload during recording** | Presigned PUT → B2 → register segment while capturing |
| **B2 upload API** | Server-side presigned URL generation |
| **Share link on record** | Show/copy link once chunk 0 uploads |
| **Packaging** | Windows/macOS installers, auto-update |

---

## Auth — web done vs. remaining

**Done (web):**
- `ClerkProvider` in root layout
- Sign-in / sign-up pages
- `apps/web/proxy.ts` — correct file for **Next.js 16** (replaces old `middleware.ts`); protects `/dashboard/**` and `/api/**`
- `currentUser()` checks in folder server actions
- `UserButton` in dashboard
- Post-login redirect to `/dashboard`

**Remaining (web):**
- Public routes in `proxy.ts` for `/watch/:id` (and later `/r/[slug]`)
- Visibility checks on watch page (`PUBLIC` / `AUTHENTICATED` / `PRIVATE`)

**Desktop only (later):**
- Bearer token verification on API routes

---

## Key files

| Path | State |
|------|-------|
| `apps/web/db/schema.ts` | Complete schema |
| `apps/web/drizzle/` | Empty — migrations not generated |
| `apps/web/server-actions/folder.ts` | Full CRUD + `getFolderById` |
| `apps/web/server-actions/video.ts` | List only |
| `apps/web/server-actions/notification.ts` | List only |
| `apps/web/server-actions/b2.ts` | Dev test script |
| `apps/web/proxy.ts` | Clerk route protection (Next.js 16 — correct filename) |
| `apps/web/app/dashboard/_components/` | Folder UI (card, row, actions, view toggle, breadcrumb), video row, dashboard sections + sidebar |
| `apps/web/app/dashboard/folders/page.tsx` | Root folders list |
| `apps/web/app/dashboard/folder/[id]/page.tsx` | Folder detail (subfolders, videos read-only) |
| `apps/web/app/dashboard/videos/page.tsx` | List only |
| `apps/web/app/dashboard/notifications/page.tsx` | List + empty state |
| `apps/web/app/dashboard/page.tsx` | Recent folders + videos with grid/list toggle |
| `apps/desktop/` | Phase A recorder (local chunks, tray, overlay) |
| `apps/web/app/watch/` | Not started |
