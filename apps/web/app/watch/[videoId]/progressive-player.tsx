"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getWatchPlaybackState, type WatchSegment } from "@/server-actions/video";

type ProgressivePlayerProps = {
  videoId: string;
  title: string;
  description: string | null;
  initialStatus: string;
  initialSegments: WatchSegment[];
};

const ProgressivePlayer = ({
  videoId,
  title,
  description,
  initialStatus,
  initialSegments,
}: ProgressivePlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const segmentsRef = useRef(initialSegments);
  const indexRef = useRef(0);
  const wantPlayRef = useRef(false);

  const [segments, setSegments] = useState(initialSegments);
  const [status, setStatus] = useState(initialStatus);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const current = segments[index] ?? null;
  const isLive = status === "RECORDING" || status === "PROCESSING";

  useEffect(() => {
    segmentsRef.current = segments;
  }, [segments]);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  useEffect(() => {
    setSegments(initialSegments);
    segmentsRef.current = initialSegments;
    setStatus(initialStatus);
  }, [initialSegments, initialStatus]);

  useEffect(() => {
    if (!isLive) return;

    const timer = window.setInterval(() => {
      void (async () => {
        const res = await getWatchPlaybackState(videoId);
        if (!res.success || !("segments" in res)) return;

        setStatus(res.statusLabel);

        const prevLen = segmentsRef.current.length;
        const next = res.segments;
        segmentsRef.current = next;
        setSegments(next);

        // If we were stuck on the last finished segment, advance into new ones.
        if (
          wantPlayRef.current &&
          next.length > prevLen &&
          indexRef.current >= prevLen - 1 &&
          prevLen > 0
        ) {
          const nextIndex = Math.min(prevLen, next.length - 1);
          indexRef.current = nextIndex;
          setIndex(nextIndex);
        }
      })();
    }, 2500);

    return () => window.clearInterval(timer);
  }, [isLive, videoId]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !current) return;

    el.src = current.url;
    el.load();

    if (wantPlayRef.current) {
      void el.play().catch(() => {
        wantPlayRef.current = false;
      });
    }
  }, [current?.index, current?.url]);

  const onEnded = useCallback(() => {
    const list = segmentsRef.current;
    const nextIndex = indexRef.current + 1;

    if (nextIndex < list.length) {
      wantPlayRef.current = true;
      indexRef.current = nextIndex;
      setIndex(nextIndex);
      return;
    }

    wantPlayRef.current = false;
  }, []);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="font-bold text-3xl">{title}</h1>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="capitalize">{status.toLowerCase()}</span>
            {isLive && <span>Still recording…</span>}
            {segments.length > 0 && (
              <span>
                Segment {index + 1} of {segments.length}
              </span>
            )}
          </div>
        </div>

        {description && (
          <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border bg-black">
        {current ? (
          <video
            ref={videoRef}
            className="aspect-video w-full bg-black"
            controls
            playsInline
            onPlay={() => {
              wantPlayRef.current = true;
            }}
            onPause={() => {
              wantPlayRef.current = false;
            }}
            onEnded={onEnded}
            onError={() => setError("Failed to load this segment.")}
          />
        ) : (
          <div className="flex aspect-video items-center justify-center bg-muted px-6 text-center text-sm text-muted-foreground">
            No segments yet. Playback starts when the first chunk is uploaded to
            storage.
          </div>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};

export { ProgressivePlayer };
