## Lumen 1.3.0

A free photo editor for Windows, macOS and Android: iPhone-style adjustments and filters,
Photoshop tools, Canva-style fonts and templates, and on-device AI.

### Downloads

- **Windows 10/11 (64-bit):** `Lumen-Setup.exe`
- **macOS 11+ (Apple Silicon and Intel):** `Lumen-macOS.dmg`
- **Android 7+:** `Lumen-Android.apk`
- iPhone / iPad: not available yet (requires the App Store).

### ⚠️ Unsigned builds: read before installing

These installers are **not code-signed** (Windows), **not notarized** (macOS) and **not from
Google Play** (Android), because Lumen is a free independent project without paid developer
certificates. Your system will show a warning. It means the publisher is not verified; it does
not mean the file is harmful. The installers are built automatically from the source code in
this repository by GitHub Actions.

- **Windows:** on "Windows protected your PC", click **More info → Run anyway**.
- **macOS:** drag Lumen to Applications, then **right-click → Open**. On macOS 15+, use
  **System Settings → Privacy & Security → Open Anyway**. If macOS says the app "is damaged",
  run `xattr -cr /Applications/Lumen.app` in Terminal once.
- **Android:** allow "Install unknown apps" for your browser or file manager; if Play Protect
  warns, tap **More details → Install anyway**. The APK uses a development key, so a future
  Google Play version will need this one uninstalled first.

Only install if you are comfortable with this. Full instructions are in the README.

### What's new in 1.3

- **Enhance with AI:** one click balances light, color cast, noise and sharpness, and finds
  faces to brighten them with their own soft masks. Every change stays editable.
- **Interface languages:** English, Ukrainian and Russian, switchable in Preferences
  (Ctrl+,) without restarting. Menus follow the chosen language.
- **More stable:** fixed errors when the window was minimized or not yet shown; a broken layer
  can no longer corrupt the canvas; layers, masks, retouching, markup and AI backgrounds now
  stay in place when you crop, rotate or flip.
- Everything is free. A "Support" button links to a voluntary donation jar.

### Known limitations

- RAW is edited as 8-bit after development, so highlight recovery is limited.
- Images larger than 4608 px on the long side are reduced for editing and export.
- Projects with layers cannot be saved and reopened yet; export to PNG or JPEG.
- The macOS and Android builds have had little hands-on testing. Please report problems in Issues.

The software is provided "as is", without warranty. Keep backups of your originals.
