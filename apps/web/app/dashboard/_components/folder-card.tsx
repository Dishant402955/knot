import Link from "next/link";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Folder } from "lucide-react";

import { FolderActions } from "./folder-actions";

const FolderCard = ({
  id,
  name,
  path,
  childCount,
  videoCount,
  parentId,
  folders,
}: {
  id: string;
  name: string;
  path: string;
  childCount: number;
  videoCount: number;
  parentId: string | null;
  folders: {
    id: string;
    name: string;
    parentId: string | null;
  }[];
}) => {
  return (
    <Card className="w-80 hover:shadow-md transition">
      <CardHeader>
        <div className="flex w-full items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Folder className="h-5 w-5" />

              <CardTitle>
                <Link
                  href={`/dashboard/folder/${id}`}
                  className="hover:underline"
                >
                  {name}
                </Link>
              </CardTitle>
            </div>

            <CardDescription>{path}</CardDescription>
          </div>

          <FolderActions
            id={id}
            name={name}
            parentId={parentId}
            folders={folders}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Child Folders</span>

          <span>{childCount}</span>
        </div>

        <div className="flex justify-between">
          <span>Videos</span>

          <span>{videoCount}</span>
        </div>
      </CardContent>

      <CardFooter className="justify-end">
        <Button asChild variant="link" className="cursor-pointer px-0">
          <Link href={`/dashboard/folder/${id}`}>View Folder →</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export { FolderCard };
