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
| Videos (metadata + polish) | Done (CRUD, badges, thumbnails when key set, empty states) |
| B2 storage | Done (signed GET + PUT) |
| Watch page & playback | Done (progressive WebM + comments + copy link) |
| Share links | Done (desktop on record + dashboard/watch copy) |
| Comments & notifications | Done (watch comments; mark read; create on events) |
| API routes (desktop) | Done (`POST /api/videos`, `PUT .../segments/:index`, PATCH) |
| Desktop (Electron) app | Done (local capture + Clerk + live upload via API) |
| Database migrations | Done (idempotent baseline) |
| Dashboard nav performance | Done (`loading.tsx`, router staleTimes, lazy dialogs) |
| Desktop packaging tooling | Done (`electron-builder` → `release/`) |

---

## Done

- **Tooling** — pnpm + Turborepo, shared ESLint/TS config packages, Prettier, TS 5.9.
- **Web foundation** — Next.js 16 App Router, React 19, Tailwind v4, shadcn/ui, Drizzle + Neon client, env template.
- **Database schema + migrations** — `folders`, `videos`, `video_segments`, `comments`, `notifications` + enums; `pnpm db:migrate` / `db:check`.
- **Marketing site** — landing page (Hero, Features, Use Cases, Pricing, Footer) + navbar.
- **Auth (web)** — Clerk provider, sign-in/sign-up pages, `proxy.ts` route protection (Next.js 16), `currentUser()` guards, post-login redirect to `/dashboard`.
- **Dashboard** — sidebar, folders/videos CRUD, soft-nav loading, unread notification badge.
- **Videos polish** — status/visibility badges, thumbnail slot (signed URL when `thumbnailKey` set), richer empty states + create CTAs.
- **Share links** — **Copy share link** in video actions menu; **Copy link** on watch page; desktop share URL while recording.
- **Watch page** — visibility-aware progressive player; comments (post / delete / optional timestamp); toast feedback.
- **Comments** — `server-actions/comment.ts`; creates `COMMENT` notification for the video owner.
- **Notifications** — list with mark-one / mark-all read; links to `/watch/:id`; `RECORDING_READY` on API `PATCH` → READY; sidebar unread count.
- **B2 helper** — signed download + server `PutObject`; `thumbnailStorageKey` helper ready for poster uploads.
- **Desktop API** — create session, segment PUT, PATCH status + CORS for `knot://app`.
- **Desktop** — capture + Clerk + live upload via Next.js; packaging via `electron-builder`.

---

## Remaining — web app

| # | Task | Notes |
|---|------|-------|
| 1 | **Thumbnail generation** | Cards show placeholders until something uploads `thumbnailKey` (desktop/API) |
| 2 | **Production B2 config** | Env, bucket policies for real deploy |
| 3 | **Short links** (`/r/[slug]`) | Optional later |
| 4 | **@mentions** | Schema has `MENTION` type; not wired in comment UI yet |
| 5 | **Real-time notifications** | Optional (polling / push later) |

---

## Remaining — desktop & packaging

| Task | Notes |
|------|-------|
| **Icons / branding** | Add `packaging/icon.png` (≥512×512) |
| **Code signing + notarization** | Windows Authenticode / Apple notarize for public installs |
| **Auto-update** | `electron-updater` + GitHub Releases (not wired yet) |
| **B2 reachability for local API** | If local API cannot reach B2 (e.g. Cisco Umbrella), point `KNOT_WEB_APP_URL` at a cloud-hosted web API, or allowlist `*.backblazeb2.com` |
| **Bake production API URL** | Set `KNOT_WEB_APP_URL` before `package:*` (compile-time) |

See `apps/desktop/README.md` for recording, auth, upload, and packaging.

---

## Auth — web done vs. remaining

**Done (web):**
- `ClerkProvider` in root layout
- Sign-in / sign-up pages
- `apps/web/proxy.ts` — Next.js 16; protects `/dashboard/**` and `/api/**`
- `currentUser()` checks in server actions
- `UserButton` in dashboard
- Post-login redirect to `/dashboard`
- Watch visibility rules + authenticated comments

**Remaining (web):**
- Short links (`/r/[slug]`) later

**Desktop (done):**
- `@clerk/electron` bridge, OS keychain token storage
- Native OAuth `knot://app/`
- Offline continue without sign-in
- Live upload with bearer token

**Desktop only (later):**
- Code signing, branded icons, auto-update
- Production `KNOT_WEB_APP_URL` baked into packaged builds

---

## Key files

| Path | State |
|------|-------|
| `apps/web/db/schema.ts` | Complete schema |
| `apps/web/server-actions/folder.ts` | Full CRUD + `getFolderById` |
| `apps/web/server-actions/video.ts` | Full CRUD + watch + thumbnails helper |
| `apps/web/server-actions/comment.ts` | List / create / delete |
| `apps/web/server-actions/notification.ts` | List / unread / mark read / create |
| `apps/web/lib/b2.ts` | Signed B2 GET + PutObject |
| `apps/web/lib/share.ts` | Client watch share URL |
| `apps/web/proxy.ts` | Clerk protection; `/watch` public |
| `apps/web/app/watch/[videoId]/` | Player + comments + copy link |
| `apps/web/app/dashboard/videos/page.tsx` | List + polish |
| `apps/web/app/dashboard/notifications/page.tsx` | Interactive list |
| `apps/desktop/` | Recorder + packaging |
