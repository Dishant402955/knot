# Codebase map

Use this when you know **what** you want to change but not **where**. Paths are from the repo root.

## Top-level layout

```
knot/
├── apps/web/          Next.js — dashboard, watch, embed, API, DB
├── apps/desktop/      Electron — capture, Clerk, upload client
├── packages/          Shared ESLint / TS configs
└── docs/              Human documentation (you are here)
```

Package manager: **pnpm workspaces**. Task runner: **Turborepo** (`pnpm dev` at root starts what turbo is configured for — prefer explicit `--filter` when working on one app).

---

## Web app (`apps/web`)

### Entry & routing

| Path | Role |
|------|------|
| `app/layout.tsx` | Root layout, Clerk provider, global fonts/CSS |
| `proxy.ts` | Clerk middleware (public vs protected routes). Next 16 uses this instead of classic `middleware.ts` |
| `app/(auth)/` | Sign-in / sign-up pages |
| `app/dashboard/` | Logged-in product UI |
| `app/watch/[videoId]/` | Watch page (player, comments, share) |
| `app/embed/[videoId]/` | Minimal iframe player (PUBLIC only) |
| `app/r/[slug]/` | Short link → access check → redirect to `/watch/:id` |
| `app/api/videos/` | Desktop-facing REST API |

### Watch / playback UI

| Path | Role |
|------|------|
| `app/watch/[videoId]/page.tsx` | Server page: load video + comments, metadata |
| `progressive-player.tsx` | Layout: video, badges, share, comments |
| `use-progressive-playback.ts` | Segment playlist, live poll, seek, retry |
| `use-video-hotkeys.ts` | K/J/L/M/F and friends |
| `comments-section.tsx` | List + post + delete + seek-to-timestamp |
| `mention-textarea.tsx` | `@` autocomplete |
| `video-share-actions.tsx` | Copy link + embed dialog |

### Dashboard UI

| Path | Role |
|------|------|
| `app/dashboard/_components/` | Video cards/rows, folders, badges, notifications list, actions |
| `app/dashboard/videos/` | Library |
| `app/dashboard/folders/` + `folder/[id]/` | Folder tree |
| `app/dashboard/notifications/` | Notification feed |
| `app/dashboard/settings/` | Clerk `UserProfile` |

### Server logic

| Path | Role |
|------|------|
| `server-actions/video.ts` | Dashboard video CRUD + `getVideoForWatch` + poll state |
| `server-actions/comment.ts` | Comments + mention notifications |
| `server-actions/folder.ts` | Folder CRUD |
| `server-actions/notification.ts` | List / mark-read (does **not** export create — forge-safe) |
| `server-actions/users.ts` | Mention search |
| `lib/notifications.ts` | Internal `createNotification` / `VIDEO_SHARED` helper |
| `lib/b2.ts` | S3 client, signed URLs, PutObject, key helpers |
| `lib/api.ts` | CORS for `knot://app`, share URL helpers |
| `lib/api-auth.ts` | `requireApiUserId` for API routes |
| `lib/share.ts` | Client share / embed snippet helpers |
| `lib/clerk-users.ts` | Clerk username resolve + batch author profiles |
| `lib/mentions.ts` | Parse / split `@username` in text |
| `lib/video-insert.ts` | Create video row + unique `shareSlug` |
| `db/schema.ts` | **Source of truth** for tables/enums |
| `drizzle/` | SQL migrations (apply with `db:migrate`) |

### API routes (desktop)

| Method + path | File |
|---------------|------|
| `POST /api/videos` | `app/api/videos/route.ts` |
| `PATCH /api/videos/:id` | `app/api/videos/[id]/route.ts` |
| `PUT /api/videos/:id/segments/:index` | `app/api/videos/[id]/segments/[index]/route.ts` |
| `PUT /api/videos/:id/thumbnail` | `app/api/videos/[id]/thumbnail/route.ts` |
| Legacy upload-url / register-only | Prefer the atomic `PUT …/segments/:index` |

### Config / scripts

| Path | Role |
|------|------|
| `next.config.ts` | Next config; embed `frame-ancestors` CSP |
| `drizzle.config.ts` | Drizzle Kit |
| `scripts/db-migrate.ts` | Apply migrations |
| `scripts/db-check.ts` | Table sanity |
| `scripts/assert-production-env.ts` | Production env gate |
| `example.env` | Env template with comments |

---

## Desktop app (`apps/desktop`)

| Path | Role |
|------|------|
| `src/main/index.ts` | Windows, tray, IPC, capture display helpers |
| `src/main/clerk.ts` | `knot://` protocol, OAuth, CSP, Clerk bridge, env load |
| `src/main/updater.ts` | `electron-updater` |
| `src/preload/index.ts` | `window.knot` bridge |
| `src/shared/types.ts` | IPC channel names + shared types |
| `src/shared/clerk-env.ts` | Read Clerk / API URL from process env |
| `src/renderer/src/windows/control-app.tsx` | Main recorder UI + record/stop/upload orchestration |
| `src/renderer/src/lib/capture-recorder.ts` | MediaRecorder rotation, audio mix, chunks |
| `src/renderer/src/lib/recording-upload.ts` | Create video → enqueue chunks → finalize READY/FAILED |
| `src/renderer/src/lib/api-client.ts` | Bearer fetch + 401 retry |
| `electron.vite.config.ts` | Vite + which env keys get baked into builds |
| `electron-builder.yml` | Installer config |
| `packaging/` | Icon, notarize script, entitlements |
| `scripts/assert-release-env.ts` | Refuse localhost / placeholder packaging |
| `example.env` / `example.env.production` | Dev vs bake templates |

More narrative detail: [apps/desktop/README.md](../apps/desktop/README.md).

---

## “I want to change …”

| Goal | Start here |
|------|------------|
| Watch page layout / UX | `apps/web/app/watch/[videoId]/` |
| Progressive playback bugs | `use-progressive-playback.ts` |
| Visibility rules | `getVideoForWatch` in `server-actions/video.ts` + comments access helper |
| Share / embed copy | `lib/share.ts`, `video-share-actions.tsx` |
| Notification types / copy | `db/schema.ts` enum + `notifications-list.tsx` + `lib/notifications.ts` |
| Chunk upload / READY | Desktop `recording-upload.ts` + web `segments/[index]/route.ts` |
| Capture quality / audio | `capture-recorder.ts` |
| Clerk desktop OAuth | `src/main/clerk.ts` + Clerk Native dashboard |
| Help / Page Agent | `components/page-agent/`, `app/api/page-agent/`, `public/llms.txt` |
| New DB column | Edit `db/schema.ts` → `pnpm --filter web db:generate` → review SQL → `db:migrate` |
| Public route list | `apps/web/proxy.ts` |
| B2 keys / CORS | `lib/b2.ts` + [b2-production.md](./b2-production.md) |

---

## Intentional product decisions (do not “fix” blindly)

1. **Desktop recordings default to `PUBLIC`** so the share link works without forcing every viewer to sign in. Dashboard-created videos default to `PRIVATE`.
2. **Denied access returns 404**, not 403, to avoid leaking that a video id exists.
3. **Short links check access before redirect** so PRIVATE videos do not leak their UUID in a `Location` header.
4. **Embed is PUBLIC-only**; CSP currently allows any parent (`frame-ancestors *`).
5. **`createNotification` is not a client server-action** — only internal `lib/notifications.ts` may create rows.
6. **Packaged desktop env is bake-time only** — editing monorepo `.env` after install does nothing.
