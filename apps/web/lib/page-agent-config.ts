/**
 * Server-only Page Agent LLM settings.
 * Key never ships to the browser — clients call /api/page-agent/v1/*.
 */

export type PageAgentLlmSettings = {
  configured: boolean;
  baseURL: string;
  model: string;
  apiKey: string;
};

export const getPageAgentLlmSettings = (): PageAgentLlmSettings => {
  const apiKey =
    process.env.PAGE_AGENT_API_KEY?.trim() ||
    process.env.OPENAI_API_KEY?.trim() ||
    "";

  const baseURL = (
    process.env.PAGE_AGENT_BASE_URL?.trim() ||
    "https://api.openai.com/v1"
  ).replace(/\/$/, "");

  const model =
    process.env.PAGE_AGENT_MODEL?.trim() || "gpt-4o-mini";

  return {
    configured: Boolean(apiKey),
    baseURL,
    model,
    apiKey,
  };
};
