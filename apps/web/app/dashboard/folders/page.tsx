import { CreateFolder } from "@/app/dashboard/_components/create-folder";
import { FoldersView } from "@/app/dashboard/_components/folders-view";

import { getAllUserFolders } from "@/server-actions/folder";

const FoldersPage = async () => {
  const { success, folders, message } = await getAllUserFolders();

  if (!success || !folders) {
    return <>{message}</>;
  }

  const rootFolders = folders.filter((folder) => !folder.parentId);

  return (
    <div className="p-15 space-y-10">
      <div className="flex justify-between">
        <p className="font-bold text-2xl">Folders</p>

        <CreateFolder folders={folders} />
      </div>

      <FoldersView folders={rootFolders} allFolders={folders} />
    </div>
  );
};

export default FoldersPage;
