import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { ControlApp } from "./windows/control-app";
import { WebcamApp } from "./windows/webcam-app";
import { IndicatorApp } from "./windows/indicator-app";
import { CountdownApp } from "./windows/countdown-app";
import { RegionApp } from "./windows/region-app";

import "./styles.css";

const params = new URLSearchParams(window.location.search);
const windowName = params.get("window") ?? "control";

const App =
  windowName === "webcam"
    ? WebcamApp
    : windowName === "indicator"
      ? IndicatorApp
      : windowName === "countdown"
        ? CountdownApp
        : windowName === "region"
          ? RegionApp
          : ControlApp;

const root = createRoot(document.getElementById("root")!);

// Overlay windows keep media streams alive — StrictMode double-mount breaks camera play().
if (windowName === "control") {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} else {
  root.render(<App />);
}
