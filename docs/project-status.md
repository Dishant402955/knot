# Project Status

Where [Knot](../README.md) stands today (July 2026) vs. the [target architecture](./architecture.md).

## At a glance

| Area | Status |
|------|--------|
| Monorepo + web scaffold | Done |
| Marketing / landing site | Done |
| Auth (Clerk) — web + desktop | Done |
| Dashboard (folders / videos / nav) | Done |
| Visibility PRIVATE / PUBLIC / AUTHENTICATED | Done (enforced on watch + comments; copy UX hints) |
| B2 storage + progressive watch | Done |
| Share links (UUID + `/r/{slug}`) | Done |
| Thumbnails | Done (desktop canvas → `PUT .../thumbnail`) |
| Comments + @mentions | Done |
| Notifications (read + events) | Done |
| Desktop recorder + live upload | Done |
| Database migrations | Done |
| Desktop packaging tooling | Done (`electron-builder`) |

---

## Done (highlights)

- **Visibility** — `getVideoForWatch` + comments gate `PRIVATE` (404), `AUTHENTICATED` (sign-in), `PUBLIC` (open). Dashboard create defaults `PRIVATE`; desktop sessions default `PUBLIC`. Copy-link toasts explain who can view.
- **Short links** — `videos.shareSlug`; `/r/[slug]` redirects to `/watch/[id]`; share helpers prefer `/r/{slug}`.
- **Thumbnails** — `PUT /api/videos/:id/thumbnail`; desktop uploads JPEG from live canvas after chunk 0; cards show signed URL or placeholder.
- **Comments / mentions** — watch UI; `@username` → Clerk resolve → `MENTION` notifications (respects private videos).
- **Notifications** — mark read, sidebar unread, `COMMENT` / `RECORDING_READY` / `MENTION`.
- **Desktop packaging** — `pnpm --filter desktop package:win` → `apps/desktop/release/`.

---

## Remaining

| Task | Notes |
|------|-------|
| **Production B2 config** | Env / bucket policies for real deploy |
| **Desktop app icon** | `packaging/icon.png` (≥512×512) |
| **Code signing + notarization** | Public installs without SmartScreen / Gatekeeper friction |
| **Auto-update** | `electron-updater` + GitHub Releases |
| **B2 reachability** | Cloud-hosted API or allowlist if local network blocks B2 |
| **Bake production `KNOT_WEB_APP_URL`** | Required before shipping installers (compile-time) |
| **Embed codes** | Optional marketing/product later |
| **`VIDEO_SHARED` events** | Enum exists; not emitted yet (optional) |
| **Mention autocomplete** | Plain `@username` works; typeahead UI optional |

---

## Key files

| Path | Role |
|------|------|
| `apps/web/server-actions/video.ts` | CRUD + watch + visibility |
| `apps/web/server-actions/comment.ts` | Comments + mention notifications |
| `apps/web/app/api/videos/[id]/thumbnail/route.ts` | Poster upload |
| `apps/web/app/r/[slug]/page.tsx` | Short link redirect |
| `apps/web/lib/mentions.ts` / `clerk-users.ts` | Parse + resolve @usernames |
| `apps/desktop/.../capture-recorder.ts` | `captureCanvasJpeg` |
| `apps/desktop/.../recording-upload.ts` | `uploadThumbnail` |
| `apps/desktop/README.md` | Dev + packaging |
