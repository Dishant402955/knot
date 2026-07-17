import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ProgressivePlayer } from "@/app/watch/[videoId]/progressive-player";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { getCommentsForVideo } from "@/server-actions/comment";
import { getVideoForWatch } from "@/server-actions/video";

import { ArrowLeft } from "lucide-react";

type WatchPageProps = {
  params: Promise<{ videoId: string }>;
};

export const generateMetadata = async ({
  params,
}: WatchPageProps): Promise<Metadata> => {
  const { videoId } = await params;
  const result = await getVideoForWatch(videoId);

  if (!result.success) {
    return { title: "Video · Knot", robots: { index: false } };
  }

  return {
    title: `${result.video.title} · Knot`,
    description:
      result.video.description?.slice(0, 160) ||
      "Watch this Knot recording",
    openGraph: result.video.thumbnailUrl
      ? {
          title: result.video.title,
          images: [{ url: result.video.thumbnailUrl }],
        }
      : undefined,
    robots:
      result.video.visibility === "PUBLIC"
        ? { index: true, follow: true }
        : { index: false, follow: false },
  };
};

const WatchPage = async ({ params }: WatchPageProps) => {
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
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="space-y-4">
          <p className="text-2xl font-bold">Playback unavailable</p>
          <p className="text-sm text-muted-foreground">{result.message}</p>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="cursor-pointer px-0"
          >
            <Link href="/dashboard/videos">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to videos
            </Link>
          </Button>
        </div>
        <Toaster />
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
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="cursor-pointer -ml-2"
          >
            <Link href={result.video.isOwner ? "/dashboard/videos" : "/"}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">
                {result.video.isOwner ? "Videos" : "Home"}
              </span>
              <span className="sm:hidden">Back</span>
            </Link>
          </Button>

          <Link
            href="/"
            className="font-bold tracking-tight text-foreground hover:opacity-80"
          >
            Knot
          </Link>

          <div className="w-16 sm:w-20" aria-hidden />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <ProgressivePlayer
          videoId={result.video.id}
          title={result.video.title}
          description={result.video.description}
          initialStatus={result.video.status}
          visibility={result.video.visibility}
          shareSlug={result.video.shareSlug}
          ownerUserId={result.video.ownerUserId}
          durationSeconds={result.video.durationSeconds}
          thumbnailUrl={result.video.thumbnailUrl}
          initialSegments={result.segments}
          initialComments={comments}
          canComment={canComment}
          isOwner={result.video.isOwner}
        />
      </main>

      <Toaster />
    </div>
  );
};

export default WatchPage;
