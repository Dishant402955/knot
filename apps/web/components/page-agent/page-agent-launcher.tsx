"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bot, Loader2, Sparkles, X } from "lucide-react";

import {
  HEURISTIC_TASKS,
  listSuggestedTasks,
  matchHeuristicTask,
} from "@/components/page-agent/heuristics-catalog";
import { runHeuristicTask } from "@/components/page-agent/heuristics-runner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type AgentMode = "llm" | "heuristics" | "loading" | "error";

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
};

type PageAgentConfigResponse = {
  success: boolean;
  mode?: "llm" | "heuristics";
  model?: string | null;
  proxyBaseURL?: string;
  message?: string;
};

const KNOT_SYSTEM_INSTRUCTIONS = `You are Knot's in-page UI assistant for a Loom-style screen recording product.
Help the user operate THIS web app by clicking, typing, and navigating — not by inventing backend APIs.
Key product facts:
- Dashboard: /dashboard, Videos, Folders, Settings, Notifications.
- Watch page: progressive WebM playback, comments with @mentions, share/embed (embed requires Public).
- Desktop app records ~5s WebM chunks and uploads via the API; desktop recordings default to Public.
- Visibility: Private / Public / Signed-in (AUTHENTICATED).
Prefer visible UI controls. Ask before destructive actions (delete). Be concise.`;

type PageAgentInstance = {
  execute: (task: string) => Promise<{ success: boolean; data: string }>;
  dispose: () => void;
  panel?: { dispose?: () => void };
  stop?: () => Promise<void>;
};

