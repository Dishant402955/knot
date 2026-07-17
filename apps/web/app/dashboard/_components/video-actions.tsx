"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ExternalLink, MoreVertical, Pencil, Trash2 } from "lucide-react";

const EditVideo = dynamic(
  () => import("./edit-video").then((mod) => ({ default: mod.EditVideo })),
  { ssr: false },
);

const DeleteVideo = dynamic(
  () => import("./delete-video").then((mod) => ({ default: mod.DeleteVideo })),
  { ssr: false },
);

const VideoActions = ({
  id,
  title,
  description,
  visibility,
  folderId,
  folders,
}: {
  id: string;
  title: string;
  description: string | null;
  visibility: "PRIVATE" | "PUBLIC" | "AUTHENTICATED";
  folderId: string | null;
  folders: {
    id: string;
    name: string;
    parentId?: string | null;
  }[];
}) => {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 cursor-pointer"
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" sideOffset={5} className="w-48">
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href={`/watch/${id}`}>
              <ExternalLink />
              Open watch page
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={(e) => {
              e.preventDefault();
              setEditOpen(true);
            }}
          >
            <Pencil />
            Edit
          </DropdownMenuItem>

          <DropdownMenuItem
            variant="destructive"
            className="cursor-pointer"
            onSelect={(e) => {
              e.preventDefault();
              setDeleteOpen(true);
            }}
          >
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {editOpen ? (
        <EditVideo
          id={id}
          title={title}
          description={description}
          visibility={visibility}
          folderId={folderId}
          folders={folders}
          open={editOpen}
          onOpenChange={setEditOpen}
          showTrigger={false}
        />
      ) : null}

      {deleteOpen ? (
        <DeleteVideo
          id={id}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          showTrigger={false}
        />
      ) : null}
    </>
  );
};

export { VideoActions };
