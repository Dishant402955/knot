# Operations

Day-to-day commands, database work, deploy, packaging, and troubleshooting — written for a human operator.

All commands from the **repo root** unless noted.

---

## Development

```bash
pnpm install

# Web only
pnpm --filter web dev

# Desktop only (start web too if you need upload)
pnpm --filter desktop dev

# Typecheck
pnpm --filter web exec tsc --noEmit
pnpm --filter desktop check-types
```

Web: [http://localhost:3000](http://localhost:3000)  
Desktop: loads as `knot://app` (proxied to Vite in dev).

---

## Database (Drizzle)

Schema source of truth: `apps/web/db/schema.ts`  
Migrations folder: `apps/web/drizzle/`

### Apply pending migrations (safe for existing Neon DBs)

```bash
pnpm --filter web db:migrate
```

Baseline `0000_*.sql` is written to be **idempotent** (`IF NOT EXISTS` style guards) so re-applying against a DB that already has tables should not wipe data. Still: take a Neon snapshot before major schema work if the DB has real content.

### After you change `schema.ts`

```bash
pnpm --filter web db:generate   # creates a new SQL file under drizzle/
# Read the generated SQL. Edit only if you know why.
pnpm --filter web db:migrate
pnpm --filter web db:check      # optional sanity
```

### Browse data

```bash
pnpm --filter web db:studio
```

### Do **not**

- Do not casually `DROP` production tables to “reset.”
- Do not delete migration history files that already ran in production without a plan.
- Do not put secrets in migration SQL.

---

## Production web deploy

1. Set production env on the host (Vercel / Node) using [environment.md](./environment.md) and [b2-production.md](./b2-production.md).
2. Use `pk_live_` / `sk_live_` Clerk keys for real users.
3. Set `NEXT_PUBLIC_APP_URL=https://your-domain.com` (https).
4. Configure B2 CORS for that origin + `knot://app`.
5. Ensure the **API host can reach** `*.backblazeb2.com`.
6. Run migrations against the **production** `DATABASE_URL` (from a trusted machine):

   ```bash
   # With production DATABASE_URL in the environment:
   pnpm --filter web db:migrate
   ```

7. Validate env shape:

   ```bash
   pnpm --filter web assert:production
   ```

8. Deploy / build the Next app (`pnpm --filter web build` locally if you want a dry run).

### Escape hatch

`KNOT_ALLOW_LOCAL_PRODUCTION=1` — only for local smoke of the assert script, not for real deploys.

---

## Desktop packaging & release

Full narrative: [apps/desktop/README.md](../apps/desktop/README.md) § Packaging.

Short path:

1. Copy `apps/desktop/example.env.production` → `apps/desktop/.env.production`.
2. Set real `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `KNOT_WEB_APP_URL=https://…` (not placeholders, not localhost).
3. Package:

   ```bash
   pnpm --filter desktop package:win    # or :mac / :linux
   ```

   Installers land under `apps/desktop/release/`.

4. Local-only smoke against localhost:

   ```bash
   KNOT_ALLOW_LOCAL_PACKAGE=1 pnpm --filter desktop package:win
   ```

5. Publish with auto-update:

   ```bash
   # needs GH_TOKEN with release permissions
   pnpm --filter desktop release:win
   ```

**Remember:** env is baked at `build:release` time. Changing `.env` on disk after the installer is built does nothing — rebuild.

Bump `version` in `apps/desktop/package.json` when shipping a new installer people should update to.

---

## Useful product behaviors to remember

| Behavior | Detail |
|----------|--------|
| Live share | Desktop `POST /api/videos` creates `PUBLIC` + `RECORDING`; watch works after chunk 0 |
| Stop | Flushes uploads; marks `READY` if any chunk uploaded, else `FAILED`; UI warns on partial failures |
| Thumbnail | JPEG after successful chunk 0 upload |
| Comments | Signed-in users; timestamps seek across segments; `@` autocomplete |
| Notifications | COMMENT, MENTION, RECORDING_READY, VIDEO_SHARED (became Public) |
| Embed | `/embed/:id`, PUBLIC only, copy iframe from watch/dashboard |
| Short link | `/r/:slug` checks access **before** redirect |

---

## Troubleshooting

### Desktop upload fails / B2 errors

1. Is web running and is `KNOT_WEB_APP_URL` correct?
2. Are B2 vars set on **web**?
3. Can the **API host** reach B2? (Umbrella / firewall) — see [b2-production.md](./b2-production.md).
4. Is the user signed in on desktop? (Bearer token required.)

### Watch page: no video / “Playback unavailable”

1. Visibility: PRIVATE videos 404 for non-owners.
2. AUTHENTICATED videos redirect anonymous users to sign-in.
3. B2 not configured → 503-style message from watch loader.
4. Zero segments yet → empty player (“waiting for first chunk”) while live.

### Embed blank / 404

Video must be **PUBLIC**. AUTHENTICATED / PRIVATE intentionally 404 on `/embed`.

### Clerk desktop OAuth broken

1. Native API enabled?
2. Redirect exactly `knot://app/`?
3. Social providers enabled on the same Clerk application?
4. Publishable key matches web?

### Mentions do nothing

Enable **usernames** in Clerk. Mentions resolve by username via Clerk Backend API.

### Migrations / Drizzle snapshot drift

If `db:generate` wants to re-add something that already exists in SQL (e.g. `share_slug`), compare `db/schema.ts` with `drizzle/*.sql` and `drizzle/meta/*_snapshot.json`. Prefer fixing the snapshot/migration chain carefully over dropping production data.

### Packaged desktop still hits localhost

You baked the wrong URL. Fix `.env.production`, rebuild with `package:*`. Assert script should have blocked placeholders / localhost unless you used `KNOT_ALLOW_LOCAL_PACKAGE=1`.

---

## Script cheat sheet

| Command | App | What it does |
|---------|-----|----------------|
| `pnpm --filter web dev` | web | Next dev server |
| `pnpm --filter web build` | web | Production build |
| `pnpm --filter web db:migrate` | web | Apply SQL migrations |
| `pnpm --filter web db:generate` | web | Generate migration from schema |
| `pnpm --filter web db:check` | web | List tables / counts |
| `pnpm --filter web db:studio` | web | Drizzle Studio |
| `pnpm --filter web assert:production` | web | Env gate for prod |
| `pnpm --filter desktop dev` | desktop | Electron + Vite |
| `pnpm --filter desktop check-types` | desktop | `tsc` |
| `pnpm --filter desktop package:win` | desktop | Windows installer |
| `pnpm --filter desktop release:win` | desktop | Build + publish to GitHub Releases |
