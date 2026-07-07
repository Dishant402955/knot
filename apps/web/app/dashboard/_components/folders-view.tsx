"use client";

import { useEffect, useState } from "react";

import { LayoutGrid, List } from "lucide-react";

import { Button } from "@/components/ui/button";

import { FolderCard } from "./folder-card";
import { FolderRow } from "./folder-row";

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

const STORAGE_KEY = "knot:folder-view";

const FoldersView = ({
  folders,
  allFolders,
  emptyText = "No Folders.",
  title,
}: {
  folders: ViewFolder[];
  allFolders: {
    id: string;
    name: string;
    parentId: string | null;
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

        <div className="flex gap-1">
          <Button
            size="icon"
            variant={view === "grid" ? "secondary" : "ghost"}
            onClick={() => changeView("grid")}
            className="h-8 w-8 cursor-pointer"
            aria-label="Grid view"
            aria-pressed={view === "grid"}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>

          <Button
            size="icon"
            variant={view === "list" ? "secondary" : "ghost"}
            onClick={() => changeView("list")}
            className="h-8 w-8 cursor-pointer"
            aria-label="List view"
            aria-pressed={view === "list"}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {folders.length > 0 ? (
        view === "grid" ? (
          <div className="flex flex-wrap gap-5">
            {folders.map((folder) => (
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
            {folders.map((folder) => (
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
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      )}
    </div>
  );
};

export { FoldersView };
