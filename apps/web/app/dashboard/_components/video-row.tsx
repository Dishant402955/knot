"use client";

import Link from "next/link";
import { format } from "date-fns";

import { Video } from "lucide-react";

import { VideoActions } from "./video-actions";
import { VideoStatusBadge, VideoVisibilityBadge } from "./video-badges";

const VideoRow = ({
  id,
  title,
  description,
  status,
  visibility,
  folderId,
  createdAt,
  updatedAt,
  thumbnailUrl = null,
  shareSlug = null,
  folders = [],
}: {
  id: string;
  title: string;
  description: string | null;
  status: string;
  visibility: "PRIVATE" | "PUBLIC" | "AUTHENTICATED";
  folderId: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  thumbnailUrl?: string | null;
  shareSlug?: string | null;
  folders?: {
    id: string;
    name: string;
    parentId?: string | null;
  }[];
}) => {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3 transition hover:bg-muted/50">
      <Link
        href={`/watch/${id}`}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
          {thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- signed B2 URLs are ephemeral
            <img
              src={thumbnailUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <Video className="h-4 w-4" />
            </div>
          )}
        </div>

        <div className="min-w-0">
          <p className="truncate font-medium">{title}</p>

          {description ? (
            <p className="truncate text-xs text-muted-foreground">
              {description}
            </p>
          ) : (
            <p className="truncate text-xs text-muted-foreground">
              No description
            </p>
          )}
        </div>
      </Link>

      <div className="hidden shrink-0 items-center gap-4 text-sm text-muted-foreground lg:flex">
        <VideoStatusBadge status={status} />
        <VideoVisibilityBadge visibility={visibility} />
        <span>Created {format(new Date(createdAt), "PP")}</span>
        <span>Updated {format(new Date(updatedAt), "PP")}</span>
      </div>

      <div className="shrink-0">
        <VideoActions
          id={id}
          title={title}
          description={description}
          visibility={visibility}
          folderId={folderId}
          shareSlug={shareSlug}
          folders={folders}
        />
      </div>
    </div>
  );
};

export { VideoRow };
