"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  getWatchPlaybackState,
  type WatchSegment,
} from "@/server-actions/video";

const mergeSegments = (
  prev: WatchSegment[],
  next: WatchSegment[],
): WatchSegment[] => {
  const byIndex = new Map(prev.map((s) => [s.index, s]));
  for (const segment of next) {
    byIndex.set(segment.index, segment);
  }
  return [...byIndex.values()].sort((a, b) => a.index - b.index);
};

/** Shared progressive WebM playback used by watch + embed players. */
export function useProgressivePlayback(
  videoId: string,
  initialStatus: string,
  initialSegments: WatchSegment[],
) {
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

  const onError = useCallback(() => {
    loadedIndexRef.current = null;
    setError("Failed to load this segment. Retrying…");
    void (async () => {
      const res = await getWatchPlaybackState(videoId);
      if (!res.success || !("segments" in res)) return;
      const fresh = res.segments.find((s) => s.index === indexRef.current);
      if (!fresh) return;
      setSegments((prev) => {
        const next = prev.map((s) => (s.index === fresh.index ? fresh : s));
        segmentsRef.current = next;
        return next;
      });
    })();
  }, [videoId]);

  const getPlaybackSeconds = useCallback(() => {
    const el = videoRef.current;
    if (!el || !Number.isFinite(el.currentTime)) return null;

    let offset = 0;
    for (let i = 0; i < indexRef.current; i += 1) {
      offset += segmentsRef.current[i]?.durationSeconds ?? 0;
    }

    return Math.floor(offset + el.currentTime);
  }, []);

  return {
    videoRef,
    current,
    segments,
    status,
    index,
    error,
    isLive,
    wantPlayRef,
    onEnded,
    onError,
    getPlaybackSeconds,
  };
}
