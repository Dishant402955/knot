export type CaptureMode = "screen" | "window" | "region";

export type WebcamShape = "circle" | "square" | "rectangle";

export type WebcamSize = "small" | "medium" | "large";

export const WEBCAM_WINDOW_TITLE = "Knot Webcam";

export type CaptureFrameOrigin = {
  x: number;
  y: number;
};

export type RecordingState = "idle" | "countdown" | "recording" | "paused";

export type DesktopSource = {
  id: string;
  name: string;
  thumbnailDataUrl: string;
  displayId?: string;
  appIconDataUrl?: string | null;
};

export type RegionBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type WebcamBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
  shape: WebcamShape;
  size: WebcamSize;
};

export type StartRecordingPayload = {
  sourceId: string;
  mode: CaptureMode;
  region: RegionBounds | null;
  includeMic: boolean;
  includeSystemAudio: boolean;
  includeWebcam: boolean;
  webcamShape: WebcamShape;
  countdownSeconds: number;
};

export type RecordingStatusPayload = {
  state: RecordingState;
  sessionId: string | null;
  chunkCount: number;
  startedAt: number | null;
  outputDir: string | null;
  elapsedMs: number;
};

export type ChunkSavedPayload = {
  sessionId: string;
  index: number;
  path: string;
  size: number;
};

export const IPC = {
  getSources: "desktop:get-sources",
  getCaptureFrameOrigin: "desktop:get-capture-frame-origin",
  saveChunk: "desktop:save-chunk",
  saveScreenshot: "desktop:save-screenshot",
  startSession: "desktop:start-session",
  endSession: "desktop:end-session",
  getSessionDir: "desktop:get-session-dir",
  getRecordingsRoot: "desktop:get-recordings-root",
  openDashboard: "desktop:open-dashboard",
  getApiBaseUrl: "desktop:get-api-base-url",
  openRecordingsFolder: "desktop:open-recordings-folder",
  showControl: "desktop:show-control",
  hideControl: "desktop:hide-control",
  showWebcam: "desktop:show-webcam",
  hideWebcam: "desktop:hide-webcam",
  updateWebcamBounds: "desktop:update-webcam-bounds",
  getWebcamBounds: "desktop:get-webcam-bounds",
  getWebcamCaptureSourceId: "desktop:get-webcam-capture-source-id",
  setWebcamShape: "desktop:set-webcam-shape",
  setWebcamSize: "desktop:set-webcam-size",
  showIndicator: "desktop:show-indicator",
  hideIndicator: "desktop:hide-indicator",
  updateIndicator: "desktop:update-indicator",
  showCountdown: "desktop:show-countdown",
  hideCountdown: "desktop:hide-countdown",
  showRegionPicker: "desktop:show-region-picker",
  regionSelected: "desktop:region-selected",
  cancelRegion: "desktop:cancel-region",
  setRecordingState: "desktop:set-recording-state",
  getRecordingState: "desktop:get-recording-state",
  trayAction: "desktop:tray-action",
  shortcutAction: "desktop:shortcut-action",
  controlAction: "desktop:control-action",
  emitControlAction: "desktop:emit-control-action",
  notifyRecordingStopped: "desktop:notify-recording-stopped",
  permissionsCheck: "desktop:permissions-check",
} as const;

export type TrayAction =
  | "record"
  | "screenshot"
  | "open-dashboard"
  | "open-recordings"
  | "show-control"
  | "quit";

export type ControlAction =
  | "start-recording"
  | "stop-recording"
  | "pause-recording"
  | "resume-recording"
  | "take-screenshot"
  | "toggle-webcam"
  | "cancel-session";

export type PermissionStatus = {
  screen: "granted" | "denied" | "unknown";
  camera: "granted" | "denied" | "unknown";
  microphone: "granted" | "denied" | "unknown";
};
