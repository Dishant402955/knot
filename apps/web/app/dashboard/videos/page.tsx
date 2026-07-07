import { VideoCard } from "@/app/dashboard/_components/video-card";
import { getAllUserVideos } from "@/server-actions/video";

const VideosPage = async () => {
  const { success, videos, message } = await getAllUserVideos();
  return (
    <div className="h-full w-full flex justify-center pl-20 pb-15 pt-10 flex-col">
      <div className="flex-col space-y-10 mb-10">
        <p className="font-bold text-2xl">Videos</p>
        <div className="flex justify-between pr-40">
          {success ? (
            <>
              {videos ? (
                videos.length > 0 ? (
                  <>
                    {videos.map((video, idx) => {
                      return (
                        <VideoCard
                          title={video.title}
                          description={video.description}
                          footer={video.status}
                          key={idx}
                        />
                      );
                    })}
                  </>
                ) : (
                  <p> No videos </p>
                )
              ) : (
                <p>Something went wrong</p>
              )}
            </>
          ) : (
            <>{message}</>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideosPage;
