import type { WebcamShape, WebcamSize } from "./types";

export const WEBCAM_SIZES: WebcamSize[] = ["small", "medium", "large"];

export function dimensionsForWebcam(size: WebcamSize, shape: WebcamShape) {
  const square =
    size === "small" ? 140 : size === "medium" ? 220 : 300;

  if (shape === "rectangle") {
    return { width: Math.round(square * 1.28), height: Math.round(square * 0.72) };
  }

  return { width: square, height: square };
}

export function normalizeWebcamBounds(bounds: {
  x: number;
  y: number;
  width: number;
  height: number;
  shape: WebcamShape;
  size?: WebcamSize;
}) {
  const size = bounds.size ?? "medium";
  const { width, height } = dimensionsForWebcam(size, bounds.shape);

  return {
    ...bounds,
    size,
    width,
    height,
  };
}
