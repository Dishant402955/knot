# Knot

**Record. Share. Done.**

Knot is an open-source, Loom-style async video platform. Record your screen from a desktop app, upload chunks to the cloud while you record, and share a link that viewers can start watching immediately — built for teams, demos, feedback, and async communication.

## Features

### Capture (Desktop)

- **Screen recording** — full screen, window, or region
- **Screenshots** — quick static captures with the same picker
- **Webcam overlay** — optional picture-in-picture preview with adjustable size and shape (circle, square, rectangle)
- **Instant cloud preview** — video chunks upload to the cloud during recording; viewers can start watching from the share link while the rest finishes uploading in the background

### Organize (Web Dashboard)

- **Video library** — browse and manage all recordings
- **Folders** — nested folders to keep videos organized
- **Visibility controls** — set each video to private, public, or authenticated-only

### Share & Watch

- **Share links** — copy a single link and send it to anyone
- **Public links** — no login required for open sharing
- **Authenticated links** — restrict viewing to signed-in users
- **Private videos** — owner-only access

### Planned

- Timestamped comments on videos
- In-app notifications (recording ready, shares, mentions)
- Embed codes for external sites

## Tech Stack

| Layer | Technology |
|-------|------------|
| Web | Next.js, TypeScript, Tailwind CSS, shadcn/ui |
| Desktop | Electron.js |
| Auth | Clerk |
| Database | PostgreSQL (Drizzle ORM) |
| Media storage | Backblaze B2 (via Next.js API upload) |

## Architecture (short)

Clerk handles authentication for both web and desktop. PostgreSQL stores metadata (videos, folders, segments). While recording, the desktop app uploads each chunk to Next.js (`PUT /api/videos/:id/segments/:index`), and the API writes to B2. The web app serves progressive playback via signed B2 URLs after checking visibility rules — viewers can watch from the cloud before the recording has fully finished uploading.

```
Desktop ──PUT chunk bytes──▶ Next.js API ──▶ PostgreSQL
   │                              │
   │                              └── PutObject ──▶ Backblaze B2
   │                                                    │
Web viewer ◀── progressive signed URLs ─── Next.js API ┘
```
Full details: [docs/architecture.md](./docs/architecture.md)

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](./docs/architecture.md) | Full technical design — system, the instant-cloud-preview loop, web & desktop apps, storage, auth & sharing, and data model |
| [Project Status](./docs/project-status.md) | What's done vs. what remains, and the build order |

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm 9
- PostgreSQL database (e.g. [Neon](https://neon.tech))
- [Clerk](https://clerk.com) application
- [Backblaze B2](https://www.backblaze.com/b2/cloud-storage.html) bucket (for media uploads)

### Setup

```bash
# Install dependencies
pnpm install

# Configure environment
cp apps/web/example.env apps/web/.env.local
# Fill in Clerk keys, DATABASE_URL, and B2 credentials

# Apply database migrations
pnpm --filter web db:migrate

# Start development server
pnpm dev
```

The web app runs at [http://localhost:3000](http://localhost:3000).

### Monorepo structure

```
knot/
├── apps/
│   ├── web/          # Next.js web app (dashboard + API)
│   └── desktop/      # Electron recorder (local capture + chunks)
├── packages/         # Shared ESLint & TypeScript configs
└── docs/             # Architecture & design documentation
```

```bash
# Web
pnpm --filter web dev

# Desktop recorder
pnpm --filter desktop dev
# or: pnpm dev:desktop
```

Desktop records locally (independently playable ~5s WebM chunks), supports Clerk sign-in, and uploads to the web API while recording when signed in. Packaging: see [Desktop README § Packaging](./apps/desktop/README.md#packaging-installers). Status: [Project Status](./docs/project-status.md).

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](./LICENSE).
