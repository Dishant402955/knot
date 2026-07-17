"use client";

import type { HeuristicStep, HeuristicTask } from "@/components/page-agent/heuristics-catalog";

export type HeuristicRunResult = {
  ok: boolean;
  messages: string[];
};

const sleep = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

const findByDataKnot = (value: string) => {
  const safe =
    typeof CSS !== "undefined" && typeof CSS.escape === "function"
      ? CSS.escape(value)
      : value.replace(/"/g, '\\"');
  return document.querySelector<HTMLElement>(`[data-knot="${safe}"]`);
};

const findByText = (text: string) => {
  const needle = text.trim().toLowerCase();
  if (!needle) return null;

  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>(
      "button, a, [role='button'], [role='menuitem'], label",
    ),
  );

  for (const el of candidates) {
    const label = (el.innerText || el.getAttribute("aria-label") || "")
      .trim()
      .toLowerCase();
    if (label === needle || label.includes(needle)) return el;
  }
  return null;
};

const resolveElement = (step: Extract<
  HeuristicStep,
  { type: "click" | "highlight" }
>) => {
  if (step.dataKnot) {
    const el = findByDataKnot(step.dataKnot);
    if (el) return el;
  }
  if (step.selector) {
    const el = document.querySelector<HTMLElement>(step.selector);
    if (el) return el;
  }
  if (step.text) {
    return findByText(step.text);
  }
  return null;
};

const flashHighlight = (el: HTMLElement) => {
  const prev = el.style.outline;
  const prevOffset = el.style.outlineOffset;
  el.style.outline = "2px solid oklch(0.7 0.15 250)";
  el.style.outlineOffset = "3px";
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  window.setTimeout(() => {
    el.style.outline = prev;
    el.style.outlineOffset = prevOffset;
  }, 2200);
};

type RunOptions = {
  navigate: (path: string) => void;
  confirm?: (message: string) => boolean;
};

export const runHeuristicTask = async (
  task: HeuristicTask,
  options: RunOptions,
): Promise<HeuristicRunResult> => {
  const messages: string[] = [];

  for (const step of task.steps) {
    switch (step.type) {
      case "explain":
        messages.push(step.message);
        break;
      case "wait":
        await sleep(step.ms);
        break;
      case "navigate":
        options.navigate(step.path);
        if (step.note) messages.push(step.note);
        await sleep(350);
        break;
      case "confirm": {
        const ok = options.confirm
          ? options.confirm(step.message)
          : window.confirm(step.message);
        if (!ok) {
          messages.push("Cancelled.");
          return { ok: false, messages };
        }
        break;
      }
      case "highlight": {
        const el = resolveElement(step);
        if (el) {
          flashHighlight(el);
          if (step.note) messages.push(step.note);
        } else if (step.note) {
          messages.push(step.note);
        } else {
          messages.push("Could not find that control on this page yet.");
        }
        break;
      }
      case "click": {
        const el = resolveElement(step);
        if (el) {
          flashHighlight(el);
          await sleep(200);
          el.click();
          if (step.note) messages.push(step.note);
        } else {
          messages.push(
            step.note ||
              `Could not click “${step.text || step.dataKnot || step.selector || "target"}” — try the action manually.`,
          );
        }
        break;
      }
      default:
        break;
    }
  }

  return { ok: true, messages };
};
