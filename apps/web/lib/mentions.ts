/** Extract @username tokens from comment text (Clerk-style usernames). */
export const parseMentions = (text: string): string[] => {
  const matches = text.matchAll(/@([a-zA-Z0-9_-]{2,30})\b/g);
  const seen = new Set<string>();
  const out: string[] = [];

  for (const match of matches) {
    const name = match[1];
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    // Keep original casing for Clerk lookup (usernames are case-sensitive).
    out.push(name);
  }

  return out;
};

/** Split comment text into plain + mention segments for display. */
export const splitMentionSegments = (
  text: string,
): { type: "text" | "mention"; value: string }[] => {
  const parts: { type: "text" | "mention"; value: string }[] = [];
  const re = /@([a-zA-Z0-9_-]{2,30})\b/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      parts.push({ type: "text", value: text.slice(last, match.index) });
    }
    parts.push({ type: "mention", value: match[0]! });
    last = match.index + match[0]!.length;
  }

  if (last < text.length) {
    parts.push({ type: "text", value: text.slice(last) });
  }

  return parts.length > 0 ? parts : [{ type: "text", value: text }];
};
