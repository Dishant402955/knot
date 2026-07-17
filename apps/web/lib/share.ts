/** Client-safe watch share URL (matches server `watchShareUrl`). */
export const clientWatchShareUrl = (
  videoId: string,
  shareSlug?: string | null,
) => {
  const base = (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (typeof window !== "undefined" ? window.location.origin : "")
  ).replace(/\/$/, "");

  if (shareSlug) {
    return `${base}/r/${shareSlug}`;
  }

  return `${base}/watch/${videoId}`;
};

export const visibilityCopyHint = (
  visibility: "PRIVATE" | "PUBLIC" | "AUTHENTICATED" | string,
) => {
  switch (visibility) {
    case "PRIVATE":
      return "Only you can view this video";
    case "AUTHENTICATED":
      return "Signed-in viewers only";
    case "PUBLIC":
      return "Anyone with the link can view";
    default:
      return undefined;
  }
};
