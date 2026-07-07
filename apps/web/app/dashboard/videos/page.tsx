import { VideoCard } from "@/app/dashboard/_components/video-card";
import { getAllUserVideos } from "@/server-actions/video";

const VideosPage = async () => {
  const { success, videos, message } = await getAllUserVideos();

  if (!success || !videos) {
    return <>{message}</>;
  }

  return (
    <div className="px-15 pb-15 pt-10 space-y-10">
      <p className="font-bold text-2xl">Videos</p>

      {videos.length > 0 ? (
        <div className="flex flex-wrap gap-5">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              title={video.title}
              description={video.description}
              footer={video.status}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No videos yet.</p>
      )}
    </div>
  );
};

export default VideosPage;
