import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getPageAgentLlmSettings } from "@/lib/page-agent-config";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 30;

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

const allowRate = (userId: string) => {
  const now = Date.now();
  const existing = buckets.get(userId);
  if (!existing || existing.resetAt <= now) {
    buckets.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (existing.count >= MAX_PER_WINDOW) return false;
  existing.count += 1;
  return true;
};

/**
 * OpenAI-compatible chat completions proxy for page-agent.
 * Auth: Clerk session. Secrets stay on the server.
 */
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: { message: "Unauthorized." } },
      { status: 401 },
    );
  }

  if (!allowRate(userId)) {
    return NextResponse.json(
      { error: { message: "Too many Page Agent requests. Try again shortly." } },
      { status: 429 },
    );
  }

  const llm = getPageAgentLlmSettings();
  if (!llm.configured) {
    return NextResponse.json(
      {
        error: {
          message:
            "Page Agent LLM is not configured. Set PAGE_AGENT_API_KEY (or OPENAI_API_KEY).",
        },
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { message: "Invalid JSON body." } },
      { status: 400 },
    );
  }

  const upstream = `${llm.baseURL}/chat/completions`;

  try {
    const response = await fetch(upstream, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${llm.apiKey}`,
      },
      body: JSON.stringify({
        ...(typeof body === "object" && body ? body : {}),
        model:
          typeof body === "object" &&
          body &&
          "model" in body &&
          typeof (body as { model?: unknown }).model === "string"
            ? (body as { model: string }).model
            : llm.model,
      }),
      signal: AbortSignal.timeout(55_000),
    });

    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (error) {
    console.error("[knot] page-agent proxy failed:", error);
    return NextResponse.json(
      { error: { message: "Upstream LLM request failed." } },
      { status: 502 },
    );
  }
}
