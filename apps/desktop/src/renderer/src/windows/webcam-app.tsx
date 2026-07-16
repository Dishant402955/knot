import { useEffect, useRef, useState } from "react";

import type { WebcamShape } from "@shared/types";

let cachedStream: MediaStream | null = null;

function releaseCachedStream() {
  cachedStream?.getTracks().forEach((track) => track.stop());
  cachedStream = null;
}

async function getWebcamStream() {
  const live =
    cachedStream?.active &&
    cachedStream.getVideoTracks().some((track) => track.readyState === "live");

  if (live) {
    return cachedStream!;
  }

  releaseCachedStream();

  cachedStream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: { ideal: 640 },
      height: { ideal: 480 },
    },
    audio: false,
  });

  return cachedStream;
}

function attachAndPlay(video: HTMLVideoElement, stream: MediaStream) {
  if (video.srcObject !== stream) {
    video.srcObject = stream;
  }

  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    void video.play().catch(() => undefined);
    return;
  }

  const onReady = () => {
    void video.play().catch(() => undefined);
  };

  video.addEventListener("loadedmetadata", onReady, { once: true });
}

export function WebcamApp() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shape, setShape] = useState<WebcamShape>("circle");
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      try {
        const stream = await getWebcamStream();
        if (cancelled || !videoRef.current) return;

        attachAndPlay(videoRef.current, stream);
        setError(null);
        setReady(true);
      } catch (err) {
        if (cancelled) return;

        const message = err instanceof Error ? err.message : "Camera permission denied";
        if (!message.includes("interrupted")) {
          setError(message);
        }
      }
    };

    void start();

    const offShape = window.knot.onWebcamShape((next) => setShape(next));
    void window.knot.getWebcamBounds().then((bounds) => setShape(bounds.shape));

    return () => {
      cancelled = true;
      offShape();
    };
  }, []);

  useEffect(() => {
    return () => {
      releaseCachedStream();
    };
  }, []);

  useEffect(() => {
    const onPageHide = () => releaseCachedStream();
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, []);

  return (
    <div className="webcam-shell">
      <div className="webcam-drag" />

      <div className={`webcam-frame webcam-frame--${shape}`}>
        <video
          ref={videoRef}
          muted
          playsInline
          autoPlay
          style={{ opacity: ready ? 1 : 0 }}
        />
      </div>

      {!ready && !error && <div className="webcam-loading">Camera…</div>}

      {error && <div className="webcam-error-overlay">{error}</div>}
    </div>
  );
}
