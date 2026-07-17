/** Client-safe watch share URL (matches server `watchShareUrl`). */
export const clientAppOrigin = () =>
  (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (typeof window !== "undefined" ? window.location.origin : "")
  ).replace(/\/$/, "");

export const clientWatchShareUrl = (
  videoId: string,
  shareSlug?: string | null,
) => {
  const base = clientAppOrigin();

  if (shareSlug) {
    return `${base}/r/${shareSlug}`;
  }

  return `${base}/watch/${videoId}`;
};

/** Embed player URL — always uses UUID (not short /r/ which redirects to full watch). */
export const clientEmbedUrl = (videoId: string) =>
  `${clientAppOrigin()}/embed/${videoId}`;

export const embedIframeSnippet = (
  videoId: string,
  width = 640,
  height = 360,
) =>
  `<iframe src="${clientEmbedUrl(videoId)}" width="${width}" height="${height}" title="Knot video" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;

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
