import { CreateVideo } from "@/app/dashboard/_components/create-video";
import { VideosView } from "@/app/dashboard/_components/videos-view";
import { getAllUserFolders } from "@/server-actions/folder";
import { getAllUserVideos } from "@/server-actions/video";

const VideosPage = async () => {
  const [videosResponse, foldersResponse] = await Promise.all([
    getAllUserVideos(),
    getAllUserFolders(),
  ]);

  if (!videosResponse.success || !videosResponse.videos) {
    return <>{videosResponse.message}</>;
  }

  if (!foldersResponse.success || !foldersResponse.folders) {
    return <>{foldersResponse.message}</>;
  }

  return (
    <div className="px-15 pb-15 pt-10 space-y-10">
      <div className="flex justify-between">
        <p className="font-bold text-2xl">Videos</p>

        <CreateVideo folders={foldersResponse.folders} />
      </div>

      <VideosView
        videos={videosResponse.videos}
        folders={foldersResponse.folders}
        emptyText="No videos yet"
        emptyHint="Record with the Knot desktop app, or create a metadata entry to organize later."
        emptyAction={<CreateVideo folders={foldersResponse.folders} />}
      />
    </div>
  );
};

export default VideosPage;
