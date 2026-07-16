import {
  app,
  BrowserWindow,
  desktopCapturer,
  globalShortcut,
  ipcMain,
  Menu,
  nativeImage,
  screen,
  shell,
  Tray,
} from "electron";
import { join } from "path";
import { mkdir, readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { randomUUID } from "crypto";

import {
  IPC,
  WEBCAM_WINDOW_TITLE,
  type CaptureMode,
  type ControlAction,
  type DesktopSource,
  type PermissionStatus,
  type RecordingState,
  type RegionBounds,
  type WebcamBounds,
  type WebcamShape,
  type WebcamSize,
} from "../shared/types";
import { resolveRecordingsPath, resolveSessionDir } from "../shared/paths";
import { normalizeWebcamBounds } from "../shared/webcam-utils";
import {
  applyClerkContentSecurityPolicy,
  cleanupClerkBridge,
  controlWindowUrl,
  ensureSingleInstance,
  initClerkBridge,
  knotApiBaseUrl,
  knotDashboardUrl,
  registerKnotProtocol,
} from "./clerk";

const isDev = !app.isPackaged;

const gotSingleInstanceLock = ensureSingleInstance(() => {
  const focus = () => {
    const win = ensureControlWindow();
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
  };

  if (app.isReady()) {
    focus();
  } else {
    void app.whenReady().then(focus);
  }
});

if (!gotSingleInstanceLock) {
  // Second instance — quit. OAuth knot:// callbacks are delivered to the first instance.
} else {
  initClerkBridge();
}

const dashboardUrl = () => knotDashboardUrl();

let tray: Tray | null = null;
let controlWindow: BrowserWindow | null = null;
let webcamWindow: BrowserWindow | null = null;
let indicatorWindow: BrowserWindow | null = null;
let countdownWindow: BrowserWindow | null = null;
let regionWindow: BrowserWindow | null = null;

let recordingState: RecordingState = "idle";
let sessionId: string | null = null;
let chunkCount = 0;
let startedAt: number | null = null;
let pauseStartedAt: number | null = null;
let totalPausedMs = 0;
let outputDir: string | null = null;

let statusTick: ReturnType<typeof setInterval> | null = null;

let webcamBounds: WebcamBounds = normalizeWebcamBounds({
  x: 40,
  y: 40,
  width: 220,
  height: 220,
  shape: "circle",
  size: "medium",
});

let isQuitting = false;
let quitAfterStop = false;
let regionPickerActive = false;

const isControlSender = (event: Electron.IpcMainInvokeEvent) =>
  Boolean(
    controlWindow &&
      !controlWindow.isDestroyed() &&
      event.sender.id === controlWindow.webContents.id,
  );

const normalizeRegion = (region: RegionBounds): RegionBounds | null => {
  const width = Math.round(Math.abs(region.width));
  const height = Math.round(Math.abs(region.height));
  if (width < 10 || height < 10) return null;

  const x = Math.round(Math.min(region.x, region.x + region.width));
  const y = Math.round(Math.min(region.y, region.y + region.height));

  return { x, y, width, height };
};

const writeSessionManifest = async (
  dir: string,
  patch: Record<string, unknown>,
) => {
  const manifestPath = join(dir, "session.json");
  let existing: Record<string, unknown> = {};

  try {
    existing = JSON.parse(await readFile(manifestPath, "utf8")) as Record<string, unknown>;
  } catch {
    // New session manifest.
  }

  await writeFile(
    manifestPath,
    JSON.stringify({ ...existing, ...patch, updatedAt: Date.now() }, null, 2),
    "utf8",
  );
};

const requestQuit = () => {
  if (isQuitting) return;

  if (
    recordingState === "recording" ||
    recordingState === "paused" ||
    recordingState === "countdown"
  ) {
    quitAfterStop = true;
    broadcast(
      IPC.controlAction,
      (recordingState === "countdown"
        ? "cancel-session"
        : "stop-recording") satisfies ControlAction,
    );
    return;
  }

  finishQuit();
};

const applyWebcamBounds = (partial?: Partial<WebcamBounds>) => {
  webcamBounds = normalizeWebcamBounds({ ...webcamBounds, ...partial });

  if (webcamWindow && !webcamWindow.isDestroyed()) {
    webcamWindow.setBounds({
      x: webcamBounds.x,
      y: webcamBounds.y,
      width: webcamBounds.width,
      height: webcamBounds.height,
    });
  }

  broadcast(IPC.updateWebcamBounds, webcamBounds);
  broadcast(IPC.setWebcamShape, webcamBounds.shape);
};

const destroyOverlayWindows = () => {
  for (const win of [indicatorWindow, webcamWindow, countdownWindow, regionWindow]) {
    if (win && !win.isDestroyed()) {
      win.destroy();
    }
  }

  indicatorWindow = null;
  webcamWindow = null;
  countdownWindow = null;
  regionWindow = null;
};

const finishQuit = () => {
  if (isQuitting) return;
  isQuitting = true;
  destroyOverlayWindows();
  tray?.destroy();
  tray = null;
  app.quit();
};

const setCaptureThrottling = (enabled: boolean) => {
  controlWindow?.webContents.setBackgroundThrottling(enabled);
  indicatorWindow?.webContents.setBackgroundThrottling(enabled);
  webcamWindow?.webContents.setBackgroundThrottling(enabled);
};

const clearStatusTick = () => {
  if (statusTick) {
    clearInterval(statusTick);
    statusTick = null;
  }
};

const startStatusTick = () => {
  clearStatusTick();
  statusTick = setInterval(() => {
    if (recordingState !== "recording" && recordingState !== "paused") return;
    const payload = getStatusPayload();
    broadcast(IPC.updateIndicator, payload);
    broadcast(IPC.setRecordingState, payload);
  }, 250);
};

const computeElapsedMs = () => {
  if (startedAt === null) return 0;
  if (recordingState === "paused" && pauseStartedAt !== null) {
    return pauseStartedAt - startedAt - totalPausedMs;
  }
  return Date.now() - startedAt - totalPausedMs;
};

const recordingsRoot = () => join(app.getPath("userData"), "recordings");

const rendererUrl = (windowName: string) => {
  if (isDev && process.env["ELECTRON_RENDERER_URL"]) {
    return `${process.env["ELECTRON_RENDERER_URL"]}?window=${windowName}`;
  }

  return `file://${join(__dirname, "../renderer/index.html")}?window=${windowName}`;
};

const loadControlWindow = (win: BrowserWindow) => {
  void win.loadURL(controlWindowUrl());
};

const loadWindow = (win: BrowserWindow, windowName: string) => {
  if (isDev && process.env["ELECTRON_RENDERER_URL"]) {
    void win.loadURL(rendererUrl(windowName));
  } else {
    void win.loadFile(join(__dirname, "../renderer/index.html"), {
      query: { window: windowName },
    });
  }
};

const createTrayIcon = () => {
  const size = 16;
  const canvas = Buffer.alloc(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const dx = x - 7.5;
      const dy = y - 7.5;
      const inside = dx * dx + dy * dy <= 36;

      if (inside) {
        canvas[i] = 30;
        canvas[i + 1] = 30;
        canvas[i + 2] = 30;
        canvas[i + 3] = 255;
      }
    }
  }

  return nativeImage.createFromBitmap(canvas, { width: size, height: size });
};

