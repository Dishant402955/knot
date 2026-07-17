import { parseMentions } from "@/lib/mentions";
import { clerkClient } from "@clerk/nextjs/server";

export type MentionUser = {
  id: string;
  username: string;
  imageUrl: string | null;
  label: string;
};

/**
 * Resolve @usernames in comment text to Clerk user IDs.
 * Requires Clerk usernames to be enabled; unmatched tokens are skipped.
 */
export const resolveMentionedUserIds = async (
  text: string,
  excludeUserId?: string | null,
): Promise<string[]> => {
  const usernames = parseMentions(text);
  if (usernames.length === 0) return [];

  const client = await clerkClient();
  const resolved = new Set<string>();

  await Promise.all(
    usernames.map(async (username) => {
      try {
        const list = await client.users.getUserList({
          username: [username],
          limit: 1,
        });
        const user = list.data[0];
        if (!user) return;
        if (excludeUserId && user.id === excludeUserId) return;
        resolved.add(user.id);
      } catch {
        // Skip unresolved mentions (Clerk API / username not found).
      }
    }),
  );

  return [...resolved];
};

/** Prefix search for mention autocomplete (Clerk Backend API). */
export const searchUsersForMention = async (
  query: string,
  options?: {
    excludeUserId?: string | null;
    limit?: number;
  },
): Promise<MentionUser[]> => {
  const q = query.trim();
  if (q.length < 2) return [];

  const client = await clerkClient();
  const limit = options?.limit ?? 8;

  try {
    const list = await client.users.getUserList({
      query: q,
      limit,
    });

    const out: MentionUser[] = [];

    for (const user of list.data) {
      if (options?.excludeUserId && user.id === options.excludeUserId) {
        continue;
      }
      const username = user.username?.trim();
      if (!username) continue;

      out.push({
        id: user.id,
        username,
        imageUrl: user.imageUrl ?? null,
        label:
          [user.firstName, user.lastName].filter(Boolean).join(" ") ||
          username,
      });
    }

    return out;
  } catch {
    return [];
  }
};

export const getUserMentionProfile = async (
  userId: string,
): Promise<MentionUser | null> => {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const username = user.username?.trim();
    if (!username) return null;

    return {
      id: user.id,
      username,
      imageUrl: user.imageUrl ?? null,
      label:
        [user.firstName, user.lastName].filter(Boolean).join(" ") || username,
    };
  } catch {
    return null;
  }
};
