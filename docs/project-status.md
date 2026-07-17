# Project Status

Where [Knot](../README.md) stands today (July 2026) vs. the [target architecture](./architecture.md).

## At a glance

| Area | Status |
|------|--------|
| Monorepo + web scaffold | Done |
| Marketing / landing site | Done |
| Auth (Clerk) — web + desktop | Done |
| Dashboard (folders / videos / nav) | Done |
| Visibility PRIVATE / PUBLIC / AUTHENTICATED | Done |
| B2 storage + progressive watch | Done |
| Share links (UUID + `/r/{slug}`) | Done |
| Thumbnails | Done |
| Comments + @mentions | Done |
| Notifications (read + events) | Done |
| Desktop recorder + live upload | Done |
| Database migrations | Done |
| Production B2 / env checklist | Done (`docs/b2-production.md`, `assert:production`) |
| Desktop packaging + icon | Done |
| Code signing / notarization wiring | Done (env-driven) |
| Auto-update (GitHub Releases) | Done (`electron-updater`) |

---

## Remaining (optional product polish)

| Task | Notes |
|------|-------|
| **Embed codes** | Watch-page / share embed snippet for external sites |
| **`VIDEO_SHARED` notifications** | Enum exists; not emitted on visibility changes yet |
| **Mention autocomplete** | Plain `@username` works; typeahead UI would be nicer |

Operational notes (not product gaps): deploy web with production B2 + https `NEXT_PUBLIC_APP_URL`, bake the same origin into `apps/desktop/.env.production` before `package:*` / `release:*`, and set signing / Apple / `GH_TOKEN` secrets when publishing public builds.

---

## Key references

| Path | Role |
|------|------|
| [docs/b2-production.md](./b2-production.md) | Bucket, CORS, env, smoke checks |
| `apps/web/scripts/assert-production-env.ts` | `pnpm --filter web assert:production` |
| `apps/desktop/example.env.production` | Bake `KNOT_WEB_APP_URL` for installers |
| `apps/desktop/packaging/icon.png` | App / installer icon |
| `apps/desktop/packaging/notarize.cjs` | macOS notarization hook |
| `apps/desktop/src/main/updater.ts` | Auto-update |
| `apps/desktop/README.md` | Packaging + release commands |
