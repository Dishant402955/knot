"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

import { FolderCard } from "./folder-card";
import { FolderRow } from "./folder-row";
import { VideoCard } from "./video-card";
import { VideoRow } from "./video-row";
import { ViewToggle } from "./view-toggle";

type ViewFolder = {
  id: string;
  name: string;
  path: string;
  parentId: string | null;
  childCount: number;
  videoCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
};

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

const STORAGE_KEY = "knot:folder-view";

const DashboardSections = ({
  recentFolders,
  allFolders,
  recentVideos,
}: {
  recentFolders: ViewFolder[];
  allFolders: {
    id: string;
    name: string;
    parentId: string | null;
  }[];
  recentVideos: ViewVideo[];
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
    <div className="space-y-10">
      <div className="flex items-center justify-between gap-2">
        <p className="font-bold text-2xl">Dashboard</p>

        <ViewToggle view={view} onChange={changeView} />
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-lg">Recent Folders</p>

          <Button asChild variant="link" className="cursor-pointer px-0">
            <Link href="/dashboard/folders">View all →</Link>
          </Button>
        </div>

        {recentFolders.length > 0 ? (
          view === "grid" ? (
            <div className="flex flex-wrap gap-5">
              {recentFolders.map((folder) => (
                <FolderCard
                  key={folder.id}
                  id={folder.id}
                  name={folder.name}
                  path={folder.path}
                  parentId={folder.parentId}
                  childCount={folder.childCount}
                  videoCount={folder.videoCount}
                  folders={allFolders}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recentFolders.map((folder) => (
                <FolderRow
                  key={folder.id}
                  id={folder.id}
                  name={folder.name}
                  path={folder.path}
                  parentId={folder.parentId}
                  childCount={folder.childCount}
                  videoCount={folder.videoCount}
                  createdAt={folder.createdAt}
                  updatedAt={folder.updatedAt}
                  folders={allFolders}
                />
              ))}
            </div>
          )
        ) : (
          <p className="text-sm text-muted-foreground">No folders yet.</p>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-lg">Recent Videos</p>

          <Button asChild variant="link" className="cursor-pointer px-0">
            <Link href="/dashboard/videos">View all →</Link>
          </Button>
        </div>

        {recentVideos.length > 0 ? (
          view === "grid" ? (
            <div className="flex flex-wrap gap-5">
              {recentVideos.map((video) => (
                <VideoCard
                  key={video.id}
                  id={video.id}
                  title={video.title}
                  description={video.description}
                  status={video.status}
                  visibility={video.visibility}
                  folderId={video.folderId}
                  folders={allFolders}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recentVideos.map((video) => (
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
                  folders={allFolders}
                />
              ))}
            </div>
          )
        ) : (
          <p className="text-sm text-muted-foreground">No videos yet.</p>
        )}
      </section>
    </div>
  );
};

export { DashboardSections };
