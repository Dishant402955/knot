"use client";

import Link from "next/link";
import { format } from "date-fns";

import { Folder } from "lucide-react";

import { FolderActions } from "./folder-actions";

const FolderRow = ({
  id,
  name,
  path,
  childCount,
  videoCount,
  parentId,
  createdAt,
  updatedAt,
  folders,
}: {
  id: string;
  name: string;
  path: string;
  childCount: number;
  videoCount: number;
  parentId: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  folders: {
    id: string;
    name: string;
    parentId: string | null;
  }[];
}) => {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3 transition hover:bg-muted/50">
      <Link
        href={`/dashboard/folder/${id}`}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <Folder className="h-5 w-5 shrink-0" />

        <div className="min-w-0">
          <p className="truncate font-medium">{name}</p>

          <p className="truncate text-xs text-muted-foreground">{path}</p>
        </div>
      </Link>

      <div className="hidden shrink-0 items-center gap-6 text-sm text-muted-foreground lg:flex">
        <span>{childCount} folders</span>

        <span>{videoCount} videos</span>

        <span>Created {format(new Date(createdAt), "PP")}</span>

        <span>Updated {format(new Date(updatedAt), "PP")}</span>
      </div>

      <div className="shrink-0">
        <FolderActions
          id={id}
          name={name}
          parentId={parentId}
          folders={folders}
        />
      </div>
    </div>
  );
};

export { FolderRow };
