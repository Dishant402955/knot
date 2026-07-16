import { useEffect, useState } from "react";

import type { RecordingStatusPayload } from "@shared/types";

function signalPaintedReady() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.knot.notifyIndicatorReady();
    });
  });
}

export function IndicatorApp() {
  const [status, setStatus] = useState<RecordingStatusPayload>({
    state: "idle",
    sessionId: null,
    chunkCount: 0,
    startedAt: null,
    outputDir: null,
    elapsedMs: 0,
  });

  useEffect(() => {
    const off = window.knot.onIndicatorUpdate((payload) => {
      setStatus(payload as RecordingStatusPayload);
      // Main's showIndicator waits for this after each update push.
      signalPaintedReady();
    });

    void window.knot.getRecordingState().then((payload) => {
      setStatus(payload as RecordingStatusPayload);
      signalPaintedReady();
    });

    // Also signal on first mount paint (window may already be warm).
    signalPaintedReady();

    return () => {
      off();
    };
  }, []);

  const isCountdown = status.state === "countdown";
  const isPaused = status.state === "paused";
  const isRecording = status.state === "recording";

  const elapsed = status.elapsedMs;
  const total = Math.floor(elapsed / 1000);
  const mm = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const ss = (total % 60).toString().padStart(2, "0");

  const label = isCountdown
    ? "starting"
    : isPaused
      ? "paused"
      : isRecording
        ? "recording"
        : status.state;

  return (
    <div className="indicator-shell">
      <div className="indicator-left">
        <span
          className="status-dot"
          style={{
            background: isPaused ? "var(--warn)" : "var(--record)",
            animation:
              isRecording || isCountdown
                ? "pulse-dot 1.2s ease-in-out infinite"
                : "none",
          }}
        />
        <strong>{label}</strong>
        {!isCountdown && (
          <>
            <span className="mono">
              {mm}:{ss}
            </span>
            <span className="mono">{status.chunkCount} chunks</span>
          </>
        )}
        {isCountdown && <span className="mono">get ready…</span>}
      </div>

      <div className="indicator-actions">
        {isCountdown ? (
          <button
            className="stop"
            onClick={() => void window.knot.emitControlAction("cancel-session")}
          >
            Cancel
          </button>
        ) : (
          <>
            <button
              onClick={() =>
                void window.knot.emitControlAction(
                  isPaused ? "resume-recording" : "pause-recording",
                )
              }
            >
              {isPaused ? "Resume" : "Pause"}
            </button>
            <button
              className="stop"
              onClick={() => void window.knot.emitControlAction("stop-recording")}
            >
              Stop
            </button>
          </>
        )}
      </div>
    </div>
  );
}
