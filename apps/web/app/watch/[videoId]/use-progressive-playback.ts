"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  getWatchPlaybackState,
  type WatchSegment,
} from "@/server-actions/video";

const POLL_BASE_MS = 2500;
const POLL_MAX_MS = 8000;

const mergeSegments = (
  prev: WatchSegment[],
  next: WatchSegment[],
): WatchSegment[] => {
  if (next.length === 0) return prev;

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
  const loadedKeyRef = useRef<string | null>(null);
  const pendingSeekRef = useRef<number | null>(null);
  const pollDelayRef = useRef(POLL_BASE_MS);
  const pollTimerRef = useRef<number | null>(null);

  const [segments, setSegments] = useState(initialSegments);
  const [status, setStatus] = useState(initialStatus);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSeeking, setIsSeeking] = useState(false);

  const current = segments[index] ?? null;
  const isLive = status === "RECORDING" || status === "PROCESSING";

  useEffect(() => {
    segmentsRef.current = segments;
  }, [segments]);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  // Reset only when navigating to a different video — not on RSC refreshes.
  useEffect(() => {
    setSegments(initialSegments);
    segmentsRef.current = initialSegments;
    setStatus(initialStatus);
    setIndex(0);
    indexRef.current = 0;
    loadedKeyRef.current = null;
    pendingSeekRef.current = null;
    wantPlayRef.current = false;
    pollDelayRef.current = POLL_BASE_MS;
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional videoId gate
  }, [videoId]);

  const clearPollTimer = () => {
    if (pollTimerRef.current != null) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const pollOnce = useCallback(async () => {
    const res = await getWatchPlaybackState(
      videoId,
      segmentsRef.current.length,
    );
    if (!res.success || !("segments" in res)) return;

    setStatus(res.statusLabel);

    const prevLen = segmentsRef.current.length;
    const merged = mergeSegments(segmentsRef.current, res.segments);
    segmentsRef.current = merged;
    setSegments(merged);

    if (merged.length > prevLen) {
      pollDelayRef.current = POLL_BASE_MS;
    } else {
      pollDelayRef.current = Math.min(
        POLL_MAX_MS,
        Math.round(pollDelayRef.current * 1.35),
      );
    }

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
  }, [videoId]);

  useEffect(() => {
    if (!isLive) {
      clearPollTimer();
      return;
    }

    let cancelled = false;

    const schedule = () => {
      clearPollTimer();
      pollTimerRef.current = window.setTimeout(() => {
        void (async () => {
          if (cancelled) return;
          if (document.visibilityState === "hidden") return;
          try {
            await pollOnce();
          } finally {
            if (!cancelled && document.visibilityState === "visible") {
              schedule();
            }
          }
        })();
      }, pollDelayRef.current);
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        clearPollTimer();
        return;
      }
      pollDelayRef.current = POLL_BASE_MS;
      void pollOnce().finally(() => {
        if (!cancelled) schedule();
      });
    };

    if (document.visibilityState === "visible") {
      schedule();
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      clearPollTimer();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isLive, pollOnce]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !current) return;

    const loadKey = `${current.index}:${current.url}`;
    if (loadedKeyRef.current === loadKey) return;
    loadedKeyRef.current = loadKey;

    el.src = current.url;
    el.load();
    setError(null);

    const applyPendingSeek = () => {
      const seekTo = pendingSeekRef.current;
      if (seekTo == null) return;
      pendingSeekRef.current = null;
      if (Number.isFinite(el.duration) && el.duration > 0) {
        el.currentTime = Math.min(seekTo, Math.max(0, el.duration - 0.05));
      } else {
        el.currentTime = seekTo;
      }
      setIsSeeking(false);
    };

    const onLoaded = () => {
      applyPendingSeek();
      if (wantPlayRef.current) {
        void el.play().catch(() => {
          wantPlayRef.current = false;
        });
      }
    };

    el.addEventListener("loadedmetadata", onLoaded, { once: true });

    if (wantPlayRef.current && el.readyState >= 1) {
      onLoaded();
    }

    return () => {
      el.removeEventListener("loadedmetadata", onLoaded);
    };
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

  const refreshCurrentSegment = useCallback(async () => {
    loadedKeyRef.current = null;
    setError("Failed to load this segment. Retrying…");

    const res = await getWatchPlaybackState(videoId, indexRef.current);
    if (!res.success || !("segments" in res)) {
      setError("Failed to load this segment. Try again.");
      return;
    }

    const fresh = res.segments.find((s) => s.index === indexRef.current);
    if (!fresh) {
      // Fall back to full resign from 0 if the index filter missed it
      const full = await getWatchPlaybackState(videoId, 0);
      if (!full.success || !("segments" in full)) {
        setError("Failed to load this segment. Try again.");
        return;
      }
      const found = full.segments.find((s) => s.index === indexRef.current);
      if (!found) {
        setError("Failed to load this segment. Try again.");
        return;
      }
      setSegments((prev) => {
        const next = mergeSegments(prev, [found]);
        segmentsRef.current = next;
        return next;
      });
      setError(null);
      return;
    }

    setSegments((prev) => {
      const next = mergeSegments(prev, [fresh]);
      segmentsRef.current = next;
      return next;
    });
    setError(null);
  }, [videoId]);

  const onError = useCallback(() => {
    void refreshCurrentSegment();
  }, [refreshCurrentSegment]);

  const getPlaybackSecondsPrecise = useCallback(() => {
    const el = videoRef.current;
    if (!el || !Number.isFinite(el.currentTime)) return 0;

    let offset = 0;
    for (let i = 0; i < indexRef.current; i += 1) {
      offset += segmentsRef.current[i]?.durationSeconds ?? 0;
    }

    return offset + el.currentTime;
  }, []);

  const getPlaybackSeconds = useCallback(() => {
    const el = videoRef.current;
    if (!el || !Number.isFinite(el.currentTime)) return null;
    return Math.floor(getPlaybackSecondsPrecise());
  }, [getPlaybackSecondsPrecise]);

  const seekToAbsoluteSeconds = useCallback(
    (absoluteSeconds: number, options?: { play?: boolean }) => {
      const list = segmentsRef.current;
      if (list.length === 0) return;

      const shouldPlay = options?.play ?? wantPlayRef.current;
      let remaining = Math.max(0, absoluteSeconds);

      for (let i = 0; i < list.length; i += 1) {
        const dur = Math.max(0, list[i]?.durationSeconds ?? 0);
        const isLast = i === list.length - 1;

        if (dur <= 0 && !isLast) continue;

        if (!isLast && remaining >= dur) {
          remaining -= dur;
          continue;
        }

        const localTime =
          dur > 0 ? Math.min(remaining, Math.max(0, dur - 0.05)) : 0;
        wantPlayRef.current = shouldPlay;

        if (indexRef.current === i) {
          const el = videoRef.current;
          if (el) {
            el.currentTime = localTime;
            if (shouldPlay) {
              void el.play().catch(() => {
                wantPlayRef.current = false;
              });
            } else {
              el.pause();
            }
          }
          return;
        }

        setIsSeeking(true);
        pendingSeekRef.current = localTime;
        indexRef.current = i;
        setIndex(i);
        return;
      }
    },
    [],
  );

  const nudgeSeconds = useCallback(
    (delta: number) => {
      seekToAbsoluteSeconds(getPlaybackSecondsPrecise() + delta);
    },
    [getPlaybackSecondsPrecise, seekToAbsoluteSeconds],
  );

  const togglePlay = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;

    if (el.paused) {
      wantPlayRef.current = true;
      void el.play().catch(() => {
        wantPlayRef.current = false;
      });
    } else {
      wantPlayRef.current = false;
      el.pause();
    }
  }, []);

  const toggleMute = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;

    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
      return;
    }

    void el.requestFullscreen?.().catch(() => undefined);
  }, []);

  const totalDurationSeconds = segments.reduce(
    (sum, s) => sum + (s.durationSeconds || 0),
    0,
  );

  return {
    videoRef,
    current,
    segments,
    status,
    index,
    error,
    isLive,
    isSeeking,
    totalDurationSeconds,
    wantPlayRef,
    onEnded,
    onError,
    retry: refreshCurrentSegment,
    getPlaybackSeconds,
    seekToAbsoluteSeconds,
    nudgeSeconds,
    togglePlay,
    toggleMute,
    toggleFullscreen,
  };
}
