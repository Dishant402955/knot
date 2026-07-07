import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";

import { CreateFolder } from "@/app/dashboard/_components/create-folder";
import { DeleteFolder } from "@/app/dashboard/_components/delete-folder";
import { EditFolder } from "@/app/dashboard/_components/edit-folder";
import { FolderBreadcrumb } from "@/app/dashboard/_components/folder-breadcrumb";
import { FoldersView } from "@/app/dashboard/_components/folders-view";
import { VideoCard } from "@/app/dashboard/_components/video-card";

import { Button } from "@/components/ui/button";

import { getFolderById } from "@/server-actions/folder";

import { ArrowLeft, Folder } from "lucide-react";

const FolderDetailPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const response = await getFolderById(id);

  if (!response.success || !response.folder || !response.folders) {
    if (response.status === 404) {
      notFound();
    }

    return <>{response.message}</>;
  }

  const { folder, childFolders, videos, breadcrumbs, folders } = response;

  return (
    <div className="px-15 pt-4 pb-15 space-y-12">
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm" className="cursor-pointer px-0">
          <Link href="/dashboard/folders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            All Folders
          </Link>
        </Button>

        <FolderBreadcrumb segments={breadcrumbs} />

        <div className="flex items-start justify-between gap-4 py-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Folder className="h-7 w-7" />

              <h1 className="font-bold text-3xl">{folder.name}</h1>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>Created {format(new Date(folder.createdAt), "PPp")}</span>

              <span>Updated {format(new Date(folder.updatedAt), "PPp")}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <CreateFolder folders={folders} parentId={folder.id} />

            <EditFolder
              id={folder.id}
              name={folder.name}
              parentId={folder.parentId}
              folders={folders}
            />

            <DeleteFolder
              id={folder.id}
              redirectTo={
                folder.parentId
                  ? `/dashboard/folder/${folder.parentId}`
                  : "/dashboard/folders"
              }
            />
          </div>
        </div>
      </div>

      <FoldersView
        title="Subfolders"
        folders={childFolders}
        allFolders={folders}
        emptyText="No subfolders."
      />

      <div className="space-y-4">
        <p className="font-semibold text-lg">Videos</p>

        <div className="flex flex-wrap gap-5">
          {videos && videos.length > 0 ? (
            videos.map((video) => (
              <VideoCard
                key={video.id}
                title={video.title}
                description={video.description}
                footer={video.status}
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No videos in this folder.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FolderDetailPage;
