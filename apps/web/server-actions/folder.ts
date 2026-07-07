"use server";

import { db } from "@/db";
import { folders, videos } from "@/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type FolderRow = typeof folders.$inferSelect;

const getPath = (id: string, allFolders: FolderRow[]): string => {
  const folder = allFolders.find((item) => item.id === id);

  if (!folder) {
    return "/";
  }

  if (!folder.parentId) {
    return `/${folder.name}/`;
  }

  return getPath(folder.parentId, allFolders) + `${folder.name}/`;
};

const getBreadcrumbs = (
  id: string,
  allFolders: FolderRow[],
): { id: string; name: string; href: string }[] => {
  const folder = allFolders.find((item) => item.id === id);

  if (!folder) {
    return [];
  }

  if (!folder.parentId) {
    return [{ id: folder.id, name: folder.name, href: `/dashboard/folder/${folder.id}` }];
  }

  return [
    ...getBreadcrumbs(folder.parentId, allFolders),
    { id: folder.id, name: folder.name, href: `/dashboard/folder/${folder.id}` },
  ];
};

const hasSiblingWithName = (
  allFolders: FolderRow[],
  name: string,
  parentId: string | null,
  excludeId?: string,
): boolean => {
  const normalized = name.trim().toLowerCase();

  return allFolders.some(
    (folder) =>
      folder.id !== excludeId &&
      (folder.parentId ?? null) === parentId &&
      folder.name.trim().toLowerCase() === normalized,
  );
};

const getDescendantIds = (
  id: string,
  allFolders: FolderRow[],
): string[] => {
  const children = allFolders.filter((folder) => folder.parentId === id);

  return children.flatMap((child) => [
    child.id,
    ...getDescendantIds(child.id, allFolders),
  ]);
};

const getVideoCounts = async (userId: string) => {
  const rows = await db
    .select({
      folderId: videos.folderId,
      count: sql<number>`count(*)::int`,
    })
    .from(videos)
    .where(eq(videos.userId, userId))
    .groupBy(videos.folderId);

  return new Map(
    rows
      .filter((row) => row.folderId)
      .map((row) => [row.folderId as string, row.count]),
  );
};

const mapFolders = (
  data: FolderRow[],
  videoCounts: Map<string, number>,
) => {
  return data.map((folder) => ({
    ...folder,
    path: getPath(folder.id, data),
    childCount: data.filter((item) => item.parentId === folder.id).length,
    videoCount: videoCounts.get(folder.id) ?? 0,
  }));
};

const revalidateFolderPaths = (
  folderId?: string,
  parentId?: string | null,
) => {
  revalidatePath("/dashboard/folders");

  if (folderId) {
    revalidatePath(`/dashboard/folder/${folderId}`);
  }

  if (parentId) {
    revalidatePath(`/dashboard/folder/${parentId}`);
  }
};

export const getAllUserFolders = async () => {
  const user = await currentUser();

  if (!user) {
    return {
      success: false,
      status: 401,
      message: "Not Authenticated.",
    };
  }

  try {
    const data = await db
      .select()
      .from(folders)
      .where(eq(folders.userId, user.id));

    const videoCounts = await getVideoCounts(user.id);

    return {
      success: true,
      status: 200,
      folders: mapFolders(data, videoCounts),
      message: "Retrieved all the folders.",
    };
  } catch {
    return {
      success: false,
      status: 500,
      message: "Internal server Error.",
    };
  }
};

export const getFolderById = async (id: string) => {
  const user = await currentUser();

  if (!user) {
    return {
      success: false,
      status: 401,
      message: "Not Authenticated.",
    };
  }

  try {
    const data = await db
      .select()
      .from(folders)
      .where(eq(folders.userId, user.id));

    const folder = data.find((item) => item.id === id);

    if (!folder) {
      return {
        success: false,
        status: 404,
        message: "Folder not found.",
      };
    }

    const videoCounts = await getVideoCounts(user.id);
    const mappedFolders = mapFolders(data, videoCounts);
    const currentFolder = mappedFolders.find((item) => item.id === id);

    if (!currentFolder) {
      return {
        success: false,
        status: 404,
        message: "Folder not found.",
      };
    }

    const childFolders = mappedFolders.filter((item) => item.parentId === id);

    const folderVideos = await db
      .select()
      .from(videos)
      .where(and(eq(videos.userId, user.id), eq(videos.folderId, id)));

    const breadcrumbs = [
      { id: null, name: "Folders", href: "/dashboard/folders" },
      ...getBreadcrumbs(id, data).map((crumb, index, items) => ({
        id: crumb.id,
        name: crumb.name,
        href: index === items.length - 1 ? undefined : crumb.href,
      })),
    ];

    return {
      success: true,
      status: 200,
      folder: currentFolder,
      childFolders,
      videos: folderVideos,
      breadcrumbs,
      folders: mappedFolders,
      message: "Retrieved folder.",
    };
  } catch {
    return {
      success: false,
      status: 500,
      message: "Internal server Error.",
    };
  }
};

