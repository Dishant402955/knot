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
| B2 storage | Done (signed GET + PUT) |
| Watch page & playback | Done (sequential progressive WebM) |
| Share links | Desktop share URL on record; dashboard copy UX still open |
| Comments & notifications | Partial (list UI only) |
| API routes (desktop) | Done (`POST /api/videos`, `PUT .../segments/:index`, PATCH) |
| Desktop (Electron) app | Done (local capture + Clerk + live upload via API) |
| Infra (CI, tests) | Not started |
| Dashboard nav performance | Done (`loading.tsx`, router staleTimes, lazy dialogs) |

---

## Done

- **Tooling** — pnpm + Turborepo, shared ESLint/TS config packages, Prettier, TS 5.9.
- **Web foundation** — Next.js 16 App Router, React 19, Tailwind v4, shadcn/ui, Drizzle + Neon client, env template.
- **Database schema** — `folders`, `videos`, `video_segments`, `comments`, `notifications` + enums (`db/schema.ts`).
- **Marketing site** — landing page (Hero, Features, Use Cases, Pricing, Footer) + navbar.
- **Auth (web)** — Clerk provider, sign-in/sign-up pages, `proxy.ts` route protection (Next.js 16), `currentUser()` guards in folder server actions, post-login redirect to `/dashboard`.
- **Dashboard** — layout with header bar (sidebar trigger + `UserButton`), icon-collapsible sidebar with active-route highlight, home page with recent folders/videos and shared grid/list toggle, notifications list page, settings (`UserProfile`). Soft-nav responsiveness: `app/dashboard/loading.tsx`, `experimental.staleTimes`, edit/delete dialogs loaded on demand (no resting UI redesign).
- **Folders** — full CRUD, nested folders, duplicate-name validation, root list page, detail page (`/dashboard/folder/:id`), breadcrumbs, grid/list view toggle, folder cards + rows, 3-dot actions menu, real video counts, recursive delete.
- **Videos** — create / edit / delete metadata, visibility, folder assignment; dashboard list with grid/list; cards link to `/watch/[id]`.
- **Watch page** — `/watch/[videoId]` with visibility enforcement (`PRIVATE` 404, `PUBLIC` open, `AUTHENTICATED` requires sign-in); sequential progressive playback of independently playable WebM segments via B2 signed GET URLs; polls for new segments while `RECORDING` / `PROCESSING` without restarting the current segment on URL refresh.
- **B2 helper** — `apps/web/lib/b2.ts` signed download + server `PutObject` for segment upload.
- **Desktop API** — `POST /api/videos`, `PUT .../segments/:index` (bytes → B2), legacy upload-url/segments, `PATCH` with status transitions + CORS for `knot://app`.
- **Notifications** — `getAllUserNotifications`, list page with empty state (read-only).
- **Desktop** — Electron capture + Clerk + **live upload via Next.js** (no direct B2 writes from the client). Share `/watch` link while recording; mark `READY`/`FAILED` on stop. Desktop UI aligned to web dark neutral theme.

---

## Remaining — web app

Web-only follow-ups. Desktop live upload + API routes are done (see [architecture](./architecture.md#desktop-api-route-handlers)).

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
| 7 | ~~B2 upload / productized PUT~~ | Done — `PUT /api/videos/:id/segments/:index` (API → B2) |
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
| 16 | **Production B2 config** | Env, bucket policies; playback signed GET |

### Suggested web build order

| Step | Task | Depends on |
|------|------|------------|
| 1 | Migrations | — |
| 2 | Share link UX (dashboard) | Watch page |
| 3 | Comments + notification polish | Watch page |
| 4 | Tests & CI | — |

---

## Remaining — desktop & packaging

Live upload + API routes are done. Still open:

| Task | Notes |
|------|-------|
| **Packaging** | Windows/macOS installers, auto-update |
| **B2 reachability for local API** | On networks that block B2 (e.g. Cisco Umbrella), point desktop at a **cloud-hosted** web API, or allowlist `*.backblazeb2.com` for the API host |

See `apps/desktop/README.md` for local recording + auth + upload setup.

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
