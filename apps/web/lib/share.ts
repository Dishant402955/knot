/** Client-safe watch share URL (matches server `watchShareUrl`). */
export const clientWatchShareUrl = (videoId: string) => {
  const base = (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (typeof window !== "undefined" ? window.location.origin : "")
  ).replace(/\/$/, "");

  return `${base}/watch/${videoId}`;
};
