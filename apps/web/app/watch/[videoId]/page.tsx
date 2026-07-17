import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ProgressivePlayer } from "@/app/watch/[videoId]/progressive-player";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { getCommentsForVideo } from "@/server-actions/comment";
import { getVideoForWatch } from "@/server-actions/video";

import { ArrowLeft } from "lucide-react";

const WatchPage = async ({
  params,
}: {
  params: Promise<{ videoId: string }>;
}) => {
  const { videoId } = await params;
  const result = await getVideoForWatch(videoId);

  if (!result.success) {
    if (result.status === 401) {
      redirect(
        `/sign-in?redirect_url=${encodeURIComponent(`/watch/${videoId}`)}`,
      );
    }

    if (result.status === 404) {
      notFound();
    }

    return (
      <div className="px-15 py-20 space-y-4">
        <p className="font-bold text-2xl">Playback unavailable</p>
        <p className="text-sm text-muted-foreground">{result.message}</p>
        <Button asChild variant="ghost" size="sm" className="cursor-pointer px-0">
          <Link href="/dashboard/videos">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to videos
          </Link>
        </Button>
      </div>
    );
  }

  const commentsResult = await getCommentsForVideo(videoId);
  const comments =
    commentsResult.success && "comments" in commentsResult
      ? commentsResult.comments
      : [];
  const canComment =
    commentsResult.success && "canComment" in commentsResult
      ? commentsResult.canComment
      : false;

  return (
    <div className="min-h-screen">
      <div className="border-b">
        <div className="flex items-center justify-between px-15 py-4">
          <Button asChild variant="ghost" size="sm" className="cursor-pointer px-0">
            <Link href={result.video.isOwner ? "/dashboard/videos" : "/"}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {result.video.isOwner ? "Videos" : "Home"}
            </Link>
          </Button>

          <Link href="/" className="font-bold text-lg">
            Knot
          </Link>
        </div>
      </div>

      <div className="px-15 pb-15 pt-10">
        <ProgressivePlayer
          videoId={result.video.id}
          title={result.video.title}
          description={result.video.description}
          initialStatus={result.video.status}
          initialSegments={result.segments}
          initialComments={comments}
          canComment={canComment}
          isOwner={result.video.isOwner}
        />
      </div>

      <Toaster />
    </div>
  );
};

export default WatchPage;
