import { app, dialog } from "electron";
import { autoUpdater } from "electron-updater";

/**
 * GitHub Releases auto-update (electron-builder publish.provider = github).
 * No-op in unpackaged/dev builds.
 */
export function setupAutoUpdater() {
  if (!app.isPackaged) {
    console.log("[knot] Auto-update skipped (not packaged).");
    return;
  }

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("checking-for-update", () => {
    console.log("[knot] Checking for updates…");
  });

  autoUpdater.on("update-available", (info) => {
    console.log(`[knot] Update available: ${info.version}`);
  });

  autoUpdater.on("update-not-available", () => {
    console.log("[knot] App is up to date.");
  });

  autoUpdater.on("error", (error) => {
    console.error("[knot] Auto-update error:", error);
  });

  autoUpdater.on("update-downloaded", (info) => {
    console.log(`[knot] Update downloaded: ${info.version}`);
    void dialog
      .showMessageBox({
        type: "info",
        title: "Update ready",
        message: `Knot ${info.version} has been downloaded.`,
        detail: "Restart now to apply the update, or continue and restart later.",
        buttons: ["Restart now", "Later"],
        defaultId: 0,
        cancelId: 1,
      })
      .then(({ response }) => {
        if (response === 0) {
          autoUpdater.quitAndInstall(false, true);
        }
      });
  });

  // Delay so first paint / auth aren't blocked.
  setTimeout(() => {
    void autoUpdater.checkForUpdates().catch((error) => {
      console.error("[knot] checkForUpdates failed:", error);
    });
  }, 8_000);
}
