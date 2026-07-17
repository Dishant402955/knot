# Getting started (local development)

Follow this in order on a fresh machine. Commands assume the **repo root** (`knot/`).

## What you need beforehand

| Requirement | Notes |
|-------------|--------|
| **Node.js** 18+ | LTS is fine |
| **pnpm** 9 | `corepack enable` then `corepack prepare pnpm@9 --activate`, or install pnpm yourself |
| **PostgreSQL** | Neon free tier works; any Postgres URL is fine |
| **Clerk** account | One application shared by web + desktop |
| **Backblaze B2** | Private bucket + application key (not required only if you skip cloud upload) |

Optional later: Vercel (or similar) for web hosting; code-signing certs for desktop installers.

---

## 1. Clone and install

```bash
cd knot
pnpm install
```

---

## 2. Create a Clerk application

1. Open [Clerk Dashboard](https://dashboard.clerk.com) → create an application.
2. Copy **Publishable key** and **Secret key**.
3. Under **User & authentication**:
   - Enable email (or whatever you use for web sign-in).
   - Enable **Usernames** if you want `@mention` autocomplete to resolve (recommended).
4. Under **Native applications** (needed for desktop OAuth / Google / GitHub):
   - Enable **Native API**.
   - Add allowed redirect URL exactly: `knot://app/` (trailing slash matters).
5. Enable Google / GitHub social connections if you want those buttons on desktop (same as web).

You do **not** add `knot://` inside Google’s or GitHub’s developer consoles — Clerk’s hosted callback handles that, then deep-links into the desktop app.

---

## 3. Create the database

1. Create a Neon (or other) Postgres database.
2. Copy the connection string (`DATABASE_URL`). Prefer a string with `sslmode=require` for Neon.

---

## 4. Create a Backblaze B2 bucket

1. Create a **private** bucket (example name: `knot-media-dev`).
2. Create an **application key** limited to that bucket (read + write). Prefer this over the master key.
3. Note:
   - Key ID
   - Application key (shown once)
   - Bucket name
   - S3 endpoint for your region (e.g. `https://s3.us-east-005.backblazeb2.com`)
   - Region id (e.g. `us-east-005`)

For local playback CORS, allow your web origin (`http://localhost:3000`) and `knot://app` — see [b2-production.md](./b2-production.md) § CORS (same idea for local).

---

## 5. Configure the web app env

```bash
cp apps/web/example.env apps/web/.env.local
```

Open `apps/web/.env.local` and fill in at least:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- `B2_KEY_ID`, `B2_APPLICATION_KEY`, `B2_BUCKET`, `B2_ENDPOINT`, `B2_REGION`

Leave the Clerk path vars as in the example unless you renamed routes.

Full meanings: [environment.md](./environment.md).

---

## 6. Apply database migrations

```bash
pnpm --filter web db:migrate
```

Sanity check (lists tables / row counts):

```bash
pnpm --filter web db:check
```

If something looks wrong, **do not** drop the Neon database casually — migrations are meant to be additive. See [operations.md](./operations.md).

---

## 7. Start the web app

```bash
pnpm --filter web dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in, open the dashboard, confirm you can create a folder.

---

## 8. Configure and start the desktop app

Desktop can reuse Clerk keys from `apps/web/.env` / `.env.local` automatically. You still need the web API URL:

```bash
cp apps/desktop/example.env apps/desktop/.env
```

Set:

- Same `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` as web (or rely on web `.env` merge)
- `KNOT_WEB_APP_URL=http://localhost:3000`

Then:

```bash
pnpm --filter desktop dev
```

**Important:** The desktop UI loads as `knot://app`, not `http://localhost`. That is required for Clerk Electron. Vite still runs locally; the app proxies through the custom protocol.

---

## 9. Smoke-test the full loop

1. Sign in inside the desktop app (same Clerk users as web).
2. Record a short clip (a few seconds is enough).
3. Confirm a share / watch URL appears after the cloud session starts.
4. Open that URL in the browser (or an incognito window for PUBLIC videos).
5. Confirm progressive playback and that a thumbnail appears on the dashboard after chunk 0.

If upload fails with a B2 / network error while the UI otherwise works: your **API machine** may be blocked from reaching B2 (e.g. Cisco Umbrella). Deploy web somewhere that can reach B2, or allowlist `*.backblazeb2.com` for that host. Desktop does not need B2 allowlisted.

---

## Common first-day mistakes

| Mistake | What happens | Fix |
|---------|--------------|-----|
| Web not running | Desktop cannot create videos / upload | Start `pnpm --filter web dev` |
| Wrong `KNOT_WEB_APP_URL` | Auth or upload hits the wrong host | Must match the running Next app |
| Forgot `db:migrate` | Dashboard / API crashes on missing tables | Run migrate |
| Clerk Native redirect missing `knot://app/` | Google/GitHub OAuth fails on desktop | Add exact URL in Clerk Native apps |
| Usernames disabled in Clerk | `@mentions` rarely resolve | Enable usernames |
| Using master B2 key in prod later | Security risk | Use bucket-scoped app key |

---

## Next reading

- Day-to-day commands and deploy: [operations.md](./operations.md)
- “Where is the code for …?”: [codebase-map.md](./codebase-map.md)
- Design deep dive: [architecture.md](./architecture.md)
