import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Video } from "lucide-react";

import { VideoActions } from "./video-actions";

const VideoCard = ({
  id,
  title,
  description,
  status,
  visibility,
  folderId,
  folders = [],
}: {
  id: string;
  title: string;
  description: string | null;
  status: string;
  visibility: "PRIVATE" | "PUBLIC" | "AUTHENTICATED";
  folderId: string | null;
  folders?: {
    id: string;
    name: string;
    parentId?: string | null;
  }[];
}) => {
  return (
    <Card className="w-80 transition hover:shadow-md">
      <CardHeader>
        <div className="flex w-full items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 shrink-0" />

              <CardTitle>
                <Link href={`/watch/${id}`} className="hover:underline">
                  {title}
                </Link>
              </CardTitle>
            </div>

            <CardDescription className="line-clamp-2">
              {description || "No description"}
            </CardDescription>
          </div>

          <VideoActions
            id={id}
            title={title}
            description={description}
            visibility={visibility}
            folderId={folderId}
            folders={folders}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Status</span>
          <span className="capitalize">{status.toLowerCase()}</span>
        </div>

        <div className="flex justify-between">
          <span>Visibility</span>
          <span className="capitalize">{visibility.toLowerCase()}</span>
        </div>
      </CardContent>

      <CardFooter className="justify-end">
        <Button asChild variant="link" className="cursor-pointer px-0">
          <Link href={`/watch/${id}`}>Watch →</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export { VideoCard };
