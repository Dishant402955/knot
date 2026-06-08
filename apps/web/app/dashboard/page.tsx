import { FolderCard } from "@/app/dashboard/_components/folder-card";
import { VideoCard } from "@/app/dashboard/_components/video-card";

const DashboardPage = () => {
  return (
    <div className="h-full w-full flex justify-center pl-20 py-10 flex-col">
      <div className="flex-col space-y-5 mb-10">
        <p>Recent Videos</p>
        <div className="flex justify-between pr-40">
          <VideoCard
            title="First Video"
            description="this is first video"
            footer="fst video"
          />
          <VideoCard
            title="Second Video"
            description="this is second video"
            footer="scnd video"
          />
          <VideoCard
            title="Third Video"
            description="this is third video"
            footer="trd video"
          />
        </div>
      </div>

      <div className="flex-col space-y-5 mt-10">
        <p>Recent Folders</p>
        <div className="flex justify-between pr-40">
          <FolderCard title="First Folder" description="this is first folder" />
          <FolderCard
            title="Second Folder"
            description="this is seconc folder"
          />
          <FolderCard title="Third Folder" description="this is third folder" />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
