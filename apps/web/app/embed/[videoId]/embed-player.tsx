"use client";

import { useProgressivePlayback } from "@/app/watch/[videoId]/use-progressive-playback";
import type { WatchSegment } from "@/server-actions/video";

type EmbedPlayerProps = {
  videoId: string;
  title: string;
  initialStatus: string;
  initialSegments: WatchSegment[];
};

/** Minimal chrome-less player for iframe embeds (PUBLIC videos only). */
const EmbedPlayer = ({
  videoId,
  title,
  initialStatus,
  initialSegments,
}: EmbedPlayerProps) => {
  const {
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
  } = useProgressivePlayback(videoId, initialStatus, initialSegments);

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <div className="flex flex-1 items-center justify-center">
        {current ? (
          <video
            ref={videoRef}
            className="max-h-screen w-full bg-black"
            controls
            playsInline
            title={title}
            onPlay={() => {
              wantPlayRef.current = true;
            }}
            onPause={() => {
              wantPlayRef.current = false;
            }}
            onEnded={onEnded}
            onError={onError}
          />
        ) : (
          <p className="px-6 text-center text-sm text-neutral-400">
            {isLive
              ? "Recording in progress — playback starts when the first chunk lands."
              : "No segments available yet."}
          </p>
        )}
      </div>

      {(error || isLive || segments.length > 0) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-3 py-2 text-xs text-neutral-400">
          <span className="truncate">{title}</span>
          <span>
            {isLive ? "Live" : status.toLowerCase()}
            {segments.length > 0
              ? ` · ${index + 1}/${segments.length}`
              : null}
            {error ? ` · ${error}` : null}
          </span>
        </div>
      )}
    </div>
  );
};

export { EmbedPlayer };
