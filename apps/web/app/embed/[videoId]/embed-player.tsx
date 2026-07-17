"use client";

import { useProgressivePlayback } from "@/app/watch/[videoId]/use-progressive-playback";
import { useVideoHotkeys } from "@/app/watch/[videoId]/use-video-hotkeys";
import type { WatchSegment } from "@/server-actions/video";

type EmbedPlayerProps = {
  videoId: string;
  title: string;
  initialStatus: string;
  initialSegments: WatchSegment[];
  thumbnailUrl?: string | null;
};

/** Minimal chrome-less player for iframe embeds (PUBLIC videos only). */
const EmbedPlayer = ({
  videoId,
  title,
  initialStatus,
  initialSegments,
  thumbnailUrl = null,
}: EmbedPlayerProps) => {
  const {
    videoRef,
    current,
    segments,
    status,
    index,
    error,
    isLive,
    totalDurationSeconds,
    wantPlayRef,
    onEnded,
    onError,
    retry,
    nudgeSeconds,
    seekToAbsoluteSeconds,
    togglePlay,
    toggleMute,
    toggleFullscreen,
  } = useProgressivePlayback(videoId, initialStatus, initialSegments);

  useVideoHotkeys({
    enabled: Boolean(current),
    totalDurationSeconds,
    nudgeSeconds,
    seekToAbsoluteSeconds,
    togglePlay,
    toggleMute,
    toggleFullscreen,
  });

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <div className="relative flex flex-1 items-center justify-center">
        {current ? (
          <video
            ref={videoRef}
            className="max-h-screen w-full bg-black"
            controls
            playsInline
            preload="auto"
            poster={thumbnailUrl ?? undefined}
            title={title}
            onPlay={() => {
              wantPlayRef.current = true;
            }}
            onPause={() => {
              wantPlayRef.current = false;
            }}
            onEnded={onEnded}
            onError={onError}
            onDoubleClick={() => toggleFullscreen()}
          />
        ) : (
          <div className="relative flex min-h-[40vh] w-full items-center justify-center">
            {thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- signed B2 URLs are ephemeral
              <img
                src={thumbnailUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-40"
              />
            ) : null}
            <p className="relative px-6 text-center text-sm text-neutral-400">
              {isLive
                ? "Recording in progress — playback starts when the first chunk lands."
                : "No segments available yet."}
            </p>
          </div>
        )}
      </div>

      {(error || isLive || segments.length > 0) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-3 py-2 text-xs text-neutral-400">
          <span className="truncate">{title}</span>
          <span className="flex items-center gap-2">
            <span>
              {isLive ? "Live" : status.toLowerCase()}
              {segments.length > 0
                ? ` · ${index + 1}/${segments.length}`
                : null}
              {error ? ` · ${error}` : null}
            </span>
            {error ? (
              <button
                type="button"
                className="cursor-pointer underline underline-offset-2 hover:text-white"
                onClick={() => void retry()}
              >
                Retry
              </button>
            ) : null}
          </span>
        </div>
      )}
    </div>
  );
};

export { EmbedPlayer };
