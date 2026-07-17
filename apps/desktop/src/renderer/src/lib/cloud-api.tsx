import { createContext, useContext, useMemo, type ReactNode } from "react";

import { useKnotApi } from "./use-knot-api";

type CloudApi = {
  json: <T>(path: string, init?: RequestInit) => Promise<T>;
  fetch: (path: string, init?: RequestInit) => Promise<Response>;
};

const CloudApiContext = createContext<CloudApi | null>(null);

/** Mount only under ClerkProvider when the user is signed in. */
export function CloudApiProvider({ children }: { children: ReactNode }) {
  const { json, fetch } = useKnotApi();
  const value = useMemo(() => ({ json, fetch }), [json, fetch]);
  return (
    <CloudApiContext.Provider value={value}>{children}</CloudApiContext.Provider>
  );
}

export function useCloudApi() {
  return useContext(CloudApiContext);
}
