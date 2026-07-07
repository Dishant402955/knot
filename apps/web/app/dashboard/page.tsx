import { DashboardSections } from "@/app/dashboard/_components/dashboard-sections";

import { getAllUserFolders } from "@/server-actions/folder";
import { getAllUserVideos } from "@/server-actions/video";

const DashboardPage = async () => {
  const [foldersResponse, videosResponse] = await Promise.all([
    getAllUserFolders(),
    getAllUserVideos(),
  ]);

  if (!foldersResponse.success || !foldersResponse.folders) {
    return <>{foldersResponse.message}</>;
  }

  if (!videosResponse.success || !videosResponse.videos) {
    return <>{videosResponse.message}</>;
  }

  const { folders } = foldersResponse;
  const { videos } = videosResponse;

  const recentFolders = folders
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 4);

  const recentVideos = videos
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 4);

  return (
    <div className="px-15 pb-15 pt-10">
      <DashboardSections
        recentFolders={recentFolders}
        allFolders={folders}
        recentVideos={recentVideos}
      />
    </div>
  );
};

export default DashboardPage;
