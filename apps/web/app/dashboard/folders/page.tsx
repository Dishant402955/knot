import { FolderCard } from "@/app/dashboard/_components/folder-card";
import { getAllUserFolders } from "@/server-actions/video";

const FoldersPage = async () => {
  const { success, folders, message } = await getAllUserFolders();
  return (
    <div className="h-full w-full flex justify-center pl-20 py-15 flex-col">
      <div className="flex-col space-y-10 mb-10">
        <p className="font-bold text-2xl">Videos</p>
        <div className="flex justify-between pr-40">
          {success ? (
            <>
              {folders ? (
                folders.length > 0 ? (
                  <>
                    {folders.map((folder, idx) => {
                      return (
                        <FolderCard
                          title={folder.name}
                          description={"This is sample folder"}
                          key={idx}
                        />
                      );
                    })}
                  </>
                ) : (
                  <p> No Folders </p>
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

export default FoldersPage;
