import {
  getSignedDownloadUrl,
  isB2Configured,
} from "@/lib/b2";

/** Attach signed thumbnail URLs when `thumbnailKey` is set and B2 is configured. */
export const withThumbnailUrls = async <
  T extends { thumbnailKey: string | null },
>(
  rows: T[],
): Promise<(T & { thumbnailUrl: string | null })[]> => {
  if (!isB2Configured() || rows.length === 0) {
    return rows.map((row) => ({ ...row, thumbnailUrl: null }));
  }

  return Promise.all(
    rows.map(async (row) => {
      if (!row.thumbnailKey) {
        return { ...row, thumbnailUrl: null };
      }

      try {
        return {
          ...row,
          thumbnailUrl: await getSignedDownloadUrl(row.thumbnailKey),
        };
      } catch {
        return { ...row, thumbnailUrl: null };
      }
    }),
  );
};
