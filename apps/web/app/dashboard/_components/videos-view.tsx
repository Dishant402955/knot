"use client";

import { useEffect, useState, type ReactNode } from "react";

import { Video } from "lucide-react";

import { VideoCard } from "./video-card";
import { VideoRow } from "./video-row";
import { ViewToggle } from "./view-toggle";

type ViewVideo = {
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
};

const STORAGE_KEY = "knot:videos-view";

const VideosView = ({
  videos,
  folders,
  emptyText = "No videos yet.",
  emptyHint,
  emptyAction,
  title,
}: {
  videos: ViewVideo[];
  folders: {
    id: string;
    name: string;
    parentId?: string | null;
  }[];
  emptyText?: string;
  emptyHint?: string;
  emptyAction?: ReactNode;
  title?: string;
}) => {
  const [view, setView] = useState<"grid" | "list">("grid");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved === "grid" || saved === "list") {
      setView(saved);
    }
  }, []);

  const changeView = (next: "grid" | "list") => {
    setView(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        {title ? (
          <p className="font-semibold text-lg">{title}</p>
        ) : (
          <span />
        )}

        <ViewToggle view={view} onChange={changeView} />
      </div>

      {videos.length > 0 ? (
        view === "grid" ? (
          <div className="flex flex-wrap gap-5">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                id={video.id}
                title={video.title}
                description={video.description}
                status={video.status}
                visibility={video.visibility}
                folderId={video.folderId}
                thumbnailUrl={video.thumbnailUrl}
                shareSlug={video.shareSlug}
                folders={folders}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {videos.map((video) => (
              <VideoRow
                key={video.id}
                id={video.id}
                title={video.title}
                description={video.description}
                status={video.status}
                visibility={video.visibility}
                folderId={video.folderId}
                createdAt={video.createdAt}
                updatedAt={video.updatedAt}
                thumbnailUrl={video.thumbnailUrl}
                shareSlug={video.shareSlug}
                folders={folders}
              />
            ))}
          </div>
        )
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Video className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">{emptyText}</p>
            {emptyHint ? (
              <p className="text-sm text-muted-foreground">{emptyHint}</p>
            ) : null}
          </div>
          {emptyAction ? <div className="pt-1">{emptyAction}</div> : null}
        </div>
      )}
    </div>
  );
};

export { VideosView };
