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

/** Merge polls without replacing URLs for indices we already have (avoids reload). */
const mergeSegments = (
  prev: WatchSegment[],
  next: WatchSegment[],
): WatchSegment[] => {
  const byIndex = new Map(prev.map((s) => [s.index, s]));
  for (const segment of next) {
    if (!byIndex.has(segment.index)) {
      byIndex.set(segment.index, segment);
    }
  }
  return [...byIndex.values()].sort((a, b) => a.index - b.index);
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
  const loadedIndexRef = useRef<number | null>(null);

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
    loadedIndexRef.current = null;
  }, [initialSegments, initialStatus]);

  useEffect(() => {
    if (!isLive) return;

    const timer = window.setInterval(() => {
      void (async () => {
        const res = await getWatchPlaybackState(videoId);
        if (!res.success || !("segments" in res)) return;

        setStatus(res.statusLabel);

        const prevLen = segmentsRef.current.length;
        const merged = mergeSegments(segmentsRef.current, res.segments);
        segmentsRef.current = merged;
        setSegments(merged);

        if (
          wantPlayRef.current &&
          merged.length > prevLen &&
          indexRef.current >= prevLen - 1 &&
          prevLen > 0
        ) {
          const nextIndex = Math.min(prevLen, merged.length - 1);
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

    // Only (re)load when the segment index changes — not when a poll refreshes URLs.
    if (loadedIndexRef.current === current.index) return;
    loadedIndexRef.current = current.index;

    el.src = current.url;
    el.load();
    setError(null);

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
            onError={() => {
              loadedIndexRef.current = null;
              setError("Failed to load this segment. Retrying…");
              void (async () => {
                const res = await getWatchPlaybackState(videoId);
                if (!res.success || !("segments" in res)) return;
                const fresh = res.segments.find(
                  (s) => s.index === indexRef.current,
                );
                if (!fresh) return;
                setSegments((prev) => {
                  const next = prev.map((s) =>
                    s.index === fresh.index ? fresh : s,
                  );
                  segmentsRef.current = next;
                  return next;
                });
              })();
            }}
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
