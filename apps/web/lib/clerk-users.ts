import { parseMentions } from "@/lib/mentions";
import { clerkClient } from "@clerk/nextjs/server";

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
