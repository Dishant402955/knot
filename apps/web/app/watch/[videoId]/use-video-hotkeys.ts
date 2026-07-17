"use client";

import { useEffect } from "react";

type VideoHotkeysOptions = {
  enabled?: boolean;
  totalDurationSeconds: number;
  nudgeSeconds: (delta: number) => void;
  seekToAbsoluteSeconds: (
    absoluteSeconds: number,
    options?: { play?: boolean },
  ) => void;
  togglePlay: () => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
};

const isTypingTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return Boolean(target.closest("[contenteditable='true']"));
};

/**
 * YouTube-style playback shortcuts when focus is not in a form field.
 * J/L ±10s · ←/→ ±5s · K/Space play-pause · M mute · F fullscreen · 0–9 jump %.
 */
export const useVideoHotkeys = ({
  enabled = true,
  totalDurationSeconds,
  nudgeSeconds,
  seekToAbsoluteSeconds,
  togglePlay,
  toggleMute,
  toggleFullscreen,
}: VideoHotkeysOptions) => {
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;

      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

      switch (key) {
        case " ":
        case "k":
          event.preventDefault();
          togglePlay();
          return;
        case "j":
          event.preventDefault();
          nudgeSeconds(-10);
          return;
        case "l":
          event.preventDefault();
          nudgeSeconds(10);
          return;
        case "ArrowLeft":
          event.preventDefault();
          nudgeSeconds(-5);
          return;
        case "ArrowRight":
          event.preventDefault();
          nudgeSeconds(5);
          return;
        case "m":
          event.preventDefault();
          toggleMute();
          return;
        case "f":
          event.preventDefault();
          toggleFullscreen();
          return;
        default:
          break;
      }

      if (/^[0-9]$/.test(key) && totalDurationSeconds > 0) {
        event.preventDefault();
        const pct = Number(key) / 10;
        seekToAbsoluteSeconds(totalDurationSeconds * pct);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    enabled,
    nudgeSeconds,
    seekToAbsoluteSeconds,
    toggleFullscreen,
    toggleMute,
    togglePlay,
    totalDurationSeconds,
  ]);
};
