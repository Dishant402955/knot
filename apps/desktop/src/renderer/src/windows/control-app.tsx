import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  CaptureMode,
  ControlAction,
  DesktopSource,
  RecordingStatusPayload,
  RegionBounds,
  WebcamShape,
  WebcamSize,
} from "@shared/types";
import { WEBCAM_SIZES } from "@shared/webcam-utils";

import { CaptureRecorder } from "../lib/capture-recorder";

const SHAPES: WebcamShape[] = ["circle", "square", "rectangle"];

function BrandMark() {
  return (
    <div className="brand-mark" aria-hidden>
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M5 4v16M5 12h6l7 8M11 12l7-8"
          stroke="#8fd3ff"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function ControlApp() {
  const recorderRef = useRef(new CaptureRecorder());
  const busyRef = useRef(false);
  const statusRef = useRef<"idle" | "countdown" | "recording" | "paused">("idle");
  const [mode, setMode] = useState<CaptureMode>("screen");
  const [sources, setSources] = useState<DesktopSource[]>([]);
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [region, setRegion] = useState<RegionBounds | null>(null);
  const [includeMic, setIncludeMic] = useState(true);
  const [includeSystemAudio, setIncludeSystemAudio] = useState(false);
  const [includeWebcam, setIncludeWebcam] = useState(true);
  const [webcamShape, setWebcamShape] = useState<WebcamShape>("circle");
  const [webcamSize, setWebcamSize] = useState<WebcamSize>("medium");
  const [countdownSeconds, setCountdownSeconds] = useState(3);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"idle" | "countdown" | "recording" | "paused">(
    "idle",
  );
  const [chunkCount, setChunkCount] = useState(0);
  const [outputDir, setOutputDir] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    if (status !== "recording" && status !== "paused") return;

    const off = window.knot.onWebcamBounds((bounds) => {
      recorderRef.current.updateWebcamBounds(bounds);
    });

    return () => {
      off();
    };
  }, [status]);

  const selectedSource = useMemo(
    () => sources.find((s) => s.id === sourceId) ?? null,
    [sources, sourceId],
  );

  const refreshSources = useCallback(async () => {
    const types = mode === "window" ? (["window"] as const) : (["screen"] as const);
    const next = await window.knot.getSources([...types]);
    setSources(next);
    setSourceId((current) => {
      if (current && next.some((s) => s.id === current)) return current;
      return next[0]?.id ?? null;
    });
  }, [mode]);

  useEffect(() => {
    void refreshSources();
  }, [refreshSources]);

  useEffect(() => {
    const syncStatus = (payload: unknown) => {
      const statusPayload = payload as RecordingStatusPayload;

      if (
        statusPayload.state === "recording" ||
        statusPayload.state === "paused" ||
        statusPayload.state === "idle"
      ) {
        setStatus(
          statusPayload.state === "idle"
            ? "idle"
            : statusPayload.state === "paused"
              ? "paused"
              : "recording",
        );
      }

      if (statusPayload.state === "recording" || statusPayload.state === "paused") {
        setElapsedMs(statusPayload.elapsedMs);
        setChunkCount(statusPayload.chunkCount);
      }

      if (statusPayload.state === "idle") {
        setElapsedMs(0);
      }
    };

    const offIndicator = window.knot.onIndicatorUpdate(syncStatus);
    const offState = window.knot.onRecordingState(syncStatus);

    return () => {
      offIndicator();
      offState();
    };
  }, []);

  useEffect(() => {
    void window.knot.getWebcamBounds().then((bounds) => {
      setWebcamShape(bounds.shape);
      setWebcamSize(bounds.size ?? "medium");
    });
  }, []);

  useEffect(() => {
    if (includeWebcam) {
      void window.knot.showWebcam(webcamShape);
      void window.knot.setWebcamSize(webcamSize);
    } else {
      void window.knot.hideWebcam();
    }
  }, [includeWebcam, webcamShape, webcamSize]);

  const changeWebcamShape = (shape: WebcamShape) => {
    setWebcamShape(shape);
    void window.knot.setWebcamShape(shape);
  };

  const changeWebcamSize = (size: WebcamSize) => {
    setWebcamSize(size);
    void window.knot.setWebcamSize(size);
  };

  const resetAfterFailure = useCallback(async () => {
    try {
      await recorderRef.current.stop();
    } catch {
      // Recorder may not have started.
    }

    await window.knot.hideIndicator();
    await window.knot.hideCountdown();
    await window.knot.showControl();

    try {
      await window.knot.endSession();
    } catch {
      // Session may already be ended.
    }

    setStatus("idle");
    setElapsedMs(0);
  }, []);

  const cancelSession = useCallback(async () => {
    if (statusRef.current !== "countdown") return;

    await resetAfterFailure();
    await window.knot.notifyRecordingStopped();
  }, [resetAfterFailure]);

  const startRecording = useCallback(async () => {
    if (!sourceId || busyRef.current) return;
    if (statusRef.current === "recording" || statusRef.current === "paused") return;

    busyRef.current = true;
    setBusy(true);
    setMessage(null);

    try {
      let activeRegion = region;

      if (mode === "region") {
        const picked = await window.knot.pickRegion();
        if (!picked) {
          setMessage("Region selection cancelled.");
          return;
        }
        activeRegion = picked;
        setRegion(picked);
      }

      const session = await window.knot.startSession();
      setOutputDir(session.outputDir);
      setChunkCount(0);
      setStatus("countdown");

      await window.knot.hideControl();

      if (countdownSeconds > 0) {
        await window.knot.showCountdown(countdownSeconds);
        await new Promise<void>((resolve) => {
          window.setTimeout(resolve, countdownSeconds * 1000);
        });
        await window.knot.hideCountdown();
      }

      if (includeWebcam) {
        await window.knot.showWebcam(webcamShape);
        await window.knot.setWebcamSize(webcamSize);
      }

      let webcamWindowSourceId: string | null = null;
      if (includeWebcam) {
        webcamWindowSourceId = await window.knot.getWebcamCaptureSourceId();
        if (!webcamWindowSourceId) {
          throw new Error(
            "Could not capture the webcam overlay. Enable webcam and try again.",
          );
        }
      }

      const frameOrigin = await window.knot.getCaptureFrameOrigin({
        sourceId,
        mode,
        region: mode === "region" ? activeRegion : null,
      });

      await recorderRef.current.start({
        sourceId,
        mode,
        region: mode === "region" ? activeRegion : null,
        includeMic,
        includeSystemAudio,
        includeWebcam,
        webcamShape,
        webcamWindowSourceId,
        frameOrigin,
        sessionId: session.sessionId,
        getWebcamBounds: () => window.knot.getWebcamBounds(),
        onChunk: async (index, blob) => {
          const buffer = await blob.arrayBuffer();
          const saved = await window.knot.saveChunk({
            sessionId: session.sessionId,
            index,
            buffer,
          });
          setChunkCount(index + 1);
          setMessage(`Chunk ${index + 1} saved (${saved.size} bytes)`);
        },
        onError: (error) => {
          setMessage(error.message);
          if (error.message.includes("MediaRecorder error")) {
            void stopRecordingRef.current?.();
          }
        },
      });

      await window.knot.showIndicator();
      await window.knot.setRecordingState("recording");
      setStatus("recording");
      setMessage(`Recording → ${session.outputDir}`);
    } catch (error) {
      await resetAfterFailure();
      setMessage(error instanceof Error ? error.message : "Failed to start recording");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [
    sourceId,
    region,
    mode,
    countdownSeconds,
    includeMic,
    includeSystemAudio,
    includeWebcam,
    webcamShape,
    webcamSize,
    resetAfterFailure,
  ]);

  const stopRecordingRef = useRef<(() => Promise<void>) | null>(null);

  const stopRecording = useCallback(async () => {
    if (statusRef.current !== "recording" && statusRef.current !== "paused") return;

    busyRef.current = true;
    setBusy(true);

    try {
      await recorderRef.current.stop();
      const ended = await window.knot.endSession();
      await window.knot.setRecordingState("idle");
      await window.knot.hideIndicator();
      await window.knot.showControl();
      setStatus("idle");
      setElapsedMs(0);
      setChunkCount(ended.chunkCount ?? 0);
      setMessage(
        ended.outputDir
          ? `Saved ${ended.chunkCount ?? 0} chunk(s) → ${ended.outputDir}`
          : "Recording stopped.",
      );
      await window.knot.notifyRecordingStopped();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to stop recording");
      await resetAfterFailure();
      await window.knot.notifyRecordingStopped();
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [resetAfterFailure]);

  useEffect(() => {
    stopRecordingRef.current = stopRecording;
  }, [stopRecording]);

  const pauseRecording = useCallback(async () => {
    if (status !== "recording") return;
    recorderRef.current.pause();
    await window.knot.setRecordingState("paused");
    setStatus("paused");
  }, [status]);

  const resumeRecording = useCallback(async () => {
    if (status !== "paused") return;
    recorderRef.current.resume();
    await window.knot.setRecordingState("recording");
    setStatus("recording");
  }, [status]);

  const takeScreenshot = useCallback(async () => {
    if (!sourceId) {
      setMessage("Pick a capture source first.");
      return;
    }

    if (recorderRef.current.isRecording) {
      setMessage("Stop recording before taking a screenshot.");
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      let activeRegion = region;

      if (mode === "region" && !activeRegion) {
        const picked = await window.knot.pickRegion();
        if (!picked) {
          return;
        }
        activeRegion = picked;
        setRegion(picked);
      }

      let webcamWindowSourceId: string | null = null;
      if (includeWebcam) {
        await window.knot.showWebcam(webcamShape);
        webcamWindowSourceId = await window.knot.getWebcamCaptureSourceId();
      }

      const frameOrigin = await window.knot.getCaptureFrameOrigin({
        sourceId,
        mode,
        region: mode === "region" ? activeRegion : null,
      });

      const blob = await recorderRef.current.takeScreenshotFrame({
        sourceId,
        mode,
        region: mode === "region" ? activeRegion : null,
        includeWebcam,
        webcamWindowSourceId,
        frameOrigin,
        getWebcamBounds: () => window.knot.getWebcamBounds(),
      });

      const buffer = await blob.arrayBuffer();
      const saved = await window.knot.saveScreenshot({ buffer, format: "png" });
      setMessage(`Screenshot → ${saved.path}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Screenshot failed");
    } finally {
      setBusy(false);
    }
  }, [sourceId, region, mode, includeWebcam, webcamShape]);

  const handleAction = useCallback(
    (action: ControlAction) => {
      if (action === "start-recording") void startRecording();
      if (action === "stop-recording") void stopRecording();
      if (action === "pause-recording") void pauseRecording();
      if (action === "resume-recording") void resumeRecording();
      if (action === "take-screenshot") void takeScreenshot();
      if (action === "toggle-webcam") setIncludeWebcam((v) => !v);
      if (action === "cancel-session") void cancelSession();
    },
    [
      startRecording,
      stopRecording,
      pauseRecording,
      resumeRecording,
      takeScreenshot,
      cancelSession,
    ],
  );

  useEffect(() => {
    const offTray = window.knot.onTrayAction(handleAction);
    const offShortcut = window.knot.onShortcutAction(handleAction);
    const offControl = window.knot.onControlAction(handleAction);
    return () => {
      offTray();
      offShortcut();
      offControl();
    };
  }, [handleAction]);

  useEffect(() => {
    return () => {
      if (recorderRef.current.isRecording) {
        void recorderRef.current.stop();
      }
    };
  }, []);

  const formatElapsed = (ms: number) => {
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60)
      .toString()
      .padStart(2, "0");
    const s = (total % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const isLive = status === "recording" || status === "paused";

  return (
    <div className="control-shell">
      <header className="control-top">
        <div>
          <div className="brand-lockup">
            <BrandMark />
            <div className="brand-copy">
              <h1>Knot</h1>
              <p>Cold capture. Instant chunks. Local first.</p>
            </div>
          </div>

          <div className="status-chip" data-state={status}>
            <span className="status-dot" />
            <span>{status}</span>
            {isLive && (
              <>
                <span>·</span>
                <span>{formatElapsed(elapsedMs)}</span>
                <span>·</span>
                <span>{chunkCount} chunks</span>
              </>
            )}
          </div>
        </div>

        <div className="top-actions">
          <button className="btn-ghost" onClick={() => void window.knot.openDashboard()}>
            Dashboard
          </button>
          <button
            className="btn-ghost"
            onClick={() => void window.knot.openRecordingsFolder(outputDir ?? undefined)}
          >
            Recordings
          </button>
        </div>
      </header>

      <div className="control-grid">
        <section className="panel preview-panel">
          <div className="panel-head">
            <p className="panel-label">Preview</p>
            <button
              className="btn-ghost"
              onClick={() => void refreshSources()}
              disabled={status !== "idle"}
            >
              Refresh
            </button>
          </div>

          <div className="preview-stage">
            {selectedSource ? (
              <>
                <img src={selectedSource.thumbnailDataUrl} alt={selectedSource.name} />
                <div className="preview-meta">
                  <strong>{selectedSource.name}</strong>
                  <span>{mode}</span>
                </div>
              </>
            ) : (
              <p className="preview-empty">
                Grant screen permission, then refresh sources.
              </p>
            )}
          </div>
        </section>

        <section className="panel sources-panel">
          <div className="panel-head">
            <p className="panel-label">Source</p>
            <div className="segment">
              {(["screen", "window", "region"] as CaptureMode[]).map((item) => (
                <button
                  key={item}
                  data-active={mode === item}
                  onClick={() => {
                    setMode(item);
                    setRegion(null);
                  }}
                  disabled={status !== "idle"}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="source-grid">
            {sources.map((source) => (
              <button
                key={source.id}
                className="source-card"
                data-active={sourceId === source.id}
                onClick={() => setSourceId(source.id)}
                disabled={status !== "idle"}
              >
                <img src={source.thumbnailDataUrl} alt={source.name} />
                <span>{source.name}</span>
              </button>
            ))}
            {sources.length === 0 && (
              <p className="preview-empty">No sources yet.</p>
            )}
          </div>

          {mode === "region" && (
            <p className="region-note">
              Region{" "}
              {region
                ? `${region.width}×${region.height} @ ${region.x},${region.y}`
                : "selected on start / screenshot"}
            </p>
          )}
        </section>
      </div>

      <div className="settings-row">
        <section className="panel settings-card">
          <p className="panel-label">Inputs</p>
          <div className="toggle-list">
            <label className="toggle">
              Microphone
              <span className="toggle-switch">
                <input
                  type="checkbox"
                  checked={includeMic}
                  onChange={(e) => setIncludeMic(e.target.checked)}
                  disabled={status !== "idle"}
                />
                <span />
              </span>
            </label>
            <label className="toggle">
              System audio
              <span className="toggle-switch">
                <input
                  type="checkbox"
                  checked={includeSystemAudio}
                  onChange={(e) => setIncludeSystemAudio(e.target.checked)}
                  disabled={status !== "idle"}
                />
                <span />
              </span>
            </label>
            <label className="toggle">
              Webcam overlay
              <span className="toggle-switch">
                <input
                  type="checkbox"
                  checked={includeWebcam}
                  onChange={(e) => setIncludeWebcam(e.target.checked)}
                  disabled={status !== "idle"}
                />
                <span />
              </span>
            </label>
          </div>
        </section>

        <section className="panel settings-card">
          <p className="panel-label">Webcam overlay</p>
          <div className="shape-row">
            {SHAPES.map((shape) => (
              <button
                key={shape}
                className="shape-btn"
                data-active={webcamShape === shape}
                title={shape}
                onClick={() => changeWebcamShape(shape)}
                disabled={status !== "idle"}
              >
                <span className={`shape-ico ${shape}`} />
              </button>
            ))}
          </div>

          <div className="segment size-segment">
            {WEBCAM_SIZES.map((size) => (
              <button
                key={size}
                data-active={webcamSize === size}
                onClick={() => changeWebcamSize(size)}
                disabled={status !== "idle"}
              >
                {size}
              </button>
            ))}
          </div>
        </section>

        <section className="panel settings-card">
          <p className="panel-label">Countdown</p>
          <select
            className="select-cold"
            value={countdownSeconds}
            onChange={(e) => setCountdownSeconds(Number(e.target.value))}
            disabled={status !== "idle"}
          >
            {[0, 3, 5].map((n) => (
              <option key={n} value={n}>
                {n === 0 ? "None" : `${n} seconds`}
              </option>
            ))}
          </select>
        </section>
      </div>

      <section className="action-bar">
        <div className="action-meta">
          <div className="timer">{isLive ? formatElapsed(elapsedMs) : "00:00"}</div>
          <div className="hint">
            {selectedSource?.name ?? "No source"} · ⌘/Ctrl+Shift+R start/stop · P pause · S
            shot
          </div>
        </div>

        <div className="action-buttons">
          <button
            className="btn-secondary"
            onClick={() => void takeScreenshot()}
            disabled={!sourceId || busy}
          >
            Screenshot
          </button>

          {!isLive ? (
            <button
              className="btn-record"
              onClick={() => void startRecording()}
              disabled={!sourceId || busy}
            >
              Start recording
            </button>
          ) : (
            <>
              {status === "recording" ? (
                <button className="btn-secondary" onClick={() => void pauseRecording()}>
                  Pause
                </button>
              ) : (
                <button className="btn-secondary" onClick={() => void resumeRecording()}>
                  Resume
                </button>
              )}
              <button
                className="btn-stop"
                onClick={() => void stopRecording()}
              >
                Stop
              </button>
            </>
          )}
        </div>
      </section>

      {message && <div className="message-toast">{message}</div>}
    </div>
  );
}
