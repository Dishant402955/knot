# Branding + signing assets for electron-builder (`directories.buildResources`).
#
# icon.png — app / installer icon (≥512×512). electron-builder derives .ico / .icns.
#
# Code signing (Windows):
#   CSC_LINK              — path to .pfx/.p12 or base64 of the cert
#   CSC_KEY_PASSWORD      — certificate password
#
# Notarization (macOS) — packaging/notarize.cjs:
#   APPLE_ID
#   APPLE_APP_SPECIFIC_PASSWORD
#   APPLE_TEAM_ID
# Entitlements: entitlements.mac.plist (camera + mic + hardened runtime helpers)
#
# Auto-update publish:
#   GH_TOKEN (or GITHUB_TOKEN) with repo release permissions
#   pnpm --filter desktop release:win|mac|linux
