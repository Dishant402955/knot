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
  includeWebcam: boolean;
  webcamShape: WebcamShape;
  /** Capture the overlay window instead of opening a second camera device. */
  webcamWindowSourceId?: string | null;
  frameOrigin: CaptureFrameOrigin;
  getWebcamBounds: () => Promise<WebcamBounds>;
  sessionId: string;
  onChunk: (index: number, blob: Blob) => Promise<void>;
  onError?: (error: Error) => void;
};

const CHUNK_MS = 5000;

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

export class CaptureRecorder {
  private screenStream: MediaStream | null = null;
  private webcamStream: MediaStream | null = null;
  private micStream: MediaStream | null = null;
  private composedStream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private screenVideo: HTMLVideoElement | null = null;
  private webcamVideo: HTMLVideoElement | null = null;
  private animationFrame = 0;
  private chunkIndex = 0;
  private paused = false;
  private options: RecorderOptions | null = null;
  private pendingChunks: Promise<void>[] = [];
  private cachedWebcamBounds: WebcamBounds | null = null;
  private frameOrigin: CaptureFrameOrigin = { x: 0, y: 0 };
  private chunkWatchdog: ReturnType<typeof setInterval> | null = null;
  private lastChunkAt = 0;

  get isRecording() {
    return this.recorder?.state === "recording" || this.recorder?.state === "paused";
  }

  get isPaused() {
    return this.paused;
  }

  updateWebcamBounds(bounds: WebcamBounds) {
    this.cachedWebcamBounds = bounds;
  }

  async start(options: RecorderOptions) {
    if (this.isRecording || this.recorder || this.screenStream) {
      throw new Error("Recording already in progress");
    }

    this.options = options;
    this.chunkIndex = 0;
    this.paused = false;
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

      if (options.includeWebcam) {
        if (options.webcamWindowSourceId) {
          this.webcamStream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              mandatory: {
                chromeMediaSource: "desktop",
                chromeMediaSourceId: options.webcamWindowSourceId,
              },
            },
          } as MediaStreamConstraints);
        } else {
          this.webcamStream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
            },
            audio: false,
          });
        }
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

      let webcamVideo: HTMLVideoElement | null = null;
      if (this.webcamStream) {
        webcamVideo = document.createElement("video");
        webcamVideo.srcObject = this.webcamStream;
        webcamVideo.muted = true;
        webcamVideo.playsInline = true;
        await webcamVideo.play();
        this.webcamVideo = webcamVideo;
      }

      // Warm up a few painted frames before MediaRecorder starts so the first
      // timeslice is less likely to be empty.
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });

      const draw = () => {
        if (!this.canvas || !ctx) {
          return;
        }

        if (!this.paused) {
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

          if (webcamVideo && this.options?.includeWebcam && this.cachedWebcamBounds) {
            const bounds = this.cachedWebcamBounds;
            const wx = bounds.x - this.frameOrigin.x;
            const wy = bounds.y - this.frameOrigin.y;
            const fromWindow = Boolean(this.options.webcamWindowSourceId);

            if (fromWindow) {
              ctx.drawImage(webcamVideo, wx, wy, bounds.width, bounds.height);
            } else {
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
          }
        }

        this.animationFrame = requestAnimationFrame(draw);
      };

      this.animationFrame = requestAnimationFrame(draw);

      this.composedStream = this.canvas.captureStream(30);

      for (const track of this.screenStream.getAudioTracks()) {
        this.composedStream.addTrack(track);
      }

      if (this.micStream) {
        for (const track of this.micStream.getAudioTracks()) {
          this.composedStream.addTrack(track);
        }
      }

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
          ? "video/webm;codecs=vp8,opus"
          : "video/webm";

      this.recorder = new MediaRecorder(this.composedStream, {
        mimeType,
        videoBitsPerSecond: 5_000_000,
      });

      this.recorder.ondataavailable = (event) => {
        if (!event.data || event.data.size === 0 || !this.options) return;

        this.lastChunkAt = Date.now();
        const index = this.chunkIndex++;
        const task = this.options
          .onChunk(index, event.data)
          .catch((error: unknown) => {
            this.options?.onError?.(
              error instanceof Error ? error : new Error("Failed to save chunk"),
            );
          })
          .finally(() => {
            this.pendingChunks = this.pendingChunks.filter((item) => item !== task);
          });
        this.pendingChunks.push(task);
      };

      this.recorder.onerror = () => {
        this.options?.onError?.(new Error("MediaRecorder error — stopping recording"));
      };

      this.lastChunkAt = Date.now();
      // Timeslice forces periodic chunks (every 5s).
      this.recorder.start(CHUNK_MS);

      // If timeslice stalls, force a flush — but only when overdue.
      this.chunkWatchdog = setInterval(() => {
        if (this.recorder?.state !== "recording") return;
        if (Date.now() - this.lastChunkAt < CHUNK_MS + 1500) return;
        try {
          this.recorder.requestData();
        } catch {
          // Ignore if recorder is mid-stop.
        }
      }, 1000);
    } catch (error) {
      this.cleanup();
      throw error instanceof Error ? error : new Error("Failed to start recording");
    }
  }

  pause() {
    if (this.recorder?.state === "recording") {
      this.recorder.pause();
      this.paused = true;
    }
  }

  resume() {
    if (this.recorder?.state === "paused") {
      this.recorder.resume();
      this.paused = false;
    }
  }

  async stop() {
    const recorder = this.recorder;

    if (!recorder || recorder.state === "inactive") {
      this.cleanup();
      return;
    }

    if (recorder.state === "recording" || recorder.state === "paused") {
      recorder.requestData();
    }

    await new Promise<void>((resolve) => {
      recorder.addEventListener("stop", () => resolve(), { once: true });
      recorder.stop();
    });

    await Promise.allSettled(this.pendingChunks);
    this.cleanup();
  }

  async takeScreenshotFrame(options: {
    sourceId: string;
    mode: CaptureMode;
    region: RegionBounds | null;
    includeWebcam: boolean;
    webcamWindowSourceId?: string | null;
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

    if (options.includeWebcam) {
      try {
        const webcamConstraints = options.webcamWindowSourceId
          ? ({
              audio: false,
              video: {
                mandatory: {
                  chromeMediaSource: "desktop",
                  chromeMediaSourceId: options.webcamWindowSourceId,
                },
              },
            } as MediaStreamConstraints)
          : ({
              video: true,
              audio: false,
            } as MediaStreamConstraints);

        const cam = await navigator.mediaDevices.getUserMedia(webcamConstraints);
        const camVideo = document.createElement("video");
        camVideo.srcObject = cam;
        camVideo.muted = true;
        await camVideo.play();
        await new Promise((r) => setTimeout(r, 80));

        const bounds = await options.getWebcamBounds();
        const wx = bounds.x - options.frameOrigin.x;
        const wy = bounds.y - options.frameOrigin.y;

        if (options.webcamWindowSourceId) {
          ctx.drawImage(camVideo, wx, wy, bounds.width, bounds.height);
        } else {
          ctx.save();
          shapeClip(ctx, wx, wy, bounds.width, bounds.height, bounds.shape);
          ctx.clip();
          ctx.drawImage(camVideo, wx, wy, bounds.width, bounds.height);
          ctx.restore();
        }

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
    if (this.chunkWatchdog) {
      clearInterval(this.chunkWatchdog);
      this.chunkWatchdog = null;
    }
    cancelAnimationFrame(this.animationFrame);
    this.animationFrame = 0;
    this.recorder = null;
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
    this.pendingChunks = [];
  }
}
