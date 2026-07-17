const DEFAULT_API_BASE = "http://localhost:3000";

let cachedApiBase: string | null = null;

export async function getApiBaseUrl(): Promise<string> {
  if (cachedApiBase) return cachedApiBase;
  cachedApiBase = (await window.knot.getApiBaseUrl()) || DEFAULT_API_BASE;
  return cachedApiBase;
}

export class KnotApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: string,
  ) {
    super(message);
    this.name = "KnotApiError";
  }
}

export async function knotFetch(
  path: string,
  getToken: (options?: { skipCache?: boolean }) => Promise<string | null>,
  init: RequestInit = {},
): Promise<Response> {
  const base = await getApiBaseUrl();
  const url = path.startsWith("http")
    ? path
    : `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;

  const attempt = async (skipCache: boolean) => {
    const token = await getToken(skipCache ? { skipCache: true } : undefined);
    if (!token) {
      throw new KnotApiError("You must be signed in.", 401);
    }

    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);

    return fetch(url, {
      ...init,
      headers,
      credentials: "omit",
    });
  };

  let response = await attempt(false);

  // Refresh Clerk token once on unauthorized (long recordings).
  if (response.status === 401) {
    response = await attempt(true);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    let message = body || `Request failed (${response.status})`;
    try {
      const parsed = JSON.parse(body) as { message?: string };
      if (parsed.message) message = parsed.message;
    } catch {
      // keep raw body
    }
    throw new KnotApiError(message, response.status, body);
  }

  return response;
}

export async function knotJson<T>(
  path: string,
  getToken: (options?: { skipCache?: boolean }) => Promise<string | null>,
  init: RequestInit = {},
): Promise<T> {
  const response = await knotFetch(path, getToken, init);
  return (await response.json()) as T;
}
