"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";

import { FolderPlus, MoreVertical, Pencil, Trash2 } from "lucide-react";

const EditFolder = dynamic(
  () => import("./edit-folder").then((mod) => ({ default: mod.EditFolder })),
  { ssr: false },
);

const CreateFolder = dynamic(
  () =>
    import("./create-folder").then((mod) => ({ default: mod.CreateFolder })),
  { ssr: false },
);

const DeleteFolder = dynamic(
  () =>
    import("./delete-folder").then((mod) => ({ default: mod.DeleteFolder })),
  { ssr: false },
);

const FolderActions = ({
  id,
  name,
  parentId,
  folders,
  redirectTo,
}: {
  id: string;
  name: string;
  parentId: string | null;
  folders: {
    id: string;
    name: string;
    parentId: string | null;
  }[];
  redirectTo?: string;
}) => {
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
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
            className="cursor-pointer"
            onSelect={(e) => {
              e.preventDefault();
              setCreateOpen(true);
            }}
          >
            <FolderPlus />
            Create Subfolder
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
        <EditFolder
          id={id}
          name={name}
          parentId={parentId}
          folders={folders}
          open={editOpen}
          onOpenChange={setEditOpen}
          showTrigger={false}
        />
      ) : null}

      {createOpen ? (
        <CreateFolder
          folders={folders}
          parentId={id}
          open={createOpen}
          onOpenChange={setCreateOpen}
          showTrigger={false}
        />
      ) : null}

      {deleteOpen ? (
        <DeleteFolder
          id={id}
          redirectTo={redirectTo}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          showTrigger={false}
        />
      ) : null}
    </>
  );
};

export { FolderActions };
