"use client";

import { useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";

import { FolderPlus, MoreVertical, Pencil, Trash2 } from "lucide-react";

import { CreateFolder } from "./create-folder";
import { DeleteFolder } from "./delete-folder";
import { EditFolder } from "./edit-folder";

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

      <EditFolder
        id={id}
        name={name}
        parentId={parentId}
        folders={folders}
        open={editOpen}
        onOpenChange={setEditOpen}
        showTrigger={false}
      />

      <CreateFolder
        folders={folders}
        parentId={id}
        open={createOpen}
        onOpenChange={setCreateOpen}
        showTrigger={false}
      />

      <DeleteFolder
        id={id}
        redirectTo={redirectTo}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        showTrigger={false}
      />
    </>
  );
};

export { FolderActions };