const broadcast = (channel: string, payload?: unknown) => {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, payload);
    }
  }
};

const getStatusPayload = () => ({
  state: recordingState,
  sessionId,
  chunkCount,
  startedAt,
  outputDir,
  elapsedMs: computeElapsedMs(),
});

const setState = (state: RecordingState) => {
  if (state === "recording") {
    if (recordingState === "paused" && pauseStartedAt !== null) {
      totalPausedMs += Date.now() - pauseStartedAt;
      pauseStartedAt = null;
    } else if (startedAt === null) {
      startedAt = Date.now();
      totalPausedMs = 0;
      pauseStartedAt = null;
    }
  }

  if (state === "paused" && recordingState === "recording") {
    pauseStartedAt = Date.now();
  }

  if (state === "idle") {
    startedAt = null;
    pauseStartedAt = null;
    totalPausedMs = 0;
    clearStatusTick();
    setCaptureThrottling(true);
  }

  if (state === "recording" || state === "paused") {
    setCaptureThrottling(false);
    startStatusTick();
  }

  recordingState = state;
  updateTrayMenu();
  broadcast(IPC.updateIndicator, getStatusPayload());
  broadcast(IPC.setRecordingState, getStatusPayload());
};

const ensureControlWindow = () => {
  if (controlWindow && !controlWindow.isDestroyed()) {
    return controlWindow;
  }

  controlWindow = new BrowserWindow({
    width: 1080,
    height: 820,
    minWidth: 900,
    minHeight: 680,
    title: "Knot",
    show: false,
    backgroundColor: "#05070a",
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  loadControlWindow(controlWindow);

  controlWindow.once("ready-to-show", () => {
    controlWindow?.show();
  });

  controlWindow.on("close", (event) => {
    if (isQuitting) return;

    event.preventDefault();

    if (
      recordingState === "recording" ||
      recordingState === "paused" ||
      recordingState === "countdown"
    ) {
      quitAfterStop = true;
      broadcast(
        IPC.controlAction,
        (recordingState === "countdown"
          ? "cancel-session"
          : "stop-recording") satisfies ControlAction,
      );
      return;
    }

    finishQuit();
  });

  controlWindow.on("closed", () => {
    controlWindow = null;
  });

  return controlWindow;
};

const ensureWebcamWindow = () => {
  if (webcamWindow && !webcamWindow.isDestroyed()) {
    return webcamWindow;
  }

  webcamWindow = new BrowserWindow({
    x: webcamBounds.x,
    y: webcamBounds.y,
    width: webcamBounds.width,
    height: webcamBounds.height,
    title: WEBCAM_WINDOW_TITLE,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    skipTaskbar: true,
    hasShadow: false,
    show: false,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  webcamWindow.setAlwaysOnTop(true, "screen-saver");
  webcamWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  loadWindow(webcamWindow, "webcam");

  webcamWindow.on("moved", () => {
    if (!webcamWindow) return;
    const [x, y] = webcamWindow.getPosition();
    webcamBounds = { ...webcamBounds, x, y };
    broadcast(IPC.updateWebcamBounds, webcamBounds);
  });

  webcamWindow.on("resized", () => {
    if (!webcamWindow) return;
    let [width, height] = webcamWindow.getSize();

    if (webcamBounds.shape === "circle" || webcamBounds.shape === "square") {
      const size = Math.max(width, height);
      width = size;
      height = size;
      webcamWindow.setSize(width, height);
    }

    webcamBounds = { ...webcamBounds, width, height };
    broadcast(IPC.updateWebcamBounds, webcamBounds);
  });

  webcamWindow.on("closed", () => {
    webcamWindow = null;
  });

  return webcamWindow;
};

const ensureIndicatorWindow = () => {
  if (indicatorWindow && !indicatorWindow.isDestroyed()) {
    return indicatorWindow;
  }

  const display = screen.getPrimaryDisplay();
  const width = 360;
  const height = 56;
  const x = Math.round(display.workArea.x + (display.workArea.width - width) / 2);
  const y = display.workArea.y + 16;

  indicatorWindow = new BrowserWindow({
    x,
    y,
    width,
    height,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    show: false,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  indicatorWindow.setAlwaysOnTop(true, "screen-saver");
  indicatorWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  loadWindow(indicatorWindow, "indicator");

  indicatorWindow.on("closed", () => {
    indicatorWindow = null;
  });

  return indicatorWindow;
};

const ensureCountdownWindow = () => {
  if (countdownWindow && !countdownWindow.isDestroyed()) {
    return countdownWindow;
  }

  const display = screen.getPrimaryDisplay();

  countdownWindow = new BrowserWindow({
    x: display.bounds.x,
    y: display.bounds.y,
    width: display.bounds.width,
    height: display.bounds.height,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    focusable: false,
    hasShadow: false,
    show: false,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  countdownWindow.setAlwaysOnTop(true, "screen-saver");
  countdownWindow.setIgnoreMouseEvents(true);
  loadWindow(countdownWindow, "countdown");

  countdownWindow.on("closed", () => {
    countdownWindow = null;
  });

  return countdownWindow;
};

const ensureRegionWindow = () => {
  if (regionWindow && !regionWindow.isDestroyed()) {
    return regionWindow;
  }

  const display = screen.getPrimaryDisplay();

  regionWindow = new BrowserWindow({
    x: display.bounds.x,
    y: display.bounds.y,
    width: display.bounds.width,
    height: display.bounds.height,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    show: false,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  regionWindow.setAlwaysOnTop(true, "screen-saver");
  loadWindow(regionWindow, "region");

  regionWindow.on("closed", () => {
    regionWindow = null;
  });

  return regionWindow;
};

const updateTrayMenu = () => {
  if (!tray) return;

  const isActive = recordingState === "recording" || recordingState === "paused";

  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: isActive ? "Stop Recording" : "Start Recording",
      click: () =>
        broadcast(IPC.trayAction, (isActive ? "stop-recording" : "start-recording") as ControlAction),
    },
    {
      label: recordingState === "paused" ? "Resume" : "Pause",
      enabled: recordingState === "recording" || recordingState === "paused",
      click: () =>
        broadcast(
          IPC.trayAction,
          (recordingState === "paused" ? "resume-recording" : "pause-recording") as ControlAction,
        ),
    },
    {
      label: "Take Screenshot",
      click: () => broadcast(IPC.trayAction, "take-screenshot" as ControlAction),
    },
    { type: "separator" },
    {
      label: "Show Recorder",
      click: () => {
        const win = ensureControlWindow();
        win.show();
        win.focus();
      },
    },
    {
      label: "Open Recordings Folder",
      click: () => {
        void shell.openPath(recordingsRoot());
      },
    },
    {
      label: "Open Dashboard",
      click: () => {
        void shell.openExternal(dashboardUrl());
      },
    },
    { type: "separator" },
    {
      label: "Quit Knot",
      click: () => requestQuit(),
    },
  ];

  tray.setContextMenu(Menu.buildFromTemplate(template));
  tray.setToolTip(
    recordingState === "recording"
      ? "Knot — Recording"
      : recordingState === "paused"
        ? "Knot — Paused"
        : "Knot Recorder",
  );
};

const createTray = () => {
  tray = new Tray(createTrayIcon());
  tray.on("double-click", () => {
    const win = ensureControlWindow();
    win.show();
    win.focus();
  });
  updateTrayMenu();
};

const registerShortcuts = () => {
  globalShortcut.unregisterAll();

  globalShortcut.register("CommandOrControl+Shift+R", () => {
    const action: ControlAction =
      recordingState === "recording" || recordingState === "paused"
        ? "stop-recording"
        : "start-recording";
    broadcast(IPC.shortcutAction, action);
  });

  globalShortcut.register("CommandOrControl+Shift+S", () => {
    broadcast(IPC.shortcutAction, "take-screenshot" as ControlAction);
  });

  globalShortcut.register("CommandOrControl+Shift+P", () => {
    if (recordingState === "recording") {
      broadcast(IPC.shortcutAction, "pause-recording" as ControlAction);
    } else if (recordingState === "paused") {
      broadcast(IPC.shortcutAction, "resume-recording" as ControlAction);
    }
  });
};

const registerIpc = () => {
  ipcMain.handle(IPC.getSources, async (_event, types: Array<"screen" | "window">) => {
    const sources = await desktopCapturer.getSources({
      types,
      thumbnailSize: { width: 320, height: 180 },
      fetchWindowIcons: true,
    });

    const mapped: DesktopSource[] = sources.map((source) => ({
      id: source.id,
      name: source.name,
      displayId: source.display_id,
      thumbnailDataUrl: source.thumbnail.toDataURL(),
      appIconDataUrl: source.appIcon?.isEmpty() ? null : source.appIcon?.toDataURL() ?? null,
    }));

    return mapped;
  });

  ipcMain.handle(IPC.startSession, async (event) => {
    if (!isControlSender(event)) {
      throw new Error("Only the control window can start a session");
    }

    if (recordingState !== "idle") {
      throw new Error("A recording session is already active");
    }

    sessionId = randomUUID();
    chunkCount = 0;
    startedAt = null;
    pauseStartedAt = null;
    totalPausedMs = 0;
    outputDir = join(recordingsRoot(), sessionId);
    await mkdir(outputDir, { recursive: true });
    await writeSessionManifest(outputDir, {
      sessionId,
      state: "countdown",
      chunkCount: 0,
      createdAt: Date.now(),
    });
    setState("countdown");
    return { sessionId, outputDir };
  });

  ipcMain.handle(IPC.endSession, async (event) => {
    if (!isControlSender(event)) {
      throw new Error("Only the control window can end a session");
    }

    const result = getStatusPayload();

    if (outputDir && existsSync(outputDir)) {
      await writeSessionManifest(outputDir, {
        state: "completed",
        chunkCount: result.chunkCount,
        endedAt: Date.now(),
      });
    }

    sessionId = null;
    startedAt = null;
    pauseStartedAt = null;
    totalPausedMs = 0;
    chunkCount = 0;
    setState("idle");
    return result;
  });

  ipcMain.handle(
    IPC.saveChunk,
    async (
      event,
      payload: { sessionId: string; index: number; buffer: ArrayBuffer },
    ) => {
      if (!isControlSender(event)) {
        throw new Error("Only the control window can save chunks");
      }

      if (!sessionId || payload.sessionId !== sessionId) {
        throw new Error("Chunk session does not match the active session");
      }

      if (!Number.isInteger(payload.index) || payload.index < 0) {
        throw new Error("Invalid chunk index");
      }

      const dir = resolveSessionDir(recordingsRoot(), payload.sessionId);
      if (!dir) {
        throw new Error("Invalid session directory");
      }

      await mkdir(dir, { recursive: true });
      const filePath = join(dir, `chunk-${String(payload.index).padStart(4, "0")}.webm`);
      const data = Buffer.from(new Uint8Array(payload.buffer));

      if (data.byteLength === 0) {
        throw new Error("Refusing to write empty chunk");
      }

      await writeFile(filePath, data);
      chunkCount = Math.max(chunkCount, payload.index + 1);
      await writeSessionManifest(dir, {
        chunkCount,
        state: "recording",
        lastChunkIndex: payload.index,
        lastChunkBytes: data.byteLength,
      });
      broadcast(IPC.updateIndicator, getStatusPayload());
      return { path: filePath, size: data.byteLength };
    },
  );

  ipcMain.handle(
    IPC.saveScreenshot,
    async (_event, payload: { buffer: ArrayBuffer; format: "png" | "jpeg" }) => {
      const dir = join(recordingsRoot(), "screenshots");
      await mkdir(dir, { recursive: true });
      const name = `screenshot-${Date.now()}.${payload.format}`;
      const filePath = join(dir, name);
      const data = Buffer.from(payload.buffer);
      await writeFile(filePath, data);
      return { path: filePath, size: data.byteLength };
    },
  );

  ipcMain.handle(IPC.getSessionDir, () => outputDir);

  ipcMain.handle(IPC.getRecordingsRoot, () => recordingsRoot());

  ipcMain.handle(IPC.openDashboard, () => {
    void shell.openExternal(dashboardUrl());
  });

  ipcMain.handle(IPC.getApiBaseUrl, () => knotApiBaseUrl());

  ipcMain.handle(IPC.openRecordingsFolder, async (_event, dir?: string) => {
    const target = resolveRecordingsPath(recordingsRoot(), dir);
    await mkdir(target, { recursive: true });
    return shell.openPath(target);
  });

  ipcMain.handle(IPC.showControl, () => {
    const win = ensureControlWindow();
    win.show();
    win.focus();
  });

  ipcMain.handle(IPC.hideControl, () => {
    controlWindow?.hide();
  });

  ipcMain.handle(IPC.showWebcam, (_event, shape?: WebcamShape) => {
    applyWebcamBounds(shape ? { shape } : undefined);
    const win = ensureWebcamWindow();
    win.show();
  });

  ipcMain.handle(IPC.hideWebcam, () => {
    webcamWindow?.hide();
  });

  ipcMain.handle(IPC.updateWebcamBounds, (_event, bounds: Partial<WebcamBounds>) => {
    applyWebcamBounds(bounds);
    return webcamBounds;
  });

  ipcMain.handle(IPC.getWebcamBounds, () => webcamBounds);

  ipcMain.handle(IPC.getWebcamCaptureSourceId, async () => {
    const win = webcamWindow;
    if (!win || win.isDestroyed() || !win.isVisible()) {
      return null;
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 150 + attempt * 100));

      const sources = await desktopCapturer.getSources({
        types: ["window"],
        thumbnailSize: { width: 1, height: 1 },
      });

      const exact = sources.find((source) => source.name === WEBCAM_WINDOW_TITLE);
      if (exact) return exact.id;

      const partial = sources.find((source) => source.name.includes("Knot Webcam"));
      if (partial) return partial.id;
    }

    return null;
  });

  ipcMain.handle(
    IPC.getCaptureFrameOrigin,
    async (
      _event,
      payload: {
        sourceId: string;
        mode: CaptureMode;
        region: RegionBounds | null;
      },
    ) => {
      if (payload.mode === "region" && payload.region) {
        return { x: payload.region.x, y: payload.region.y };
      }

      const sources = await desktopCapturer.getSources({
        types: ["screen", "window"],
        thumbnailSize: { width: 1, height: 1 },
      });
      const source = sources.find((item) => item.id === payload.sourceId);
      if (!source) {
        return { x: 0, y: 0 };
      }

      if (source.display_id) {
        const display = screen
          .getAllDisplays()
          .find(
            (item) =>
              String(item.id) === source.display_id ||
              item.id === Number(source.display_id),
          );
        if (display) {
          return { x: display.bounds.x, y: display.bounds.y };
        }
      }

      for (const browserWindow of BrowserWindow.getAllWindows()) {
        if (browserWindow.isDestroyed()) continue;
        const title = browserWindow.getTitle();
        if (title && (source.name === title || source.name.includes(title))) {
          const [x, y] = browserWindow.getPosition();
          return { x, y };
        }
      }

      return { x: 0, y: 0 };
    },
  );

  ipcMain.handle(IPC.setWebcamShape, (_event, shape: WebcamShape) => {
    applyWebcamBounds({ shape });
    return webcamBounds;
  });

  ipcMain.handle(IPC.setWebcamSize, (_event, size: WebcamSize) => {
    applyWebcamBounds({ size });
    return webcamBounds;
  });

  ipcMain.handle(IPC.showIndicator, () => {
    const win = ensureIndicatorWindow();
    win.show();
    win.webContents.send(IPC.updateIndicator, getStatusPayload());
  });

  ipcMain.handle(IPC.hideIndicator, () => {
    indicatorWindow?.hide();
  });

  ipcMain.handle(IPC.showCountdown, (_event, seconds: number) => {
    setState("countdown");
    const win = ensureCountdownWindow();
    win.show();
    win.webContents.send(IPC.showCountdown, seconds);
  });

  ipcMain.handle(IPC.hideCountdown, () => {
    countdownWindow?.hide();
  });

  ipcMain.handle(IPC.showRegionPicker, async (event) => {
    if (!isControlSender(event)) {
      throw new Error("Only the control window can pick a region");
    }

    if (regionPickerActive) {
      throw new Error("Region picker is already open");
    }

    regionPickerActive = true;

    return new Promise<RegionBounds | null>((resolve) => {
      const win = ensureRegionWindow();
      win.show();
      win.focus();

      const onSelected = (_event: Electron.IpcMainEvent, region: RegionBounds) => {
        cleanup();
        resolve(normalizeRegion(region));
      };

      const onCancel = () => {
        cleanup();
        resolve(null);
      };

      const cleanup = () => {
        regionPickerActive = false;
        ipcMain.removeListener(IPC.regionSelected, onSelected);
        ipcMain.removeListener(IPC.cancelRegion, onCancel);
        regionWindow?.hide();
      };

      ipcMain.once(IPC.regionSelected, onSelected);
      ipcMain.once(IPC.cancelRegion, onCancel);
    });
  });

  ipcMain.handle(IPC.setRecordingState, (event, state: RecordingState) => {
    if (!isControlSender(event)) {
      throw new Error("Only the control window can update recording state");
    }

    setState(state);
    return getStatusPayload();
  });

  ipcMain.handle(IPC.getRecordingState, () => getStatusPayload());

  ipcMain.handle(IPC.emitControlAction, (_event, action: ControlAction) => {
    broadcast(IPC.controlAction, action);
  });

  ipcMain.handle(IPC.notifyRecordingStopped, () => {
    if (quitAfterStop) {
      quitAfterStop = false;
      finishQuit();
    }
  });

  ipcMain.handle(IPC.permissionsCheck, async (): Promise<PermissionStatus> => {
    // Electron surfaces OS prompts on first media access; status is best-effort.
    return {
      screen: "unknown",
      camera: "unknown",
      microphone: "unknown",
    };
  });

  ipcMain.handle(IPC.controlAction, (_event, action: ControlAction) => {
    broadcast(IPC.controlAction, action);
  });
};

app.whenReady().then(async () => {
  if (!gotSingleInstanceLock) return;

  await registerKnotProtocol();
  applyClerkContentSecurityPolicy();

  if (!existsSync(recordingsRoot())) {
    void mkdir(recordingsRoot(), { recursive: true });
  }

  registerIpc();
  createTray();
  registerShortcuts();
  ensureControlWindow();

  app.on("activate", () => {
    ensureControlWindow().show();
  });
});

app.on("will-quit", () => {
  clearStatusTick();
  globalShortcut.unregisterAll();
  destroyOverlayWindows();
  cleanupClerkBridge();
});

app.on("window-all-closed", () => {
  if (!isQuitting) {
    finishQuit();
  }
});
