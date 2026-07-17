# Environment variables

Human reference for every env key Knot cares about. Templates live next to the apps:

| Template | Copy to |
|----------|---------|
| `apps/web/example.env` | `apps/web/.env` or `.env.local` |
| `apps/desktop/example.env` | `apps/desktop/.env` (dev) |
| `apps/desktop/example.env.production` | `apps/desktop/.env.production` (packaging) |

**Never commit real secrets.** Prefer `.env.local` / `.env.production.local` for machine-specific values if you use git.

---

## Web (`apps/web`)

### Clerk

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Browser + middleware auth |
| `CLERK_SECRET_KEY` | Yes | Server-side Clerk API |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Yes (keep default) | Usually `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Yes | Usually `/sign-up` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | Yes | Usually `/dashboard` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | Yes | Usually `/dashboard` |

These path vars must match the routes under `apps/web/app/(auth)/`.

### Database

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | Drizzle runtime + `db:migrate` / `db:check` / `db:studio` |

### Public URLs

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_APP_URL` | Yes | Origin for share links, short links, embed snippets (no trailing slash needed; code strips it) |
| `KNOT_WEB_APP_URL` | Optional | Fallback alias used by some helpers / production assert; set equal to `NEXT_PUBLIC_APP_URL` in production |

Local example: `http://localhost:3000`  
Production example: `https://your-domain.com`

### Backblaze B2

| Variable | Required | Purpose |
|----------|----------|---------|
| `B2_KEY_ID` | Yes for upload/playback | Application key id |
| `B2_APPLICATION_KEY` | Yes | Application key secret |
| `B2_BUCKET` | Yes | Bucket name |
| `B2_ENDPOINT` | Yes | S3-compatible endpoint for your region |
| `B2_REGION` | Yes | Region id matching the endpoint |
| `B2_MASTER_KEY_ID` | No | **Not used by the app.** Local admin only — do not deploy |
| `B2_MASTER_APPLICATION_KEY` | No | Same |

Server helpers: `apps/web/lib/b2.ts`.

| `PAGE_AGENT_API_KEY` | No | Server-only LLM key for in-page UI help ([Page Agent](https://alibaba.github.io/page-agent/)). If unset, Guide heuristics take over. |
| `OPENAI_API_KEY` | No | Fallback when `PAGE_AGENT_API_KEY` is empty |
| `PAGE_AGENT_BASE_URL` | No | OpenAI-compatible API root (default `https://api.openai.com/v1`) |
| `PAGE_AGENT_MODEL` | No | Model id (default `gpt-4o-mini`) |

Never expose the LLM key via `NEXT_PUBLIC_*`. The browser calls `/api/page-agent/*` only; the server proxies to the provider.

### Assert / escape hatches

| Variable | Purpose |
|----------|---------|
| `KNOT_ALLOW_LOCAL_PRODUCTION=1` | Lets `pnpm --filter web assert:production` pass with localhost / non-https (local smoke only) |

---

## Desktop (`apps/desktop`)

In **dev**, Electron loads env from desktop `.env` **and** merges `apps/web/.env` / `.env.local` (desktop wins on conflicts).

In a **packaged installer**, dotenv files from the monorepo are **not** read. Values must be **baked at build time** via `electron-vite build --mode production` (see `.env.production`).

### Always set for desktop

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Same Clerk app as web |
| `KNOT_WEB_APP_URL` | Yes | Base URL of the Next.js API + dashboard |
| Clerk path vars | Same as web | Sign-in / sign-up / redirects |

### Optional desktop aliases

| Variable | Purpose |
|----------|---------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Alias for publishable key (prefer `NEXT_PUBLIC_…`) |
| `VITE_KNOT_API_URL` | Alias for `KNOT_WEB_APP_URL` |
| `VITE_CLERK_FAPI_HOST` | Override Clerk Frontend API host if auto-detect is wrong (e.g. `xxx.clerk.accounts.dev`). **Must be listed in bake keys** — already included for production builds |

### Packaging escape hatch

| Variable | Purpose |
|----------|---------|
| `KNOT_ALLOW_LOCAL_PACKAGE=1` | Allow packaging while `KNOT_WEB_APP_URL` is still localhost |

### Code signing / publish (optional, packaging only)

| Variable | Purpose |
|----------|---------|
| `CSC_LINK` / `CSC_KEY_PASSWORD` | Windows Authenticode |
| `APPLE_ID` / `APPLE_APP_SPECIFIC_PASSWORD` / `APPLE_TEAM_ID` | macOS notarization |
| `GH_TOKEN` or `GITHUB_TOKEN` | Publish installers to GitHub Releases (auto-update) |

Details: [apps/desktop/packaging/README.md](../apps/desktop/packaging/README.md).

---

## Alignment checklist (production)

These three must agree on the **same https origin**:

1. Web: `NEXT_PUBLIC_APP_URL`
2. Web (optional): `KNOT_WEB_APP_URL`
3. Desktop package: `KNOT_WEB_APP_URL` in `.env.production`

Then run:

```bash
pnpm --filter web assert:production
pnpm --filter desktop assert-release-env
```
