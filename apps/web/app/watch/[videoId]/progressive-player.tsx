"use client";

import { CommentsSection } from "@/app/watch/[videoId]/comments-section";
import { useProgressivePlayback } from "@/app/watch/[videoId]/use-progressive-playback";
import { VideoShareActions } from "@/app/watch/[videoId]/video-share-actions";
import type { WatchComment } from "@/server-actions/comment";
import type { WatchSegment } from "@/server-actions/video";

type ProgressivePlayerProps = {
  videoId: string;
  title: string;
  description: string | null;
  initialStatus: string;
  visibility: "PRIVATE" | "PUBLIC" | "AUTHENTICATED";
  shareSlug: string | null;
  ownerUserId: string;
  initialSegments: WatchSegment[];
  initialComments: WatchComment[];
  canComment: boolean;
  isOwner: boolean;
};

const ProgressivePlayer = ({
  videoId,
  title,
  description,
  initialStatus,
  visibility,
  shareSlug,
  ownerUserId,
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
    wantPlayRef,
    onEnded,
    onError,
    getPlaybackSeconds,
  } = useProgressivePlayback(videoId, initialStatus, initialSegments);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
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
              <p className="max-w-2xl text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>

          <VideoShareActions
            videoId={videoId}
            shareSlug={shareSlug}
            visibility={visibility}
          />
        </div>
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
            onError={onError}
          />
        ) : (
          <div className="flex aspect-video items-center justify-center bg-muted px-6 text-center text-sm text-muted-foreground">
            No segments yet. Playback starts when the first chunk is uploaded to
            storage.
          </div>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <CommentsSection
        videoId={videoId}
        initialComments={initialComments}
        canComment={canComment}
        isOwner={isOwner}
        visibility={visibility}
        ownerUserId={ownerUserId}
        getPlaybackSeconds={getPlaybackSeconds}
      />
    </div>
  );
};

export { ProgressivePlayer };
