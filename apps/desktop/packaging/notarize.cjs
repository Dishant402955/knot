/**
 * macOS notarization after electron-builder signs the app.
 * Runs only when APPLE_ID / APPLE_APP_SPECIFIC_PASSWORD / APPLE_TEAM_ID are set.
 *
 * @param {import('electron-builder').AfterPackContext} context
 */
exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== "darwin") return;

  const appleId = process.env.APPLE_ID?.trim();
  const appleIdPassword = process.env.APPLE_APP_SPECIFIC_PASSWORD?.trim();
  const teamId = process.env.APPLE_TEAM_ID?.trim();

  if (!appleId || !appleIdPassword || !teamId) {
    console.log(
      "[knot] Skipping notarization — set APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID to enable.",
    );
    return;
  }

  const { notarize } = await import("@electron/notarize");
  const appName = context.packager.appInfo.productFilename;

  console.log(`[knot] Notarizing ${appName}…`);
  await notarize({
    appPath: `${appOutDir}/${appName}.app`,
    appleId,
    appleIdPassword,
    teamId,
  });
  console.log("[knot] Notarization submitted / complete.");
};
