"use client";

import Link from "next/link";
import { format } from "date-fns";

import { Video } from "lucide-react";

import { VideoActions } from "./video-actions";

const VideoRow = ({
  id,
  title,
  description,
  status,
  visibility,
  folderId,
  createdAt,
  updatedAt,
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
        <Video className="h-5 w-5 shrink-0" />

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

      <div className="hidden shrink-0 items-center gap-6 text-sm text-muted-foreground lg:flex">
        <span className="capitalize">{status.toLowerCase()}</span>

        <span className="capitalize">{visibility.toLowerCase()}</span>

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
          folders={folders}
        />
      </div>
    </div>
  );
};

export { VideoRow };
