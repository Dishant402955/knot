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
import { useDesktopAuth } from "../lib/desktop-auth";
import { UserProfileMenu } from "./user-profile-menu";

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
  const { mode: authMode, recordingsRoot } = useDesktopAuth();
  const recorderRef = useRef(new CaptureRecorder());
  const busyRef = useRef(false);
  const statusRef = useRef<"idle" | "countdown" | "recording" | "paused">("idle");
  const sessionIdRef = useRef<string | null>(null);
  /** Bumped on cancel/failure so in-flight startRecording cannot resume as recording. */
  const startEpochRef = useRef(0);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const previewStreamRef = useRef<MediaStream | null>(null);
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
  const [outputDir, setOutputDir] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const writeCountRef = useRef(0);

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
        statusPayload.state === "idle" ||
        statusPayload.state === "countdown"
      ) {
        setStatus(statusPayload.state);
      }

      if (statusPayload.state === "recording" || statusPayload.state === "paused") {
        setElapsedMs(statusPayload.elapsedMs);
      }

      if (statusPayload.state === "idle" || statusPayload.state === "countdown") {
        if (statusPayload.state === "idle") {
          setElapsedMs(0);
        }
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

  const stopLivePreview = useCallback(() => {
    previewStreamRef.current?.getTracks().forEach((track) => track.stop());
    previewStreamRef.current = null;
    if (previewVideoRef.current && !recorderRef.current.isRecording) {
      previewVideoRef.current.srcObject = null;
    }
  }, []);

  const startLivePreview = useCallback(
    async (id: string) => {
      stopLivePreview();
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            // @ts-expect-error Electron desktop capture constraint
            mandatory: {
              chromeMediaSource: "desktop",
              chromeMediaSourceId: id,
              maxFrameRate: 15,
            },
          },
        });
        previewStreamRef.current = stream;
        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = stream;
          await previewVideoRef.current.play().catch(() => undefined);
        }
      } catch {
        // Permission / source may be unavailable until refresh.
      }
    },
    [stopLivePreview],
  );

  useEffect(() => {
    if (status !== "idle" || !sourceId || mode === "region") {
      if (status === "idle") stopLivePreview();
      return;
    }

    void startLivePreview(sourceId);
    return () => {
      stopLivePreview();
    };
  }, [sourceId, status, mode, startLivePreview, stopLivePreview]);

  useEffect(() => {
    // Don't fight the recorder while a session is active (window/region mode
    // keeps the overlay closed so the camera can be used for compositing).
    if (status === "countdown" || status === "recording" || status === "paused") {
      return;
    }

    if (includeWebcam) {
      void window.knot.showWebcam(webcamShape);
      void window.knot.setWebcamSize(webcamSize);
    } else {
      void window.knot.hideWebcam();
    }
  }, [includeWebcam, webcamShape, webcamSize, status]);

  const changeWebcamShape = (shape: WebcamShape) => {
    setWebcamShape(shape);
    void window.knot.setWebcamShape(shape);
  };

  const changeWebcamSize = (size: WebcamSize) => {
    setWebcamSize(size);
    void window.knot.setWebcamSize(size);
  };

  const resetAfterFailure = useCallback(async () => {
    startEpochRef.current += 1;

    try {
      await recorderRef.current.stop();
    } catch {
      // Recorder may not have started.
    }

    await window.knot.hideIndicator();
    await window.knot.hideCountdown();
    await window.knot.showControl();

    try {
      await window.knot.discardSession();
    } catch {
      // Session may already be cleared.
    }

    try {
      await window.knot.setRecordingState("idle");
    } catch {
      // Main may already be idle.
    }

    if (includeWebcam) {
      await window.knot.showWebcam(webcamShape);
      await window.knot.setWebcamSize(webcamSize);
    }

    setStatus("idle");
    setElapsedMs(0);
    sessionIdRef.current = null;
  }, [includeWebcam, webcamShape, webcamSize]);

  const cancelSession = useCallback(async () => {
    if (statusRef.current !== "countdown") return;

    await resetAfterFailure();
    setMessage("Countdown cancelled.");
    await window.knot.notifyRecordingStopped();
  }, [resetAfterFailure]);

  const startRecording = useCallback(async () => {
    if (!sourceId || busyRef.current) return;
    if (
      statusRef.current === "countdown" ||
      statusRef.current === "recording" ||
      statusRef.current === "paused"
    ) {
      return;
    }

    busyRef.current = true;
    setBusy(true);
    setMessage(null);

    const epoch = ++startEpochRef.current;
    const stillCurrent = () => epoch === startEpochRef.current;
    const phase = () => statusRef.current;

    try {
      let activeRegion = region;

      if (mode === "region") {
        const picked = await window.knot.pickRegion();
        if (!picked) {
          setMessage("Region selection cancelled.");
          return;
        }
        if (!stillCurrent()) return;
        activeRegion = picked;
        setRegion(picked);
      }

      const session = await window.knot.startSession();
      if (!stillCurrent()) {
        try {
          await window.knot.discardSession();
        } catch {
          // Already discarded.
        }
        return;
      }

      sessionIdRef.current = session.sessionId;
      setOutputDir(session.outputDir);
      writeCountRef.current = 0;
      setStatus("countdown");

      // 1) Tray must be fully painted + ready BEFORE any countdown UI.
      await window.knot.showIndicator();
      if (!stillCurrent() || phase() !== "countdown") return;

      await window.knot.hideControl();
      if (!stillCurrent() || phase() !== "countdown") return;

      const compositeWebcam = includeWebcam && mode !== "screen";

      // Warm capture in the background while the countdown runs, so encoding
      // can start the instant the center timer hits 0 (no post-countdown delay).
      const preparePromise = (async () => {
        if (includeWebcam && mode === "screen") {
          await window.knot.showWebcam(webcamShape);
          await window.knot.setWebcamSize(webcamSize);
        } else {
          await window.knot.hideWebcam();
        }

        stopLivePreview();

        const frameOrigin = await window.knot.getCaptureFrameOrigin({
          sourceId,
          mode,
          region: mode === "region" ? activeRegion : null,
        });

        await recorderRef.current.prepare({
          sourceId,
          mode,
          region: mode === "region" ? activeRegion : null,
          includeMic,
          includeSystemAudio,
          compositeWebcam,
          webcamShape,
          frameOrigin,
          sessionId: session.sessionId,
          getWebcamBounds: () => window.knot.getWebcamBounds(),
          onChunk: async (index, blob) => {
            if (blob.size === 0) return;
            if (epoch !== startEpochRef.current) return;

            const buffer = await blob.arrayBuffer();
            const activeSessionId = sessionIdRef.current ?? session.sessionId;
            const saved = await window.knot.saveChunk({
              sessionId: activeSessionId,
              index,
              buffer,
            });
            writeCountRef.current = Math.max(writeCountRef.current, index + 1);
            setMessage(`Chunk ${index + 1} · ${(saved.size / 1024).toFixed(0)} KB`);
          },
          onError: (error) => {
            setMessage(error.message);
            if (error.message.includes("MediaRecorder error")) {
              void stopRecordingRef.current?.();
            }
          },
        });
      })();

      // 2) Only now show the center countdown (tray is already ready).
      //    Prepare continues in parallel — we await it AFTER the timer so a
      //    slow prepare never blocks the countdown from starting.
      if (countdownSeconds > 0) {
        const countdownResult = await window.knot.runCountdown(countdownSeconds);
        if (!countdownResult.completed || !stillCurrent() || phase() !== "countdown") {
          void preparePromise.catch(() => undefined);
          try {
            await recorderRef.current.stop();
          } catch {
            // Prepare-only cleanup.
          }
          return;
        }
      }

      try {
        await preparePromise;
      } catch (prepareError) {
        if (!stillCurrent()) return;
        throw prepareError;
      }

      if (!stillCurrent() || phase() !== "countdown") {
        try {
          await recorderRef.current.stop();
        } catch {
          // Ignore.
        }
        return;
      }

      // 3) Timer done → start encoding + flip tray to "recording" immediately.
      recorderRef.current.commit();
      await window.knot.setRecordingState("recording");
      setStatus("recording");
      setMessage(`Recording → ${session.outputDir}`);

      const live = recorderRef.current.getLiveStream();
      if (live && previewVideoRef.current) {
        previewVideoRef.current.srcObject = live;
        void previewVideoRef.current.play().catch(() => undefined);
      }
    } catch (error) {
      if (!stillCurrent()) return;
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
    stopLivePreview,
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

      if (includeWebcam) {
        await window.knot.showWebcam(webcamShape);
        await window.knot.setWebcamSize(webcamSize);
      }

      await window.knot.showControl();
      setStatus("idle");
      setElapsedMs(0);
      sessionIdRef.current = null;
      writeCountRef.current = 0;
      setMessage(
        ended.outputDir
          ? `Saved → ${ended.outputDir}\nEach chunk-*.webm plays on its own.`
          : recordingsRoot
            ? `Recording saved under:\n${recordingsRoot}`
            : "Recording stopped.",
      );
      stopLivePreview();
      if (sourceId && mode !== "region") {
        void startLivePreview(sourceId);
      }
      await window.knot.notifyRecordingStopped();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to stop recording");
      await resetAfterFailure();
      await window.knot.notifyRecordingStopped();
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [resetAfterFailure, recordingsRoot, includeWebcam, webcamShape, webcamSize, sourceId, mode, startLivePreview, stopLivePreview]);

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

      const compositeWebcam = includeWebcam && mode !== "screen";

      // Hide Knot UI so it isn't in the shot.
      await window.knot.hideControl();

      if (includeWebcam && mode === "screen") {
        await window.knot.showWebcam(webcamShape);
        await window.knot.setWebcamSize(webcamSize);
      } else if (compositeWebcam) {
        await window.knot.hideWebcam();
      }

      // Give Windows a beat to remove the control window from the desktop frame.
      await new Promise((r) => setTimeout(r, 250));

      const frameOrigin = await window.knot.getCaptureFrameOrigin({
        sourceId,
        mode,
        region: mode === "region" ? activeRegion : null,
      });

      const blob = await recorderRef.current.takeScreenshotFrame({
        sourceId,
        mode,
        region: mode === "region" ? activeRegion : null,
        compositeWebcam,
        frameOrigin,
        getWebcamBounds: () => window.knot.getWebcamBounds(),
      });

      const buffer = await blob.arrayBuffer();
      const saved = await window.knot.saveScreenshot({ buffer, format: "png" });
      setMessage(`Screenshot â†’ ${saved.path}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Screenshot failed");
    } finally {
      if (includeWebcam) {
        await window.knot.showWebcam(webcamShape);
        await window.knot.setWebcamSize(webcamSize);
      }
      await window.knot.showControl();
      setBusy(false);
    }
  }, [sourceId, region, mode, includeWebcam, webcamShape, webcamSize]);

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
    <div className="control-shell control-shell--compact">
      <header className="control-top">
        <div className="brand-lockup">
          <BrandMark />
          <div className="brand-copy">
            <h1>Knot</h1>
            <div className="status-chip" data-state={status}>
              <span className="status-dot" />
              <span>{status}</span>
              {isLive && (
                <>
                  <span>·</span>
                  <span>{formatElapsed(elapsedMs)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="top-actions">
          {authMode === "online" ? (
            <UserProfileMenu />
          ) : (
            <span className="account-chip account-chip--offline">Offline</span>
          )}
          <button
            className="btn-ghost"
            onClick={() =>
              void window.knot.openRecordingsFolder(outputDir ?? recordingsRoot ?? undefined)
            }
          >
            Folder
          </button>
        </div>
      </header>

      <div className="control-grid control-grid--compact">
        <section className="panel preview-panel">
          <div className="panel-head">
            <p className="panel-label">Live preview</p>
            <button
              className="btn-ghost"
              onClick={() => void refreshSources()}
              disabled={status !== "idle"}
            >
              Refresh
            </button>
          </div>

          <div className="preview-stage">
            <video
              ref={previewVideoRef}
              className="preview-video"
              muted
              playsInline
              autoPlay
            />
            {!selectedSource && (
              <p className="preview-empty">Pick a source to preview.</p>
            )}
            {selectedSource && mode === "region" && status === "idle" && (
              <p className="preview-empty">Region selected when you record.</p>
            )}
            {selectedSource && (
              <div className="preview-meta">
                <strong>{selectedSource.name}</strong>
                <span>{mode}</span>
              </div>
            )}
          </div>
        </section>

        <aside className="side-rail">
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

            <div className="source-grid source-grid--compact">
              {sources.map((source) => (
                <button
                  key={source.id}
                  className="source-card"
                  data-active={sourceId === source.id}
                  onClick={() => setSourceId(source.id)}
                  disabled={status !== "idle"}
                >
                  <img src={source.thumbnailDataUrl} alt="" />
                  <span>{source.name}</span>
                </button>
              ))}
              {sources.length === 0 && (
                <p className="preview-empty">No sources yet.</p>
              )}
            </div>
          </section>

          <section className="panel settings-card settings-card--compact">
            <p className="panel-label">Capture</p>
            <div className="toggle-list">
              <label className="toggle">
                Mic
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
                System
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
                Cam
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

            {includeWebcam && (
              <>
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
                      {size[0]!.toUpperCase()}
                    </button>
                  ))}
                </div>
              </>
            )}

            <label className="countdown-field">
              <span>Countdown</span>
              <select
                className="select-cold"
                value={countdownSeconds}
                onChange={(e) => setCountdownSeconds(Number(e.target.value))}
                disabled={status !== "idle"}
              >
                {[0, 3, 5].map((n) => (
                  <option key={n} value={n}>
                    {n === 0 ? "Off" : `${n}s`}
                  </option>
                ))}
              </select>
            </label>
          </section>
        </aside>
      </div>

      <section className="action-bar">
        <div className="action-meta">
          <div className="timer">{isLive ? formatElapsed(elapsedMs) : "00:00"}</div>
          <div className="hint">
            {message ??
              `${selectedSource?.name ?? "No source"} · Ctrl+Shift+R record · S shot`}
          </div>
        </div>

        <div className="action-buttons">
          <button
            className="btn-secondary"
            onClick={() => void takeScreenshot()}
            disabled={!sourceId || busy || isLive}
          >
            Shot
          </button>

          {!isLive ? (
            <button
              className="btn-record"
              onClick={() => void startRecording()}
              disabled={!sourceId || busy || status === "countdown"}
            >
              Record
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
              <button className="btn-stop" onClick={() => void stopRecording()}>
                Stop
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
