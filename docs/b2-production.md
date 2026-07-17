# Production Backblaze B2 setup for Knot
#
# Upload path today: Desktop → Next.js API → B2 PutObject (server-side).
# Playback path: Next.js issues signed GET URLs → browser/Electron loads from B2.
# The API host must reach *.backblazeb2.com (not blocked by corporate filters).

## 1. Bucket

1. Create a **private** B2 bucket (e.g. `knot-media-prod`).
2. Prefer a dedicated application key scoped to that bucket only (not the master key).
3. Note the S3-compatible endpoint for your region, e.g. `https://s3.us-east-005.backblazeb2.com`.

## 2. Application key capabilities

Minimum capabilities for the app key:

- `listBuckets`, `listFiles`, `readFiles`, `writeFiles`, `deleteFiles` (delete optional if you never purge)

Restrict the key to your production bucket (and optionally a name prefix).

## 3. Env (Vercel / host)

Set on the **web** deployment (never commit secrets):

```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
KNOT_WEB_APP_URL=https://your-domain.com

B2_KEY_ID=...
B2_APPLICATION_KEY=...
B2_BUCKET=knot-media-prod
B2_ENDPOINT=https://s3.us-east-005.backblazeb2.com
B2_REGION=us-east-005

DATABASE_URL=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
```

`NEXT_PUBLIC_APP_URL` drives share links (`/r/{slug}`, `/watch/{id}`).
Desktop packages bake `KNOT_WEB_APP_URL` at build time — point it at this same origin.

Validate locally against a production-like env:

```bash
pnpm --filter web assert:production
```

## 4. Bucket CORS (playback)

Signed GET URLs are loaded as media from the watch page / desktop. Configure CORS on the B2 bucket (B2 console → Bucket settings → CORS rules), for example:

```json
[
  {
    "corsRuleName": "knot-playback",
    "allowedOrigins": [
      "https://your-domain.com",
      "knot://app"
    ],
    "allowedOperations": ["b2_download_file_by_id", "b2_download_file_by_name"],
    "allowedHeaders": ["authorization", "range"],
    "exposeHeaders": ["x-bz-content-sha1", "x-bz-file-id"],
    "maxAgeSeconds": 3600
  }
]
```

Uploads do **not** need client→B2 CORS (bytes go through Next.js).

## 5. Network

If the API runs on a machine where Cisco Umbrella (or similar) blocks B2, uploads fail even when desktop is healthy. Deploy the web API to a host that can reach B2, or allowlist `*.backblazeb2.com`.

## 6. Smoke check

1. Record a short clip from a packaged desktop build pointed at production.
2. Confirm `PUT /api/videos/:id/segments/0` returns 200.
3. Open the share link in a private browser window (PUBLIC video).
4. Confirm dashboard card shows a thumbnail after chunk 0.
