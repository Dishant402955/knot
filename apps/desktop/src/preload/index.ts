import { contextBridge, ipcRenderer } from "electron";
import { exposeClerkBridge } from "@clerk/electron/preload";

import {
  IPC,
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

const api = {
  getSources: (types: Array<"screen" | "window"> = ["screen", "window"]) =>
    ipcRenderer.invoke(IPC.getSources, types) as Promise<DesktopSource[]>,

  getCaptureFrameOrigin: (payload: {
    sourceId: string;
    mode: CaptureMode;
    region: RegionBounds | null;
  }) =>
    ipcRenderer.invoke(IPC.getCaptureFrameOrigin, payload) as Promise<{
      x: number;
      y: number;
    }>,

  startSession: () =>
    ipcRenderer.invoke(IPC.startSession) as Promise<{
      sessionId: string;
      outputDir: string;
    }>,

  endSession: () => ipcRenderer.invoke(IPC.endSession),

  discardSession: () => ipcRenderer.invoke(IPC.discardSession),

  saveChunk: (payload: { sessionId: string; index: number; buffer: ArrayBuffer }) =>
    ipcRenderer.invoke(IPC.saveChunk, payload) as Promise<{ path: string; size: number }>,

  saveScreenshot: (payload: { buffer: ArrayBuffer; format: "png" | "jpeg" }) =>
    ipcRenderer.invoke(IPC.saveScreenshot, payload) as Promise<{
      path: string;
      size: number;
    }>,

  getSessionDir: () => ipcRenderer.invoke(IPC.getSessionDir) as Promise<string | null>,

  getRecordingsRoot: () => ipcRenderer.invoke(IPC.getRecordingsRoot) as Promise<string>,

  openDashboard: () => ipcRenderer.invoke(IPC.openDashboard),

  openExternalUrl: (url: string) =>
    ipcRenderer.invoke(IPC.openExternalUrl, url) as Promise<boolean>,

  /** Upload bytes via main process (no browser CORS). */
  putToUrl: (payload: {
    url: string;
    contentType: string;
    buffer: ArrayBuffer;
  }) =>
    ipcRenderer.invoke(IPC.putToUrl, payload) as Promise<{
      ok: boolean;
      status: number;
      body: string;
    }>,

  getApiBaseUrl: () => ipcRenderer.invoke(IPC.getApiBaseUrl) as Promise<string>,

  openRecordingsFolder: (dir?: string) => ipcRenderer.invoke(IPC.openRecordingsFolder, dir),

  showControl: () => ipcRenderer.invoke(IPC.showControl),
  hideControl: () => ipcRenderer.invoke(IPC.hideControl),

  showWebcam: (shape?: WebcamShape) => ipcRenderer.invoke(IPC.showWebcam, shape),
  hideWebcam: () => ipcRenderer.invoke(IPC.hideWebcam),
  updateWebcamBounds: (bounds: Partial<WebcamBounds>) =>
    ipcRenderer.invoke(IPC.updateWebcamBounds, bounds) as Promise<WebcamBounds>,
  getWebcamBounds: () => ipcRenderer.invoke(IPC.getWebcamBounds) as Promise<WebcamBounds>,
  setWebcamShape: (shape: WebcamShape) =>
    ipcRenderer.invoke(IPC.setWebcamShape, shape) as Promise<WebcamBounds>,
  setWebcamSize: (size: WebcamSize) =>
    ipcRenderer.invoke(IPC.setWebcamSize, size) as Promise<WebcamBounds>,

  showIndicator: () => ipcRenderer.invoke(IPC.showIndicator) as Promise<void>,
  hideIndicator: () => ipcRenderer.invoke(IPC.hideIndicator),
  /** Indicator window calls this after it has painted and is visibly ready. */
  notifyIndicatorReady: () => ipcRenderer.send(IPC.indicatorReady),

  /** Shows fullscreen countdown and resolves when it finishes (or is cancelled). */
  runCountdown: (seconds: number) =>
    ipcRenderer.invoke(IPC.showCountdown, seconds) as Promise<{ completed: boolean }>,
  hideCountdown: () => ipcRenderer.invoke(IPC.hideCountdown),
  notifyCountdownFinished: () => ipcRenderer.send(IPC.countdownFinished),

  pickRegion: () => ipcRenderer.invoke(IPC.showRegionPicker) as Promise<RegionBounds | null>,
  submitRegion: (region: RegionBounds) => ipcRenderer.send(IPC.regionSelected, region),
  cancelRegion: () => ipcRenderer.send(IPC.cancelRegion),

  setRecordingState: (state: RecordingState) =>
    ipcRenderer.invoke(IPC.setRecordingState, state),
  getRecordingState: () => ipcRenderer.invoke(IPC.getRecordingState),

  permissionsCheck: () =>
    ipcRenderer.invoke(IPC.permissionsCheck) as Promise<PermissionStatus>,

  emitControlAction: (action: ControlAction) =>
    ipcRenderer.invoke(IPC.emitControlAction, action),

  notifyRecordingStopped: () => ipcRenderer.invoke(IPC.notifyRecordingStopped),

  onTrayAction: (handler: (action: ControlAction) => void) => {
    const listener = (_: Electron.IpcRendererEvent, action: ControlAction) =>
      handler(action);
    ipcRenderer.on(IPC.trayAction, listener);
    return () => ipcRenderer.removeListener(IPC.trayAction, listener);
  },

  onShortcutAction: (handler: (action: ControlAction) => void) => {
    const listener = (_: Electron.IpcRendererEvent, action: ControlAction) =>
      handler(action);
    ipcRenderer.on(IPC.shortcutAction, listener);
    return () => ipcRenderer.removeListener(IPC.shortcutAction, listener);
  },

  onControlAction: (handler: (action: ControlAction) => void) => {
    const listener = (_: Electron.IpcRendererEvent, action: ControlAction) =>
      handler(action);
    ipcRenderer.on(IPC.controlAction, listener);
    return () => ipcRenderer.removeListener(IPC.controlAction, listener);
  },

  onIndicatorUpdate: (handler: (payload: unknown) => void) => {
    const listener = (_: Electron.IpcRendererEvent, payload: unknown) => handler(payload);
    ipcRenderer.on(IPC.updateIndicator, listener);
    return () => ipcRenderer.removeListener(IPC.updateIndicator, listener);
  },

  onRecordingState: (handler: (payload: unknown) => void) => {
    const listener = (_: Electron.IpcRendererEvent, payload: unknown) => handler(payload);
    ipcRenderer.on(IPC.setRecordingState, listener);
    return () => ipcRenderer.removeListener(IPC.setRecordingState, listener);
  },

  onWebcamBounds: (handler: (bounds: WebcamBounds) => void) => {
    const listener = (_: Electron.IpcRendererEvent, bounds: WebcamBounds) => handler(bounds);
    ipcRenderer.on(IPC.updateWebcamBounds, listener);
    return () => ipcRenderer.removeListener(IPC.updateWebcamBounds, listener);
  },

  onWebcamShape: (handler: (shape: WebcamShape) => void) => {
    const listener = (_: Electron.IpcRendererEvent, shape: WebcamShape) => handler(shape);
    ipcRenderer.on(IPC.setWebcamShape, listener);
    return () => ipcRenderer.removeListener(IPC.setWebcamShape, listener);
  },

  onCountdown: (handler: (seconds: number) => void) => {
    const listener = (_: Electron.IpcRendererEvent, seconds: number) => handler(seconds);
    ipcRenderer.on(IPC.showCountdown, listener);
    return () => ipcRenderer.removeListener(IPC.showCountdown, listener);
  },

  onOAuthStatus: (handler: (payload: import("../shared/types").OAuthStatusPayload) => void) => {
    const listener = (
      _: Electron.IpcRendererEvent,
      payload: import("../shared/types").OAuthStatusPayload,
    ) => handler(payload);
    ipcRenderer.on(IPC.oauthStatus, listener);
    return () => {
      ipcRenderer.removeListener(IPC.oauthStatus, listener);
    };
  },
};

export type KnotDesktopApi = typeof api & {
  // helpers for typing in renderer
  CaptureMode?: CaptureMode;
};

contextBridge.exposeInMainWorld("knot", api);

exposeClerkBridge();
