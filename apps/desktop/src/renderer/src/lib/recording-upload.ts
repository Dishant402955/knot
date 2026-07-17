import { KnotApiError } from "./api-client";
import { SEGMENT_DURATION_SECONDS } from "./capture-recorder";

type JsonFn = <T>(path: string, init?: RequestInit) => Promise<T>;
type FetchFn = (path: string, init?: RequestInit) => Promise<Response>;

export type CloudSession = {
  videoId: string;
  shareUrl: string;
  title: string;
};

type CreateVideoResponse = {
  success: boolean;
  video: {
    id: string;
    title: string;
    status: string;
    visibility: string;
    shareUrl: string;
  };
};

/**
 * Owns one recording's cloud lifecycle: create → upload chunks → mark READY.
 *
 * Chunks go to Next.js (`PUT /api/videos/:id/segments/:index`); the API writes
 * to B2. Desktop never talks to B2 directly — required behind filters like
 * Cisco Umbrella (the API host must still be able to reach B2).
 */
export class RecordingUploadSession {
  private videoId: string | null = null;
  private shareUrl: string | null = null;
  private chain: Promise<void> = Promise.resolve();
  private failed = false;
  private uploadedCount = 0;

  constructor(
    private readonly json: JsonFn,
    private readonly fetch: FetchFn,
  ) {}

  get id() {
    return this.videoId;
  }

  get link() {
    return this.shareUrl;
  }

  get hasFailed() {
    return this.failed;
  }

  get successCount() {
    return this.uploadedCount;
  }

  /** READY if any chunk landed; FAILED only when nothing uploaded. */
  get finalizeStatus(): "READY" | "FAILED" {
    return this.uploadedCount > 0 ? "READY" : "FAILED";
  }

  async start(title?: string): Promise<CloudSession> {
    const data = await this.json<CreateVideoResponse>("/api/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title?.trim() || "Untitled recording",
        visibility: "PUBLIC",
      }),
    });

    this.videoId = data.video.id;
    this.shareUrl = data.video.shareUrl;
    this.failed = false;
    this.uploadedCount = 0;

    return {
      videoId: data.video.id,
      shareUrl: data.video.shareUrl,
      title: data.video.title,
    };
  }

  /**
   * Queue a chunk upload (serialized). Local save should already be done.
   * One failed chunk does not abort later chunks.
   */
  enqueueChunk(index: number, blob: Blob): Promise<string | null> {
    if (!this.videoId) {
      return Promise.resolve(null);
    }

    const videoId = this.videoId;
    const run = async () => {
      try {
        await this.uploadOne(videoId, index, blob);
        this.uploadedCount += 1;
      } catch (error) {
        this.failed = true;
        console.error("[knot] chunk upload failed:", index, error);
        throw error;
      }
    };

    const next = this.chain.then(run, run);
    this.chain = next.catch(() => undefined);

    return next.then(() => this.shareUrl);
  }

  async flush(): Promise<void> {
    await this.chain;
  }

  /**
   * Upload JPEG poster (fire-and-forget friendly). Does not block chunk queue.
   */
  async uploadThumbnail(blob: Blob): Promise<boolean> {
    if (!this.videoId || blob.size === 0) return false;

    try {
      await this.fetch(`/api/videos/${this.videoId}/thumbnail`, {
        method: "PUT",
        headers: { "Content-Type": "image/jpeg" },
        body: blob,
      });
      return true;
    } catch (error) {
      console.error("[knot] thumbnail upload failed:", error);
      return false;
    }
  }

  async finalize(
    status?: "READY" | "FAILED" | "PROCESSING",
  ): Promise<string | null> {
    if (!this.videoId) return null;

    await this.flush();

    const nextStatus = status ?? this.finalizeStatus;

    await this.json(`/api/videos/${this.videoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });

    return this.shareUrl;
  }

  private async uploadOne(videoId: string, index: number, blob: Blob) {
    const contentType = blob.type?.startsWith("video/webm")
      ? blob.type
      : "video/webm";

    // Authenticated PUT to Next.js — API stores on B2 (no client→B2).
    await this.fetch(`/api/videos/${videoId}/segments/${index}`, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
        "X-Duration-Seconds": String(SEGMENT_DURATION_SECONDS),
      },
      body: blob,
    });
  }
}

export function formatUploadError(error: unknown): string {
  if (error instanceof KnotApiError) {
    try {
      const parsed = JSON.parse(error.body || "") as { message?: string };
      if (parsed.message) return parsed.message;
    } catch {
      // use status text
    }
    return error.message.slice(0, 280);
  }
  if (error instanceof Error) return error.message;
  return "Upload failed";
}
