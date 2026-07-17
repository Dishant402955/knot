"use server";

import {
  getUserMentionProfile,
  searchUsersForMention,
  type MentionUser,
} from "@/lib/clerk-users";
import { currentUser } from "@clerk/nextjs/server";

export type { MentionUser };

export const searchMentionUsers = async ({
  query,
  visibility,
  ownerUserId,
}: {
  query: string;
  visibility: "PRIVATE" | "PUBLIC" | "AUTHENTICATED";
  ownerUserId: string;
}): Promise<{
  success: boolean;
  status: number;
  users: MentionUser[];
  message?: string;
}> => {
  const user = await currentUser();

  if (!user) {
    return {
      success: false,
      status: 401,
      users: [],
      message: "Not Authenticated.",
    };
  }

  const q = query.trim();
  if (q.length < 2) {
    return { success: true, status: 200, users: [] };
  }

  // Private videos: only the owner can be mentioned (matches createComment rules).
  if (visibility === "PRIVATE") {
    const owner = await getUserMentionProfile(ownerUserId);
    if (!owner || owner.id === user.id) {
      return { success: true, status: 200, users: [] };
    }
    if (!owner.username.toLowerCase().includes(q.toLowerCase())) {
      return { success: true, status: 200, users: [] };
    }
    return { success: true, status: 200, users: [owner] };
  }

  const users = await searchUsersForMention(q, {
    excludeUserId: user.id,
    limit: 8,
  });

  return { success: true, status: 200, users };
};
