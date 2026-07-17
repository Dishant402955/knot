# Knot documentation

**Start here** if you are coming back to the project after a break, or setting it up on a new machine.

These docs are written for **humans** — step-by-step, with reasons, not just command dumps.

| Doc | When to read it |
|-----|-----------------|
| [Getting started](./getting-started.md) | First-time setup (web + desktop + Clerk + DB + B2) |
| [Environment variables](./environment.md) | What each `.env` key means and where it is used |
| [Codebase map](./codebase-map.md) | “Where do I change X?” — folders and key files |
| [Operations](./operations.md) | Migrations, deploy, packaging, troubleshooting |
| [Architecture](./architecture.md) | How the system is designed (deep dive) |
| [Project status](./project-status.md) | What is done, what is left, intentional decisions |
| [B2 production](./b2-production.md) | Production bucket, CORS, assert checklist |
| [Desktop app](../apps/desktop/README.md) | Recorder features, auth, packaging details |
| [Desktop packaging assets](../apps/desktop/packaging/README.md) | Icons, signing, notarization env |

## What Knot is (one paragraph)

Knot is a Loom-style product: an **Electron desktop recorder** captures screen/window/region into ~5s WebM chunks, uploads them **through** the **Next.js web API** to **Backblaze B2**, and the **web app** lets people watch (progressively while still recording), organize videos in folders, comment with `@mentions`, and share via link / short link / embed.

## Mental model

```
You (desktop)  →  Next.js API  →  Postgres (metadata) + B2 (media)
Viewer (browser)  ←  Next.js (visibility check + signed URLs)  ←  B2
```

Desktop **never** talks to B2 directly. That is deliberate (corporate firewalls, secrets stay on the server).

## Quick links for “I just want to run it”

1. [Getting started](./getting-started.md)
2. Copy env templates: `apps/web/example.env`, `apps/desktop/example.env`
3. `pnpm install` → `pnpm --filter web db:migrate` → `pnpm --filter web dev` → `pnpm --filter desktop dev`
