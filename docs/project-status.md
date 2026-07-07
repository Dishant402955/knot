# Project Status

Where the [Knot](../README.md) codebase stands today (July 2026) vs. the [target architecture](./architecture.md).

## At a glance

| Area | Status |
|------|--------|
| Monorepo + web scaffold | Done |
| Marketing / landing site | Done |
| Auth (Clerk) | Partial |
| Dashboard shell | Partial |
| Folders (CRUD) | Mostly done |
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
- **Web foundation** — Next.js 16 App Router, React 19, Tailwind v4, ~35 shadcn/ui components, Drizzle + Neon client, env template.
- **Database schema** — `folders`, `videos`, `video_segments`, `comments`, `notifications` + enums (defined in `db/schema.ts`).
- **Marketing site** — landing page (Hero, Features, Use Cases, Pricing, Footer) + navbar.
- **Auth** — Clerk provider, sign-in/sign-up pages, `currentUser()` guards in server actions.
- **Dashboard** — layout with sidebar nav and Clerk `UserButton`.
- **Folders** — full CRUD server actions, nested folders, folder page + dialogs.
- **Videos (metadata)** — `createVideo` / `getAllUserVideos`, videos list page, `CreateVideo` dialog component.
- **B2 (prototype)** — standalone upload test script.

---

## Known gaps to fix

- `proxy.ts` must be renamed to **`middleware.ts`** or route protection never runs.
- `CreateVideo` imports `@/components/ui/form` — **`form.tsx` is missing**; component isn't wired to any page.
- `videoCount` is hardcoded to `0` in `getAllUserFolders`.
- Folder detail page `/dashboard/folder/:id` is linked but **doesn't exist**; `revalidatePath` uses the wrong path.
- Missing pages: `/dashboard/settings`, `/dashboard/notifications`, `/demo`.
- No Drizzle migrations committed yet.
- Shared config packages aren't consumed by `apps/web`.

---

## Not started (the core product)

- **Desktop app** — Electron scaffold, screen/webcam capture, screenshots.
- **Chunked upload during recording** — `MediaRecorder` timeslice → presigned PUT → segment registration.
- **API routes** — `POST /api/videos`, `/upload-url`, `/segments`, `PATCH /api/videos/:id`.
- **Progressive playback** — watch page with MSE/HLS, playable while `RECORDING`.
- **Share links** — copy-link UX, public/authenticated routes, short slugs.
- **Social** — comments and notifications UI (schema exists).
- **Infra** — CI/CD, tests, desktop packaging, production B2 config.

---

## Suggested build order

1. **Fix foundations** — rename `proxy.ts` → `middleware.ts`, add `form.tsx`, wire `CreateVideo`.
2. **Database** — generate + run Drizzle migrations.
3. **Upload API** — presigned URL route + segment registration.
4. **Chunked capture** — desktop (or web) recorder that uploads during recording.
5. **Watch page** — progressive playback + visibility checks.
6. **Share links** — copy-link UX, public/authenticated access.
7. **Desktop app** — full Electron capture client.
8. **Polish** — comments, notifications, folder detail, dashboard home.

---

## Key files

| Path | State |
|------|-------|
| `apps/web/db/schema.ts` | Complete schema |
| `apps/web/server-actions/folder.ts` | Working CRUD |
| `apps/web/server-actions/video.ts` | Create + list only |
| `apps/web/server-actions/b2.ts` | Dev test script |
| `apps/web/proxy.ts` | Needs rename to `middleware.ts` |
| `apps/web/app/dashboard/_components/create-video.tsx` | Built but unwired |
| `apps/web/app/dashboard/folders/page.tsx` | Working |
| `apps/web/app/dashboard/videos/page.tsx` | List only |
| `apps/web/app/dashboard/page.tsx` | Empty shell |
