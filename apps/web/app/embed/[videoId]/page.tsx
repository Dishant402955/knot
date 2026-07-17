import { notFound } from "next/navigation";

import { EmbedPlayer } from "@/app/embed/[videoId]/embed-player";
import { getVideoForWatch } from "@/server-actions/video";

export const metadata = {
  robots: { index: false, follow: false },
};

/**
 * Public iframe embed — PUBLIC videos only (no Clerk chrome / comments).
 */
const EmbedPage = async ({
  params,
}: {
  params: Promise<{ videoId: string }>;
}) => {
  const { videoId } = await params;
  const result = await getVideoForWatch(videoId);

  if (!result.success || result.video.visibility !== "PUBLIC") {
    notFound();
  }

  return (
    <EmbedPlayer
      videoId={result.video.id}
      title={result.video.title}
      initialStatus={result.video.status}
      initialSegments={result.segments}
      thumbnailUrl={result.video.thumbnailUrl}
    />
  );
};

export default EmbedPage;
