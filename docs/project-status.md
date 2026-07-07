# Project Status

Where [Knot](../README.md) stands today (July 2026) vs. the [target architecture](./architecture.md).

## At a glance

| Area | Status |
|------|--------|
| Monorepo + web scaffold | Done |
| Marketing / landing site | Done |
| Auth (Clerk) — web | Mostly done |
| Dashboard shell + sidebar | Mostly done |
| Folders (CRUD + UI) | Done |
| Videos (metadata) | Partial |
| B2 storage | Prototype only |
| API routes (desktop) | Not started |
| Record / upload / playback | Not started |
| Share links & watch page | Not started |
| Desktop (Electron) app | Not started |
| Comments & notifications | Schema only |

---

## Done

- **Tooling** — pnpm + Turborepo, shared ESLint/TS config packages, Prettier, TS 5.9.
- **Web foundation** — Next.js 16 App Router, React 19, Tailwind v4, shadcn/ui, Drizzle + Neon client, env template.
- **Database schema** — `folders`, `videos`, `video_segments`, `comments`, `notifications` + enums (`db/schema.ts`).
- **Marketing site** — landing page (Hero, Features, Use Cases, Pricing, Footer) + navbar.
- **Auth (web)** — Clerk provider, sign-in/sign-up pages, `proxy.ts` route protection (Next.js 16), `currentUser()` guards in folder server actions.
- **Dashboard** — layout, icon-collapsible sidebar with active-route highlight, Clerk `UserButton`.
- **Folders** — full CRUD, nested folders, duplicate-name validation, root list page, detail page (`/dashboard/folder/:id`), breadcrumbs, grid/list view toggle, folder cards + rows, 3-dot actions menu, real video counts, recursive delete.
- **Videos (metadata)** — `getAllUserVideos`, videos list page (read-only).
- **B2 (prototype)** — standalone upload test script (`server-actions/b2.ts`).

---

## Known gaps (fix before core product)

| Gap | Why it matters |
|-----|----------------|
| Post-login redirect goes to `/` not `/dashboard` | Users land on marketing page after sign-in instead of the app |
| `video.ts` missing `"use server"` | Inconsistent with `folder.ts`; should be fixed when adding video CRUD |
| No video create/edit/delete | Only list exists; no UI or server actions for mutations |
| Videos not assignable to folders | `folderId` in schema but not used in app code |
| `/dashboard/settings`, `/dashboard/notifications` | Notifications page still missing |
| No Drizzle migrations committed | Schema defined but `drizzle/` is empty |
| Duplicate `getAllUserFolders` in `video.ts` | Dead code; folders logic lives in `folder.ts` |

## Auth — web done vs. remaining

**Done (web):**
- `ClerkProvider` in root layout
- Sign-in / sign-up pages
- `apps/web/proxy.ts` — correct file for **Next.js 16** (replaces old `middleware.ts`); protects `/dashboard/**` and `/api/**`
- `currentUser()` checks in folder server actions
- `UserButton` in dashboard

**Can do now (no desktop needed):**
1. Redirect to `/dashboard` after sign-in/sign-up (env vars)
2. ~~Build `/dashboard/settings`~~ — done (`UserProfile` at `/dashboard/settings`)
3. Add `"use server"` to `video.ts` and use `currentUser()` consistently when video CRUD is built
4. Plan public routes in `proxy.ts` for future `/watch/:id` (PUBLIC videos)

**Later (needs other features):**
- Desktop Clerk session + bearer tokens on API routes
- Visibility checks on watch page (`PUBLIC` / `AUTHENTICATED` / `PRIVATE`)

---

## Not started (the core product)

These are the Loom-style features described in [architecture.md](./architecture.md). Nothing here blocks folder work — folders are done; the recording → upload → watch loop is what's left.

- **Desktop app** — Electron scaffold, screen/webcam capture, screenshots.
- **Chunked upload during recording** — `MediaRecorder` timeslice → presigned PUT → segment registration while capture runs.
- **API routes** — `POST /api/videos`, `/upload-url`, `/segments`, `PATCH /api/videos/:id`.
- **Progressive playback** — watch page with MSE/HLS; playable while `status` is `RECORDING`.
- **Share links** — copy-link UX, public/authenticated routes, short slugs.
- **Social** — comments and notifications UI (schema exists).
- **Infra** — CI/CD, tests, desktop packaging, production B2 config.

---

## Suggested build order

Ordered by dependency — each step unlocks the next.

| # | Task | Rationale |
|---|------|-----------|
| 1 | **Database** — generate + run Drizzle migrations | Everything else assumes tables exist in Postgres |
| 2 | **Auth polish** — post-login redirect to `/dashboard` | Small UX win; settings page done |
| 3 | **Video metadata CRUD** — create/edit/delete actions + UI, assign `folderId` | Completes the dashboard before recording exists |
| 4 | **Upload API** — presigned B2 URL route + segment registration | Backend piece the desktop app needs |
| 5 | **Watch page** — progressive playback + visibility checks | Add `/watch/:id` to public routes in `proxy.ts` where appropriate |
| 6 | **Share links** — copy-link UX, public/authenticated access | Depends on watch page |
| 7 | **Desktop app** — Electron capture + chunked upload client | Needs API from step 4; desktop Clerk auth |
| 8 | **Polish** — dashboard home, comments, notifications | UX after core loop works |

**Removed from old list:** "wire `CreateVideo`" — that component doesn't exist in the repo. Step 3 replaces it with building video CRUD from scratch.

**Moved up:** Video metadata CRUD before upload API — you can build and test folder + video organization in the dashboard without B2 integration.

---

## Key files

| Path | State |
|------|-------|
| `apps/web/db/schema.ts` | Complete schema |
| `apps/web/server-actions/folder.ts` | Full CRUD + `getFolderById` |
| `apps/web/server-actions/video.ts` | List only (+ unused folder list duplicate) |
| `apps/web/server-actions/b2.ts` | Dev test script |
| `apps/web/proxy.ts` | Clerk route protection (Next.js 16 — correct filename) |
| `apps/web/app/dashboard/_components/` | Folder UI (card, row, actions, view toggle, breadcrumb) + sidebar |
| `apps/web/app/dashboard/folders/page.tsx` | Root folders list |
| `apps/web/app/dashboard/folder/[id]/page.tsx` | Folder detail (subfolders, videos, timestamps) |
| `apps/web/app/dashboard/videos/page.tsx` | List only |
| `apps/web/app/dashboard/page.tsx` | Empty shell |