export const createFolder = async ({
  name,
  parentId,
}: {
  name: string;
  parentId?: string;
}) => {
  const user = await currentUser();

  if (!user) {
    return {
      success: false,
      status: 401,
      message: "Not Authenticated.",
    };
  }

  try {
    const existing = await db
      .select()
      .from(folders)
      .where(eq(folders.userId, user.id));

    if (parentId) {
      const parent = existing.find((item) => item.id === parentId);

      if (!parent) {
        return {
          success: false,
          status: 404,
          message: "Parent folder not found.",
        };
      }
    }

    if (hasSiblingWithName(existing, name, parentId ?? null)) {
      return {
        success: false,
        status: 409,
        message: "A folder with this name already exists here.",
      };
    }

    const data = await db
      .insert(folders)
      .values({
        name,
        userId: user.id,
        parentId: parentId ?? null,
      })
      .returning();

    revalidateFolderPaths(data[0].id, parentId);

    return {
      success: true,
      status: 201,
      folder: data[0],
      message: "Folder created.",
    };
  } catch {
    return {
      success: false,
      status: 500,
      message: "Internal server Error.",
    };
  }
};

export const editFolder = async ({
  id,
  folderName,
  parentId,
}: {
  id: string;
  folderName: string;
  parentId?: string;
}) => {
  const user = await currentUser();

  if (!user) {
    return {
      success: false,
      status: 401,
      message: "Not Authenticated.",
    };
  }

  try {
    const data = await db
      .select()
      .from(folders)
      .where(eq(folders.userId, user.id));

    const folder = data.find((item) => item.id === id);

    if (!folder) {
      return {
        success: false,
        status: 404,
        message: "Folder not found.",
      };
    }

    const nextParentId = parentId ?? null;

    if (nextParentId === id) {
      return {
        success: false,
        status: 400,
        message: "A folder cannot be its own parent.",
      };
    }

    if (nextParentId && getDescendantIds(id, data).includes(nextParentId)) {
      return {
        success: false,
        status: 400,
        message: "A folder cannot be moved into its own subfolder.",
      };
    }

    if (nextParentId) {
      const parent = data.find((item) => item.id === nextParentId);

      if (!parent) {
        return {
          success: false,
          status: 404,
          message: "Parent folder not found.",
        };
      }
    }

    if (hasSiblingWithName(data, folderName, nextParentId, id)) {
      return {
        success: false,
        status: 409,
        message: "A folder with this name already exists here.",
      };
    }

    await db
      .update(folders)
      .set({
        name: folderName,
        parentId: nextParentId,
        updatedAt: new Date(),
      })
      .where(and(eq(folders.id, id), eq(folders.userId, user.id)));

    revalidateFolderPaths(id, folder.parentId);
    revalidateFolderPaths(id, nextParentId);

    return {
      success: true,
      status: 200,
      message: "Folder updated.",
    };
  } catch {
    return {
      success: false,
      status: 500,
      message: "Internal server Error.",
    };
  }
};

export const deleteFolder = async ({ id }: { id: string }) => {
  const user = await currentUser();

  if (!user) {
    return {
      success: false,
      status: 401,
      message: "Not Authenticated.",
    };
  }

  try {
    const data = await db
      .select()
      .from(folders)
      .where(eq(folders.userId, user.id));

    const folder = data.find((item) => item.id === id);

    if (!folder) {
      return {
        success: false,
        status: 404,
        message: "Folder not found.",
      };
    }

    const idsToDelete = [id, ...getDescendantIds(id, data)];

    await db
      .delete(folders)
      .where(
        and(eq(folders.userId, user.id), inArray(folders.id, idsToDelete)),
      );

    revalidateFolderPaths(undefined, folder.parentId);

    return {
      success: true,
      status: 200,
      message: "Folder deleted.",
      parentId: folder.parentId,
    };
  } catch {
    return {
      success: false,
      status: 500,
      message: "Internal server Error.",
    };
  }
};
