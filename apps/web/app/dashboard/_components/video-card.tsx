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
import { VideoStatusBadge, VideoVisibilityBadge } from "./video-badges";

const VideoCard = ({
  id,
  title,
  description,
  status,
  visibility,
  folderId,
  thumbnailUrl = null,
  folders = [],
}: {
  id: string;
  title: string;
  description: string | null;
  status: string;
  visibility: "PRIVATE" | "PUBLIC" | "AUTHENTICATED";
  folderId: string | null;
  thumbnailUrl?: string | null;
  folders?: {
    id: string;
    name: string;
    parentId?: string | null;
  }[];
}) => {
  return (
    <Card className="w-80 overflow-hidden transition hover:shadow-md">
      <Link href={`/watch/${id}`} className="block">
        <div className="relative aspect-video w-full bg-muted">
          {thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- signed B2 URLs are ephemeral
            <img
              src={thumbnailUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <Video className="h-8 w-8 opacity-60" />
              <span className="text-xs">No thumbnail</span>
            </div>
          )}

          <div className="absolute left-2 top-2 flex flex-wrap gap-1">
            <VideoStatusBadge status={status} />
          </div>
        </div>
      </Link>

      <CardHeader className="pt-4">
        <div className="flex w-full items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <CardTitle className="line-clamp-1 text-base">
              <Link href={`/watch/${id}`} className="hover:underline">
                {title}
              </Link>
            </CardTitle>

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

      <CardContent className="flex flex-wrap gap-2 pb-2">
        <VideoVisibilityBadge visibility={visibility} />
      </CardContent>

      <CardFooter className="justify-end pt-0">
        <Button asChild variant="link" className="cursor-pointer px-0">
          <Link href={`/watch/${id}`}>Watch →</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export { VideoCard };
