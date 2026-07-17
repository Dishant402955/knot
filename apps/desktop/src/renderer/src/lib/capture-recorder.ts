import type {
  CaptureFrameOrigin,
  CaptureMode,
  RegionBounds,
  WebcamBounds,
  WebcamShape,
} from "@shared/types";

export type RecorderOptions = {
  sourceId: string;
  mode: CaptureMode;
  region: RegionBounds | null;
  includeMic: boolean;
  includeSystemAudio: boolean;
  /**
   * When true, open the camera device and draw it onto the canvas.
   * Use only for window/region capture — screen capture already includes the
   * visible overlay window (compositing again causes a double bubble).
   */
  compositeWebcam: boolean;
  webcamShape: WebcamShape;
  frameOrigin: CaptureFrameOrigin;
  getWebcamBounds: () => Promise<WebcamBounds>;
  sessionId: string;
  /** Called once per complete, independently-playable WebM segment. */
  onChunk: (index: number, blob: Blob) => Promise<void>;
  onError?: (error: Error) => void;
};

/** Target length of each independently playable segment. */
export const SEGMENT_MS = 5000;
/** Approximate duration written to the API when a segment registers. */
export const SEGMENT_DURATION_SECONDS = Math.round(SEGMENT_MS / 1000);
/** Overlap between consecutive recorders so the seam doesn't drop frames. */
const SEGMENT_OVERLAP_MS = 150;
/** Wait after requestData() so the encoder can flush before stop(). */
const FLUSH_MS = 120;

const shapeClip = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  shape: WebcamShape,
) => {
  ctx.beginPath();
  if (shape === "circle") {
    const r = Math.min(w, h) / 2;
    ctx.arc(x + w / 2, y + h / 2, r, 0, Math.PI * 2);
  } else if (shape === "square") {
    const size = Math.min(w, h);
    const ox = x + (w - size) / 2;
    const oy = y + (h - size) / 2;
    ctx.rect(ox, oy, size, size);
  } else {
    ctx.rect(x, y, w, h);
  }
  ctx.closePath();
};

class WriteQueue {
  private queue: Array<() => Promise<void>> = [];
  private running = false;

  enqueue(task: () => Promise<void>) {
    this.queue.push(task);
    void this.flush();
  }

  private async flush() {
    if (this.running) return;
    this.running = true;
    while (this.queue.length > 0) {
      const task = this.queue.shift()!;
      try {
        await task();
      } catch {
        // Handler reports errors.
      }
    }
    this.running = false;
  }

  async drain(): Promise<void> {
    while (this.queue.length > 0 || this.running) {
      await new Promise((r) => setTimeout(r, 10));
    }
  }
}

type ActiveSegment = {
  index: number;
  recorder: MediaRecorder;
  parts: Blob[];
};

/**
 * Produces independently playable WebM chunks by rotating MediaRecorder
 * instances on the same live stream.
 *
 * Key details for complete segments:
 * - Start the next recorder BEFORE stopping the previous (overlap) so frames
 *   aren't dropped at the seam.
 * - Call requestData() and wait briefly before stop() so the encoder flushes
 *   the last frames into the final blob.
 */
export class CaptureRecorder {
  private screenStream: MediaStream | null = null;
  private webcamStream: MediaStream | null = null;
  private micStream: MediaStream | null = null;
  private composedStream: MediaStream | null = null;
  private active: ActiveSegment | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private screenVideo: HTMLVideoElement | null = null;
  private webcamVideo: HTMLVideoElement | null = null;
  private drawTimer: ReturnType<typeof setInterval> | null = null;
  private segmentTimer: ReturnType<typeof setTimeout> | null = null;
  private paused = false;
  private options: RecorderOptions | null = null;
  private writeQueue = new WriteQueue();
  private cachedWebcamBounds: WebcamBounds | null = null;
  private frameOrigin: CaptureFrameOrigin = { x: 0, y: 0 };
  private nextChunkIndex = 0;
  private mimeType = "video/webm";
  private stopping = false;
  private rotating = false;

  get isRecording() {
    const state = this.active?.recorder.state;
    return state === "recording" || state === "paused";
  }

  get isPrepared() {
    return Boolean(this.composedStream && !this.active);
  }

