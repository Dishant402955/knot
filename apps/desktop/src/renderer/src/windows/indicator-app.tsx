import { useEffect, useState } from "react";

import type { RecordingStatusPayload } from "@shared/types";

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
    });

    void window.knot.getRecordingState().then((payload) => {
      setStatus(payload as RecordingStatusPayload);
    });

    return () => {
      off();
    };
  }, []);

  const elapsed = status.elapsedMs;

  const total = Math.floor(elapsed / 1000);
  const mm = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const ss = (total % 60).toString().padStart(2, "0");

  return (
    <div className="indicator-shell">
      <div className="indicator-left">
        <span
          className="status-dot"
          style={{
            background: status.state === "paused" ? "var(--warn)" : "var(--record)",
            animation:
              status.state === "recording" ? "pulse-dot 1.2s ease-in-out infinite" : "none",
          }}
        />
        <strong>{status.state}</strong>
        <span className="mono">
          {mm}:{ss}
        </span>
        <span className="mono">{status.chunkCount} chunks</span>
      </div>

      <div className="indicator-actions">
        <button
          onClick={() =>
            void window.knot.emitControlAction(
              status.state === "paused" ? "resume-recording" : "pause-recording",
            )
          }
        >
          {status.state === "paused" ? "Resume" : "Pause"}
        </button>
        <button
          className="stop"
          onClick={() => void window.knot.emitControlAction("stop-recording")}
        >
          Stop
        </button>
      </div>
    </div>
  );
}
