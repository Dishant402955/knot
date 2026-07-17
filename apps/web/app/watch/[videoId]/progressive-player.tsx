"use client";

import { VideoStatusBadge, VideoVisibilityBadge } from "@/app/dashboard/_components/video-badges";
import { CommentsSection } from "@/app/watch/[videoId]/comments-section";
import { useProgressivePlayback } from "@/app/watch/[videoId]/use-progressive-playback";
import { useVideoHotkeys } from "@/app/watch/[videoId]/use-video-hotkeys";
import { VideoShareActions } from "@/app/watch/[videoId]/video-share-actions";
import { Button } from "@/components/ui/button";
import type { WatchComment } from "@/server-actions/comment";
import type { WatchSegment } from "@/server-actions/video";

import { RotateCcw } from "lucide-react";

type ProgressivePlayerProps = {
  videoId: string;
  title: string;
  description: string | null;
  initialStatus: string;
  visibility: "PRIVATE" | "PUBLIC" | "AUTHENTICATED";
  shareSlug: string | null;
  ownerUserId: string;
  durationSeconds: number | null;
  thumbnailUrl?: string | null;
  initialSegments: WatchSegment[];
  initialComments: WatchComment[];
  canComment: boolean;
  isOwner: boolean;
};

const formatClock = (totalSeconds: number) => {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  }
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const ProgressivePlayer = ({
  videoId,
  title,
  description,
  initialStatus,
  visibility,
  shareSlug,
  ownerUserId,
  durationSeconds,
  thumbnailUrl = null,
  initialSegments,
  initialComments,
  canComment,
  isOwner,
}: ProgressivePlayerProps) => {
  const {
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
    retry,
    getPlaybackSeconds,
    seekToAbsoluteSeconds,
    nudgeSeconds,
    togglePlay,
    toggleMute,
    toggleFullscreen,
  } = useProgressivePlayback(videoId, initialStatus, initialSegments);

  const displayDuration =
    durationSeconds && durationSeconds > 0
      ? durationSeconds
      : totalDurationSeconds > 0
        ? totalDurationSeconds
        : null;

  useVideoHotkeys({
    enabled: Boolean(current),
    totalDurationSeconds: displayDuration ?? totalDurationSeconds,
    nudgeSeconds,
    seekToAbsoluteSeconds,
    togglePlay,
    toggleMute,
    toggleFullscreen,
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      <div
        className="relative overflow-hidden rounded-xl border bg-black shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        tabIndex={0}
        aria-label="Video player. Shortcuts: K play pause, J L seek, M mute, F fullscreen"
      >
        {current ? (
          <>
            <video
              ref={videoRef}
              className="aspect-video w-full bg-black"
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
            {isSeeking ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40">
                <span className="rounded-full bg-background/90 px-3 py-1 text-xs font-medium text-foreground">
                  Seeking…
                </span>
              </div>
            ) : null}
          </>
        ) : (
          <div className="relative flex aspect-video flex-col items-center justify-center gap-2 overflow-hidden bg-muted/40 px-6 text-center">
            {thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- signed B2 URLs are ephemeral
              <img
                src={thumbnailUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-40"
              />
            ) : null}
            <p className="relative text-sm font-medium text-foreground">
              {isLive ? "Waiting for first chunk…" : "No video yet"}
            </p>
            <p className="relative max-w-sm text-sm text-muted-foreground">
              {isLive
                ? "Playback starts as soon as the first segment uploads."
                : "This recording has no playable segments."}
            </p>
          </div>
        )}

        {isLive ? (
          <div className="absolute left-3 top-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow">
              <span className="size-1.5 animate-pulse rounded-full bg-white" />
              Live
            </span>
            {segments.length > 0 ? (
              <span className="rounded-full bg-black/70 px-2 py-1 text-[11px] text-white/90 backdrop-blur-sm">
                Part {index + 1}/{segments.length}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <p className="text-[11px] text-muted-foreground">
        Shortcuts:{" "}
        <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">
          K
        </kbd>{" "}
        play/pause ·{" "}
        <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">
          J
        </kbd>
        /
        <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">
          L
        </kbd>{" "}
        ±10s ·{" "}
        <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">
          M
        </kbd>{" "}
        mute ·{" "}
        <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">
          F
        </kbd>{" "}
        fullscreen
      </p>

      {error ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
          <p className="flex-1 text-sm text-destructive">{error}</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="cursor-pointer"
            onClick={() => void retry()}
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <h1 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
            {title}
          </h1>

          <div className="flex flex-wrap items-center gap-2">
            <VideoStatusBadge status={status} />
            <VideoVisibilityBadge visibility={visibility} />
            {displayDuration != null ? (
              <span className="text-xs tabular-nums text-muted-foreground">
                {formatClock(displayDuration)}
              </span>
            ) : null}
            {isLive && segments.length > 0 ? (
              <span className="text-xs text-muted-foreground">
                Still uploading · segment {index + 1} of {segments.length}
              </span>
            ) : null}
          </div>

          {description ? (
            <p className="max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>

        <VideoShareActions
          videoId={videoId}
          shareSlug={shareSlug}
          visibility={visibility}
        />
      </div>

      <CommentsSection
        videoId={videoId}
        initialComments={initialComments}
        canComment={canComment}
        isOwner={isOwner}
        visibility={visibility}
        ownerUserId={ownerUserId}
        getPlaybackSeconds={getPlaybackSeconds}
        onSeekTo={(seconds) => seekToAbsoluteSeconds(seconds, { play: true })}
      />
    </div>
  );
};

export { ProgressivePlayer };
