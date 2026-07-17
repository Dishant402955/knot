# Project Status

Where [Knot](../README.md) stands today (July 2026) vs. the [target architecture](./architecture.md).

## At a glance

| Area | Status |
|------|--------|
| Monorepo + web + desktop product | Done |
| Visibility / share / short links / embed | Done |
| Thumbnails + comments + @mentions (incl. autocomplete) | Done |
| Notifications (COMMENT / MENTION / RECORDING_READY / VIDEO_SHARED) | Done |
| Desktop packaging, icon, signing hooks, auto-update | Done |
| Production B2 / env checklists | Done |

## Remaining

**Nothing required for the core product loop.** Optional future ideas only:

| Idea | Notes |
|------|-------|
| Restrict embed `frame-ancestors` | Today embeds allow any parent (`frame-ancestors *`); lock to allowlisted domains later if needed |
| View counts / analytics | Mentioned as future in architecture |
| Desktop visibility picker | Recordings default PUBLIC; UI to choose PRIVATE/AUTHENTICATED on record |

Operational (deploy, not code): host web with production B2 + https URL, bake `KNOT_WEB_APP_URL` into desktop `.env.production`, set signing / Apple / `GH_TOKEN` when publishing.

## Recent polish

- **Embed** — `/embed/[videoId]` (PUBLIC only) + Copy embed on watch/dashboard
- **VIDEO_SHARED** — fires when visibility becomes Public; label “Your video is now public”
- **Mention autocomplete** — type `@` in comments (Clerk search; private videos → owner only)
