import { createContext, useContext } from "react";

export type DesktopAuthMode = "online" | "offline";

export type DesktopAuthContextValue = {
  mode: DesktopAuthMode;
  /** Absolute path to the local recordings root folder. */
  recordingsRoot: string | null;
};

const DesktopAuthContext = createContext<DesktopAuthContextValue>({
  mode: "offline",
  recordingsRoot: null,
});

export const DesktopAuthProvider = DesktopAuthContext.Provider;

export function useDesktopAuth() {
  return useContext(DesktopAuthContext);
}
