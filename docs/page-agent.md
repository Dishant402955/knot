# In-page UI help (Page Agent)

Knot ships an in-page assistant so users can say things like “open my videos” or “create a folder” and get guided through the UI.

It is based on [Alibaba Page Agent](https://alibaba.github.io/page-agent/) (`page-agent` npm package): a **client-side DOM agent** that reads the page and acts like a user. Knot adds a **server-side LLM proxy** (so API keys never reach the browser) and a **comprehensive heuristics Guide mode** when no LLM key is configured.

## What users see

- Floating **sparkles** button (bottom-right) on **dashboard** and **watch** pages.
- Chat panel with suggested tasks.
- Mode badge:
  - **AI mode (Page Agent)** — when `PAGE_AGENT_API_KEY` or `OPENAI_API_KEY` is set on the web server.
  - **Guide mode (heuristics)** — when no key is set (still useful offline / local).

Embed pages (`/embed/...`) do not show the launcher (minimal chrome).

## Modes

### AI mode (LLM + Page Agent)

1. Browser loads `page-agent` dynamically.
2. Agent is configured with:
   - `baseURL`: same-origin `/api/page-agent/v1/`
   - `apiKey`: placeholder (`knot-proxy`) — ignored by our proxy
   - `customFetch` with `credentials: "same-origin"` (Clerk session)
3. Server route `POST /api/page-agent/v1/chat/completions` authenticates the user, rate-limits, and forwards to your OpenAI-compatible provider with the real key.
4. Product instructions + optional `/llms.txt` (`experimentalLlmsTxt`) steer the agent toward Knot UI patterns and `data-knot` hooks.

### Guide mode (no LLM key)

Uses `components/page-agent/heuristics-catalog.ts` — a large set of keyword-matched tasks that:

- Navigate (`router.push`)
- Click / highlight controls (`data-knot`, text, selectors)
- Explain product flows (recording, share, visibility, comments, shortcuts)
- Confirm before destructive guidance

Examples users can type: “open videos”, “create a folder”, “how do I record?”, “make video public”, “mark notifications read”, “video shortcuts”.

## Env (web)

```env
# Optional — omit for Guide mode only
PAGE_AGENT_API_KEY=
# Or:
# OPENAI_API_KEY=

PAGE_AGENT_BASE_URL=https://api.openai.com/v1
PAGE_AGENT_MODEL=gpt-4o-mini
```

Works with any OpenAI-compatible chat completions API (OpenAI, DashScope compatible-mode, DeepSeek, local Ollama shims, etc.).

Details: [environment.md](./environment.md).

## Code map

| Path | Role |
|------|------|
| `components/page-agent/page-agent-launcher.tsx` | FAB + chat UI + mode switch |
| `components/page-agent/heuristics-catalog.ts` | Task catalog + keyword scoring |
| `components/page-agent/heuristics-runner.ts` | Execute navigate/click/highlight steps |
| `lib/page-agent-config.ts` | Server-only LLM settings |
| `app/api/page-agent/config/route.ts` | `{ mode, model, proxyBaseURL }` for the client |
| `app/api/page-agent/v1/chat/completions/route.ts` | Authenticated LLM proxy |
| `public/llms.txt` | Site context for Page Agent |
| Dashboard / watch layouts | Mount `<PageAgentLauncher />` |

Stable DOM hooks for agents:

- `data-knot="create-video"`
- `data-knot="create-folder"`
- `data-knot="mark-all-read"`
- `data-knot="sidebar-trigger"`
- `data-knot="page-agent-launcher"`

Add more `data-knot` attributes when you introduce important actions.

## Security notes

- LLM key is **server-only**.
- Proxy requires Clerk auth; ~30 requests/minute/user.
- Prefer confirming before delete-style actions (Guide mode uses `window.confirm`).
- Do not mount the launcher on untrusted embed surfaces.

## Extending Guide mode

1. Add a task to `HEURISTIC_TASKS` (keywords + steps).
2. Optionally add `data-knot="…"` on the target button.
3. No deploy of LLM keys required — Guide mode works immediately.

## Extending AI mode

1. Set env keys and restart the web server.
2. Tighten `KNOT_SYSTEM_INSTRUCTIONS` in `page-agent-launcher.tsx` if the agent drifts.
3. Keep `/llms.txt` updated when you add major UI areas.
