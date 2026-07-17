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
  const token = await getToken();
  if (!token) {
    throw new KnotApiError("You must be signed in.", 401);
  }

  const base = await getApiBaseUrl();
  const url = path.startsWith("http") ? path : `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(url, {
    ...init,
    headers,
    credentials: "omit",
  });

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
