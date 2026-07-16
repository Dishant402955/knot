import { useAuth } from "@clerk/electron/react";
import { useCallback, useMemo } from "react";

import { knotFetch, knotJson, type KnotApiError } from "./api-client";

export function useKnotApi() {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();

  const fetchWithAuth = useCallback(
    (path: string, init?: RequestInit) => knotFetch(path, getToken, init),
    [getToken],
  );

  const jsonWithAuth = useCallback(
    <T,>(path: string, init?: RequestInit) => knotJson<T>(path, getToken, init),
    [getToken],
  );

  return useMemo(
    () => ({
      isLoaded,
      isSignedIn,
      userId,
      getToken,
      fetch: fetchWithAuth,
      json: jsonWithAuth,
    }),
    [fetchWithAuth, getToken, isLoaded, isSignedIn, jsonWithAuth, userId],
  );
}

export type { KnotApiError };
