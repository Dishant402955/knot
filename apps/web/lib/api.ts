import { NextResponse } from "next/server";

const DESKTOP_ORIGIN = "knot://app";

/** CORS for Electron renderer (knot://) calling Next.js APIs. */
export const apiCorsHeaders = {
  "Access-Control-Allow-Origin": DESKTOP_ORIGIN,
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, OPTIONS",
  "Access-Control-Allow-Headers":
    "Authorization, Content-Type, X-Duration-Seconds",
  "Access-Control-Max-Age": "86400",
} as const;

export const apiOptionsResponse = () =>
  new NextResponse(null, { status: 204, headers: apiCorsHeaders });

export const apiJson = <T>(
  body: T,
  status = 200,
  init?: ResponseInit,
) =>
  NextResponse.json(body, {
    status,
    ...init,
    headers: {
      ...apiCorsHeaders,
      ...(init?.headers ?? {}),
    },
  });

export const getPublicAppUrl = (request: Request) => {
  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.KNOT_WEB_APP_URL?.trim();

  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }

  return new URL(request.url).origin;
};

/** Prefer short `/r/{slug}` when available; else `/watch/{id}`. */
export const watchShareUrl = (
  request: Request,
  videoId: string,
  shareSlug?: string | null,
) => {
  const base = getPublicAppUrl(request);
  if (shareSlug) {
    return `${base}/r/${shareSlug}`;
  }
  return `${base}/watch/${videoId}`;
};
