import { join, normalize, sep } from "path";

const SESSION_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidSessionId(id: string): boolean {
  return SESSION_ID_RE.test(id);
}

export function resolveSessionDir(recordingsRoot: string, sessionId: string): string | null {
  if (!isValidSessionId(sessionId)) return null;

  const root = normalize(join(recordingsRoot));
  const dir = normalize(join(root, sessionId));

  if (dir === root) return null;
  if (!dir.startsWith(root + sep)) return null;

  return dir;
}

export function resolveRecordingsPath(recordingsRoot: string, dir?: string): string {
  const root = normalize(join(recordingsRoot));
  if (!dir) return root;

  const target = normalize(dir);
  if (target === root || target.startsWith(root + sep)) {
    return target;
  }

  return root;
}
