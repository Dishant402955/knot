import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getPageAgentLlmSettings } from "@/lib/page-agent-config";

export const dynamic = "force-dynamic";

/**
 * Public (to signed-in clients) config — never includes the API key.
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { success: false, message: "Unauthorized." },
      { status: 401 },
    );
  }

  const llm = getPageAgentLlmSettings();

  return NextResponse.json({
    success: true,
    mode: llm.configured ? "llm" : "heuristics",
    model: llm.configured ? llm.model : null,
    /** Relative OpenAI-compatible base for PageAgent (same origin). */
    proxyBaseURL: "/api/page-agent/v1",
  });
}
