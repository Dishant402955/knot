import { db } from "@/db";
import { folders, videos } from "@/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

export const getAllUserVideos = async () => {
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
      .from(videos)
      .where(eq(videos.userId, user.id));

    return {
      success: true,
      status: 200,
      videos: data,
      message: "Retrieved all the videos.",
    };
  } catch {
    return {
      success: false,
      status: 500,
      message: "Internal server Error.",
    };
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

    return {
      success: true,
      status: 200,
      folders: data,
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