export const PageAgentLauncher = () => {
  const router = useRouter();
  const pathname = usePathname();
  const titleId = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const agentRef = useRef<PageAgentInstance | null>(null);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AgentMode>("loading");
  const [model, setModel] = useState<string | null>(null);
  const [proxyBaseURL, setProxyBaseURL] = useState("/api/page-agent/v1");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "system",
      content:
        "Ask me to help with the Knot UI — e.g. “open videos”, “create a folder”, or “how do I record?”.",
    },
  ]);

  const suggestions = listSuggestedTasks(6);

  const pushMessage = useCallback((role: ChatMessage["role"], content: string) => {
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, role, content },
    ]);
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch("/api/page-agent/config", {
          credentials: "same-origin",
        });
        if (res.status === 401) {
          if (!cancelled) setMode("heuristics");
          return;
        }
        const data = (await res.json()) as PageAgentConfigResponse;
        if (cancelled) return;
        if (!data.success) {
          setMode("heuristics");
          return;
        }
        setModel(data.model ?? null);
        if (data.proxyBaseURL) setProxyBaseURL(data.proxyBaseURL);
        setMode(data.mode === "llm" ? "llm" : "heuristics");
      } catch {
        if (!cancelled) setMode("heuristics");
      }
    })();

    return () => {
      cancelled = true;
      agentRef.current?.dispose();
      agentRef.current = null;
    };
  }, []);

  const ensureLlmAgent = useCallback(async () => {
    if (agentRef.current) return agentRef.current;

    const { PageAgent } = await import("page-agent");
    const agent = new PageAgent({
      baseURL: proxyBaseURL.endsWith("/")
        ? proxyBaseURL
        : `${proxyBaseURL}/`,
      apiKey: "knot-proxy",
      model: model || "gpt-4o-mini",
      language: "en-US",
      maxSteps: 24,
      experimentalLlmsTxt: true,
      instructions: {
        system: KNOT_SYSTEM_INSTRUCTIONS,
        getPageInstructions: (url) =>
          `Current URL: ${url}. Pathname context: ${pathname}. Prefer data-knot attributes when present.`,
      },
      customFetch: (input, init) =>
        fetch(input, {
          ...init,
          credentials: "same-origin",
        }),
    }) as unknown as PageAgentInstance;

    // Prefer our chat UI — hide the stock panel if present.
    try {
      agent.panel?.dispose?.();
    } catch {
      // ignore
    }

    agentRef.current = agent;
    return agent;
  }, [model, pathname, proxyBaseURL]);

  const runHeuristics = useCallback(
    async (text: string) => {
      const match = matchHeuristicTask(text);
      if (!match) {
        const catalog = HEURISTIC_TASKS.filter((t) => t.id !== "help-overview")
          .slice(0, 8)
          .map((t) => `• ${t.title} — try “${t.examples[0] ?? t.title}”`)
          .join("\n");
        pushMessage(
          "assistant",
          `I couldn’t match that in Guide mode (no LLM key). Try one of these:\n${catalog}`,
        );
        return;
      }

      pushMessage(
        "assistant",
        `Guide: **${match.task.title}** — ${match.task.description}`,
      );

      const result = await runHeuristicTask(match.task, {
        navigate: (path) => router.push(path),
        confirm: (message) => window.confirm(message),
      });

      for (const line of result.messages) {
        pushMessage("assistant", line);
      }
      if (result.ok && result.messages.length === 0) {
        pushMessage("assistant", "Done.");
      }
    },
    [pushMessage, router],
  );

  const runLlm = useCallback(
    async (text: string) => {
      try {
        const agent = await ensureLlmAgent();
        const result = await agent.execute(text);
        pushMessage(
          "assistant",
          result.success
            ? result.data || "Finished."
            : result.data || "The agent stopped before completing that task.",
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Page Agent failed.";
        pushMessage(
          "assistant",
          `${message}\nFalling back to Guide mode for this request…`,
        );
        await runHeuristics(text);
      }
    },
    [ensureLlmAgent, pushMessage, runHeuristics],
  );

  const submit = async (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || busy) return;

    setInput("");
    pushMessage("user", text);
    setBusy(true);

    try {
      if (mode === "llm") {
        await runLlm(text);
      } else {
        await runHeuristics(text);
      }
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  // Skip on marketing-only chrome if ever mounted broadly; launcher is for app UI.
  if (pathname?.startsWith("/embed")) return null;

  return (
    <>
      <Button
        type="button"
        size="icon-lg"
        className="fixed bottom-5 right-5 z-50 size-12 cursor-pointer rounded-full shadow-lg"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={open ? titleId : undefined}
        aria-label={open ? "Close Knot UI help" : "Open Knot UI help"}
        data-knot="page-agent-launcher"
      >
        {open ? <X className="size-5" /> : <Sparkles className="size-5" />}
      </Button>

      {open ? (
        <section
          className="fixed bottom-20 right-5 z-50 flex w-[min(100vw-2rem,24rem)] flex-col overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-2xl"
          aria-labelledby={titleId}
        >
          <header className="flex items-start justify-between gap-3 border-b px-4 py-3">
            <div className="min-w-0 space-y-1">
              <h2 id={titleId} className="flex items-center gap-2 text-sm font-semibold">
                <Bot className="size-4 shrink-0" aria-hidden />
                Knot UI Help
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {mode === "loading"
                  ? "Checking assistant mode…"
                  : mode === "llm"
                    ? `AI mode${model ? ` · ${model}` : ""} (Page Agent)`
                    : "Guide mode — heuristics (no LLM key)"}
              </p>
            </div>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              className="cursor-pointer"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              <X className="size-4" />
            </Button>
          </header>

          <div className="flex max-h-64 flex-col gap-2 overflow-y-auto px-3 py-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "rounded-lg px-2.5 py-2 text-xs leading-relaxed whitespace-pre-wrap",
                  msg.role === "user"
                    ? "ml-6 bg-primary text-primary-foreground"
                    : msg.role === "system"
                      ? "bg-muted/60 text-muted-foreground"
                      : "mr-4 bg-muted",
                )}
              >
                {msg.content.replace(/\*\*(.*?)\*\*/g, "$1")}
              </div>
            ))}
            {busy ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                Working…
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-1.5 border-t px-3 py-2">
            {suggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                disabled={busy}
                className="cursor-pointer rounded-full border bg-background px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                onClick={() => void submit(s.example)}
              >
                {s.title}
              </button>
            ))}
          </div>

          <form
            className="flex flex-col gap-2 border-t p-3"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. Open my videos…"
              rows={2}
              disabled={busy || mode === "loading"}
              className="min-h-16 resize-none text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void submit();
                }
              }}
            />
            <Button
              type="submit"
              size="sm"
              className="cursor-pointer"
              disabled={busy || mode === "loading" || !input.trim()}
            >
              {busy ? "Running…" : mode === "llm" ? "Run with AI" : "Run guide"}
            </Button>
          </form>
        </section>
      ) : null}
    </>
  );
};
