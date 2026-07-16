import type { KnotDesktopApi } from "../../preload/index";

declare global {
  interface Window {
    knot: KnotDesktopApi;
  }
}

export {};
