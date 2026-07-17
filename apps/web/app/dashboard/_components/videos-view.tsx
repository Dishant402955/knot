"use client";

import { useEffect, useState } from "react";

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
};

const STORAGE_KEY = "knot:videos-view";

const VideosView = ({
  videos,
  folders,
  emptyText = "No videos yet.",
  title,
}: {
  videos: ViewVideo[];
  folders: {
    id: string;
    name: string;
    parentId?: string | null;
  }[];
  emptyText?: string;
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
                folders={folders}
              />
            ))}
          </div>
        )
      ) : (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      )}
    </div>
  );
};

export { VideosView };
