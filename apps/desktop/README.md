# Knot Desktop

Electron recorder for Knot — screen/window/region capture, webcam overlay, and 5s WebM chunks saved locally.

## Features (Phase A)

- Source picker: full screen, window, or region
- Microphone + optional system audio
- Webcam overlay window (drag / resize) with circle, square, rectangle shapes
- Canvas compositing into the recorded stream
- Countdown, start / pause / resume / stop
- Screenshots (PNG)
- Floating recording indicator + system tray status
- Global shortcuts: `Ctrl/⌘+Shift+R`, `Ctrl/⌘+Shift+P`, `Ctrl/⌘+Shift+S`

Chunks are written to the Electron userData folder:

`%APPDATA%/desktop/recordings/<sessionId>/chunk-0000.webm` (Windows)

Cloud upload / Clerk auth are **not** wired yet.

## Develop

From the repo root:

```bash
pnpm install
pnpm --filter desktop dev
```

Or:

```bash
cd apps/desktop
pnpm dev
```

## Notes

- First run will prompt for screen capture, camera, and microphone permissions.
- System audio depends on OS/Electron loopback support (best on Windows with desktop capture audio).