  get isPaused() {
    return this.paused;
  }

  getLiveStream() {
    return this.composedStream;
  }

  updateWebcamBounds(bounds: WebcamBounds) {
    this.cachedWebcamBounds = bounds;
  }

  /**
   * Heavy setup (desktop/mic/cam streams, canvas, paint loop).
   * Call during countdown so commit() can start encoding immediately after.
   */
  async prepare(options: RecorderOptions) {
    if (this.isRecording || this.active || this.screenStream) {
      throw new Error("Recording already in progress");
    }

    this.options = options;
    this.paused = false;
    this.stopping = false;
    this.rotating = false;
    this.nextChunkIndex = 0;
    this.writeQueue = new WriteQueue();
    this.frameOrigin = options.frameOrigin;
    this.cachedWebcamBounds = await options.getWebcamBounds();

    try {
      const screenConstraints = {
        audio: options.includeSystemAudio
          ? {
              mandatory: {
                chromeMediaSource: "desktop",
              },
            }
          : false,
        video: {
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: options.sourceId,
          },
        },
      } as MediaStreamConstraints;

      this.screenStream = await navigator.mediaDevices.getUserMedia(screenConstraints);

      if (options.includeMic) {
        this.micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
          video: false,
        });
      }

      if (options.compositeWebcam) {
        this.webcamStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });
      }

      const videoTrack = this.screenStream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      const sourceWidth = settings.width ?? 1920;
      const sourceHeight = settings.height ?? 1080;

      const region = options.mode === "region" && options.region ? options.region : null;
      const outWidth = region?.width ?? sourceWidth;
      const outHeight = region?.height ?? sourceHeight;

      this.canvas = document.createElement("canvas");
      this.canvas.width = outWidth;
      this.canvas.height = outHeight;

      const ctx = this.canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Could not get canvas context");
      }

      const screenVideo = document.createElement("video");
      screenVideo.srcObject = this.screenStream;
      screenVideo.muted = true;
      screenVideo.playsInline = true;
      await screenVideo.play();
      this.screenVideo = screenVideo;

      await new Promise<void>((resolve, reject) => {
        const deadline = Date.now() + 5000;
        const check = () => {
          if (screenVideo.videoWidth > 0 && screenVideo.videoHeight > 0) {
            resolve();
            return;
          }
          if (Date.now() > deadline) {
            reject(new Error("Screen capture produced no frames"));
            return;
          }
          window.setTimeout(check, 50);
        };
        check();
      });

      let webcamVideo: HTMLVideoElement | null = null;
      if (this.webcamStream) {
        webcamVideo = document.createElement("video");
        webcamVideo.srcObject = this.webcamStream;
        webcamVideo.muted = true;
        webcamVideo.playsInline = true;
        await webcamVideo.play();
        this.webcamVideo = webcamVideo;
      }

      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 50);
      });

      const paint = () => {
        if (!this.canvas || !ctx) return;
        if (this.paused) return;

        if (region) {
          ctx.drawImage(
            screenVideo,
            region.x,
            region.y,
            region.width,
            region.height,
            0,
            0,
            outWidth,
            outHeight,
          );
        } else {
          ctx.drawImage(screenVideo, 0, 0, outWidth, outHeight);
        }

        if (webcamVideo && this.options?.compositeWebcam && this.cachedWebcamBounds) {
          const bounds = this.cachedWebcamBounds;
          const wx = bounds.x - this.frameOrigin.x;
          const wy = bounds.y - this.frameOrigin.y;

          ctx.save();
          shapeClip(ctx, wx, wy, bounds.width, bounds.height, bounds.shape);
          ctx.clip();
          ctx.drawImage(webcamVideo, wx, wy, bounds.width, bounds.height);
          ctx.restore();

          ctx.save();
          shapeClip(ctx, wx, wy, bounds.width, bounds.height, bounds.shape);
          ctx.strokeStyle = "rgba(255,255,255,0.85)";
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.restore();
        }
      };

      paint();
      this.drawTimer = setInterval(paint, 1000 / 30);

      this.composedStream = this.canvas.captureStream(30);

      for (const track of this.screenStream.getAudioTracks()) {
        this.composedStream.addTrack(track);
      }

      if (this.micStream) {
        for (const track of this.micStream.getAudioTracks()) {
          this.composedStream.addTrack(track);
        }
      }

      this.mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
          ? "video/webm;codecs=vp8,opus"
          : "video/webm";
    } catch (error) {
      this.cleanup();
      throw error instanceof Error ? error : new Error("Failed to prepare recording");
    }
  }

  /** Begin encoding immediately — call right when countdown hits 0. */
  commit() {
    if (!this.composedStream || !this.options) {
      throw new Error("Recorder is not prepared");
    }
    if (this.active) {
      throw new Error("Recording already started");
    }

    this.stopping = false;
    this.paused = false;
    this.beginSegment();
    this.scheduleRotation();
  }

  /** Convenience: prepare + commit (used when countdown is off). */
  async start(options: RecorderOptions) {
    await this.prepare(options);
    this.commit();
  }

  private beginSegment(): ActiveSegment {
    if (!this.composedStream) {
      throw new Error("No composed stream");
    }

    const index = this.nextChunkIndex++;
    const parts: Blob[] = [];

    const recorder = new MediaRecorder(this.composedStream, {
      mimeType: this.mimeType,
      videoBitsPerSecond: 5_000_000,
    });

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        parts.push(event.data);
      }
    };

    recorder.onerror = () => {
      this.options?.onError?.(new Error("MediaRecorder error — stopping recording"));
    };

    const segment: ActiveSegment = { index, recorder, parts };
    this.active = segment;
    recorder.start();
    return segment;
  }

  /**
   * Flush encoder buffers, stop the recorder, and enqueue the complete blob.
   */
  private finalizeSegment(segment: ActiveSegment): Promise<void> {
    return new Promise((resolve) => {
      const { recorder, parts, index } = segment;
      let settled = false;

      const finish = () => {
        if (settled) return;
        settled = true;
        const blob = new Blob(parts, { type: this.mimeType });
        if (blob.size > 0 && this.options) {
          const opts = this.options;
          this.writeQueue.enqueue(async () => {
            await opts.onChunk(index, blob);
          });
        }
        resolve();
      };

      if (recorder.state === "inactive") {
        finish();
        return;
      }

      recorder.addEventListener("stop", finish, { once: true });

      // Flush pending encoded frames, then stop — without this the last
      // ~100–300ms of a segment is often missing from the WebM.
      try {
        if (recorder.state === "recording" || recorder.state === "paused") {
          recorder.requestData();
        }
      } catch {
        // Ignore.
      }

      window.setTimeout(() => {
        if (settled) return;
        if (recorder.state === "inactive") {
          finish();
          return;
        }
        try {
          recorder.stop();
        } catch {
          finish();
        }
      }, FLUSH_MS);
    });
  }

  private scheduleRotation() {
    if (this.segmentTimer) {
      clearTimeout(this.segmentTimer);
      this.segmentTimer = null;
    }
    if (this.stopping || this.paused) return;

    this.segmentTimer = setTimeout(() => {
      void this.rotateSegment();
    }, SEGMENT_MS);
  }

  private async rotateSegment() {
    if (this.stopping || this.paused || this.rotating) return;
    const previous = this.active;
    if (!previous || previous.recorder.state !== "recording") return;

    this.rotating = true;

    try {
      // Start the next segment first so capture continues without a gap.
      this.beginSegment();

      // Brief overlap, then finalize the previous segment completely.
      await new Promise((r) => setTimeout(r, SEGMENT_OVERLAP_MS));
      await this.finalizeSegment(previous);
    } finally {
      this.rotating = false;
      if (!this.stopping && !this.paused) {
        this.scheduleRotation();
      }
    }
  }

  pause() {
    if (this.active?.recorder.state === "recording") {
      if (this.segmentTimer) {
        clearTimeout(this.segmentTimer);
        this.segmentTimer = null;
      }
      this.active.recorder.pause();
      this.paused = true;
    }
  }

  resume() {
    if (this.active?.recorder.state === "paused") {
      this.active.recorder.resume();
      this.paused = false;
      this.scheduleRotation();
    }
  }

  async stop() {
    this.stopping = true;

    if (this.segmentTimer) {
      clearTimeout(this.segmentTimer);
      this.segmentTimer = null;
    }

    // Wait for an in-flight rotation to finish so we don't double-stop.
    const deadline = Date.now() + 3000;
    while (this.rotating && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 20));
    }

    const current = this.active;
    this.active = null;

    if (current) {
      await this.finalizeSegment(current);
    }

    await this.writeQueue.drain();
    this.cleanup();
  }

  /** JPEG snapshot of the live composed canvas (for cloud thumbnail). */
  async captureCanvasJpeg(quality = 0.85): Promise<Blob | null> {
    if (!this.canvas) return null;

    return new Promise((resolve) => {
      this.canvas!.toBlob(
        (blob) => resolve(blob),
        "image/jpeg",
        quality,
      );
    });
  }

  async takeScreenshotFrame(options: {
    sourceId: string;
    mode: CaptureMode;
    region: RegionBounds | null;
    compositeWebcam: boolean;
    frameOrigin: CaptureFrameOrigin;
    getWebcamBounds: () => Promise<WebcamBounds>;
  }): Promise<Blob> {
    const constraints = {
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: "desktop",
          chromeMediaSourceId: options.sourceId,
        },
      },
    } as MediaStreamConstraints;

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    const video = document.createElement("video");
    video.srcObject = stream;
    video.muted = true;
    await video.play();

    await new Promise((r) => setTimeout(r, 100));

    const settings = stream.getVideoTracks()[0]?.getSettings();
    const sourceWidth = settings?.width ?? video.videoWidth ?? 1920;
    const sourceHeight = settings?.height ?? video.videoHeight ?? 1080;
    const region = options.mode === "region" && options.region ? options.region : null;
    const width = region?.width ?? sourceWidth;
    const height = region?.height ?? sourceHeight;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      stream.getTracks().forEach((t) => t.stop());
      throw new Error("Could not get canvas context");
    }

    if (region) {
      ctx.drawImage(
        video,
        region.x,
        region.y,
        region.width,
        region.height,
        0,
        0,
        width,
        height,
      );
    } else {
      ctx.drawImage(video, 0, 0, width, height);
    }

    if (options.compositeWebcam) {
      try {
        const cam = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        const camVideo = document.createElement("video");
        camVideo.srcObject = cam;
        camVideo.muted = true;
        await camVideo.play();
        await new Promise((r) => setTimeout(r, 80));

        const bounds = await options.getWebcamBounds();
        const wx = bounds.x - options.frameOrigin.x;
        const wy = bounds.y - options.frameOrigin.y;

        ctx.save();
        shapeClip(ctx, wx, wy, bounds.width, bounds.height, bounds.shape);
        ctx.clip();
        ctx.drawImage(camVideo, wx, wy, bounds.width, bounds.height);
        ctx.restore();

        cam.getTracks().forEach((t) => t.stop());
      } catch {
        // Webcam optional for screenshots
      }
    }

    stream.getTracks().forEach((t) => t.stop());

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Failed to encode screenshot"))),
        "image/png",
      );
    });

    return blob;
  }

  private cleanup() {
    if (this.segmentTimer) {
      clearTimeout(this.segmentTimer);
      this.segmentTimer = null;
    }
    if (this.drawTimer) {
      clearInterval(this.drawTimer);
      this.drawTimer = null;
    }
    this.active = null;
    this.composedStream?.getTracks().forEach((t) => t.stop());
    this.screenStream?.getTracks().forEach((t) => t.stop());
    this.webcamStream?.getTracks().forEach((t) => t.stop());
    this.micStream?.getTracks().forEach((t) => t.stop());
    if (this.screenVideo) {
      this.screenVideo.srcObject = null;
      this.screenVideo = null;
    }
    if (this.webcamVideo) {
      this.webcamVideo.srcObject = null;
      this.webcamVideo = null;
    }
    this.composedStream = null;
    this.screenStream = null;
    this.webcamStream = null;
    this.micStream = null;
    this.canvas = null;
    this.options = null;
    this.cachedWebcamBounds = null;
    this.paused = false;
    this.stopping = false;
    this.rotating = false;
  }
}
