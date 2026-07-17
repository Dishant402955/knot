# Project Status

Where [Knot](../README.md) stands today (July 2026) vs. the [target architecture](./architecture.md).

## At a glance

| Area | Status |
|------|--------|
| Monorepo + web scaffold | Done |
| Marketing / landing site | Done |
| Auth (Clerk) — web | Mostly done |
| Auth (Clerk) — desktop | Done (same Clerk app; `knot://app/` native OAuth) |
| Dashboard shell + sidebar | Done |
| Folders (CRUD + UI) | Done |
| Videos (metadata) | Done (CRUD + folder assignment) |
| B2 storage | Signed GET for playback; upload API still pending |
| Watch page & playback | Done (sequential progressive WebM) |
| Share links | Not started |
| Comments & notifications | Partial (list UI only) |
| API routes (desktop) | Not started |
| Desktop (Electron) app | Phase A+ done (local capture + Clerk) |
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
- **Videos** — create / edit / delete metadata, visibility, folder assignment; dashboard list with grid/list; cards link to `/watch/[id]`.
- **Watch page** — `/watch/[videoId]` with visibility enforcement (`PRIVATE` 404, `PUBLIC` open, `AUTHENTICATED` requires sign-in); sequential progressive playback of independently playable WebM segments via B2 signed GET URLs; polls for new segments while `RECORDING` / `PROCESSING`.
- **B2 helper** — `apps/web/lib/b2.ts` signed download URLs (upload/presign still next).
- **Notifications** — `getAllUserNotifications`, list page with empty state (read-only).
- **Desktop (Phase A+)** — Electron app in `apps/desktop`: source picker (screen/window/region), mic + system audio, webcam overlay (drag/resize, circle/square/rectangle), canvas compositing, independently playable ~5s WebM chunks on disk, countdown gated behind a ready indicator tray, capture prepared during countdown for instant start at 0, pause/resume/stop, screenshots, tray + global shortcuts. Clerk desktop auth (`@clerk/electron`, same keys as web, `knot://app/` OAuth redirect, offline continue).

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
| 2 | ~~Video metadata CRUD~~ | Done |
| 3 | ~~Folder assignment~~ | Done |
| 4 | **Videos page polish** | Thumbnails, richer empty states |
| 5 | ~~Folder detail — videos section~~ | Actions + watch links wired |

### Core product — playback & sharing

| # | Task | Notes |
|---|------|-------|
| 6 | ~~Watch page~~ | Done — sequential progressive player |
| 7 | **B2 upload / productized PUT** | Signed GET done; desktop upload loop still needed |
| 8 | ~~Visibility enforcement~~ | Done on watch loader |
| 9 | ~~`proxy.ts` public `/watch`~~ | Done |
| 10 | **Share links UX** | Copy-link from dashboard |

### Social & notifications

| # | Task | Notes |
|---|------|-------|
| 11 | **Comments** | Schema only — UI + server actions (likely on watch page) |
| 12 | **Notifications polish** | Mark as read; create notifications on events; optional real-time |

### Auth (web remainder)

| # | Task | Notes |
|---|------|-------|
| 13 | ~~Watch-page auth rules~~ | Done in `proxy.ts` + `getVideoForWatch` |

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

Phase A+ (local capture + Clerk sign-in) is done. Still required for the full Knot loop:

| Task | Notes |
|------|-------|
| **API routes** | `POST /api/videos`, `/upload-url`, `/segments`, `PATCH /api/videos/:id` + bearer verification of Clerk tokens |
| **Chunked upload during recording** | Presigned PUT → B2 → register segment while capturing |
| **B2 upload API** | Server-side presigned URL generation (productized beyond `b2.ts` prototype) |
| **Share link on record** | Show/copy link once chunk 0 uploads |
| **Packaging** | Windows/macOS installers, auto-update |

See `apps/desktop/README.md` for local recording + auth setup.

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
- Short links (`/r/[slug]`) later
- Share-link copy UX from dashboard

**Desktop (done for Phase A+):**
- `@clerk/electron` bridge, OS keychain token storage
- Same publishable key / Clerk app as web; UI over `knot://app/`
- Native OAuth redirect `knot://app/` (Google/GitHub via system browser)
- Offline continue without sign-in

**Desktop only (later):**
- Bearer token verification on API routes
- Upload during recording using that token

---

## Key files

| Path | State |
|------|-------|
| `apps/web/db/schema.ts` | Complete schema |
| `apps/web/server-actions/folder.ts` | Full CRUD + `getFolderById` |
| `apps/web/server-actions/video.ts` | Full CRUD + `getVideoForWatch` / poll |
| `apps/web/lib/b2.ts` | Signed B2 GET URLs |
| `apps/web/server-actions/b2.ts` | Manual upload smoke test (`--run`) |
| `apps/web/proxy.ts` | Clerk protection; `/watch` public |
| `apps/web/app/watch/[videoId]/` | Watch page + progressive player |
| `apps/web/app/dashboard/videos/page.tsx` | CRUD list |
| `apps/web/app/dashboard/folder/[id]/page.tsx` | Folder detail (videos + actions) |
| `apps/web/app/dashboard/notifications/page.tsx` | List + empty state |
| `apps/web/app/dashboard/page.tsx` | Recent folders + videos |
| `apps/desktop/` | Phase A+ recorder |
