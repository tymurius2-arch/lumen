# Lumen

A free photo editor for Windows, macOS and Android. It combines the adjustments and filters of
iPhone Photos, the precision tools of Photoshop, the fonts and templates of Canva, and on-device AI.
Everything runs locally: your photos are never uploaded anywhere.

**Website:** https://tymurius2-arch.github.io/lumen/ · Interface languages: English, Українська, Русский

## Download

| Platform | File | Requirements |
|---|---|---|
| Windows | [Lumen-Setup.exe](https://github.com/tymurius2-arch/lumen/releases/latest/download/Lumen-Setup.exe) | Windows 10 or 11, 64-bit |
| macOS | [Lumen-macOS.dmg](https://github.com/tymurius2-arch/lumen/releases/latest/download/Lumen-macOS.dmg) | macOS 11 Big Sur or later, Apple Silicon or Intel |
| Android | [Lumen-Android.apk](https://github.com/tymurius2-arch/lumen/releases/latest/download/Lumen-Android.apk) | Android 7 or later |
| iPhone / iPad | not available yet | needs an Apple Developer account and App Store review |

All releases: https://github.com/tymurius2-arch/lumen/releases

## ⚠️ Before you install: the apps are not signed

Lumen is a free, independent project. The installers are **not code-signed** with a paid
certificate (Windows), **not notarized** by Apple (macOS) and **not published on Google Play**
(Android). Your system will warn you about this. The warnings mean "this publisher is not
verified", not "this file is infected". The full source code is in this repository, and the
installers are built from it automatically by GitHub Actions (see `.github/workflows/release.yml`),
so you can check exactly what you run.

If you do not want to bypass these warnings, do not install Lumen. That is a reasonable choice.

### Windows: "Windows protected your PC"

Microsoft SmartScreen blocks new apps without a paid signature.

1. Run `Lumen-Setup.exe`.
2. If the blue **Windows protected your PC** window appears, click **More info**.
3. Click **Run anyway**, then follow the installer.

Your antivirus may also ask about the file. Lumen does not need administrator rights unless
you install it for all users.

### macOS: "Lumen can't be opened" or "Lumen is damaged"

The app is ad-hoc signed but not notarized by Apple, so Gatekeeper blocks it on first launch.

1. Open `Lumen-macOS.dmg` and drag **Lumen** into **Applications**.
2. In Applications, **right-click** (or Control-click) Lumen and choose **Open**, then **Open** again.
   On macOS 15 and later: open **System Settings → Privacy & Security**, scroll down and click
   **Open Anyway** next to the Lumen message.
3. If macOS says the app **is damaged and can't be opened**, it is the quarantine flag on
   downloaded unsigned apps, not real damage. Run this once in **Terminal**:
   ```
   xattr -cr /Applications/Lumen.app
   ```
   Then open Lumen normally.

### Android: "Install unknown apps" and Play Protect

The APK is installed outside Google Play and is signed with a development key.

1. Download `Lumen-Android.apk` on your phone and open it.
2. Allow **Install unknown apps** for your browser or file manager when asked.
3. If **Google Play Protect** warns that the app is unknown, tap **More details → Install anyway**.

Because the key is a development key, a future Google Play version will not update this APK
in place: you will need to uninstall it first.

### iPhone and iPad

There is no iOS build to download. Apple only allows installing apps through the App Store
(or TestFlight), which requires a paid Apple Developer account. The iOS project is in `ios/`
and is compiled on every release as a check.

## Features

- **Like on iPhone:** 15 adjustments in the same order as Photos (Exposure, Brilliance,
  Highlights, Shadows, Contrast, Brightness, Black Point, Saturation, Vibrance, Warmth, Tint,
  Sharpness, Definition, Noise Reduction, Vignette), 10 filters with a strength dial, Auto,
  crop, straighten, rotate and flip.
- **Like in Photoshop:** layers with 16 blend modes and free transform, Levels, Curves,
  Color Balance, Hue/Saturation, Photo Filter, Gradient Map, Desaturate, Invert, Posterize,
  Threshold; Gaussian Blur, Motion Blur, Add Noise, Mosaic, Emboss, Find Edges; Spot Healing
  Brush, Healing Brush, Clone Stamp, Dodge, Burn, Sponge; masks (brush, gradient, radial);
  history panel, grid, zoom and hand tool, the usual shortcuts.
- **Like in Canva:** 36 bundled fonts with Cyrillic, 10 text styles, design templates in
  social-media sizes, stickers and a brand kit (colors, fonts, logo).
- **AI on your device:** one-click photo enhancement that also finds and brightens faces,
  object selection, background removal, blur or recolor, cut an object into a layer.
- **Formats:** JPEG, PNG, WebP, HEIC, camera RAW (CR2, CR3, NEF, ARW, DNG, RAF, ORF, RW2 and
  more). Batch processing and saved looks.

## Known limitations

- RAW files are developed with LibRaw and then edited as 8-bit images, so very blown-out
  highlights cannot be recovered as far as in Lightroom.
- Very large images are reduced to 4608 px on the long side for editing and export.
- Projects with layers cannot be saved and reopened yet: export the result as PNG or JPEG.
- Text uses the fonts bundled with the app; system fonts are not listed.
- Tested mainly on Windows 11. The macOS and Android builds are produced automatically and
  have had little hands-on testing. Please report problems in Issues.

## Support the project

Lumen is completely free, with no subscriptions and no ads. If it helped you, you can make a
voluntary donation to the author's monobank jar: https://send.monobank.ua/jar/Aey1zFan6k

## Build from source

Requires Node.js 20+.

```
npm install
npm start              # run the desktop app (development mode)
npm run dist:win       # build the Windows installer into dist/
npm run dist:mac       # build the macOS app (must run on a Mac)
```

The Android and iOS apps use Capacitor (`npx cap sync android`, `npx cap sync ios`).
Releases are built by GitHub Actions when a tag like `v1.3.0` is pushed. See `SETUP.md` for
code signing and publishing.

## Privacy

Lumen works offline. It does not collect analytics, does not need an account and does not
send your photos or any other data anywhere. The only network requests are the ones you start
yourself (opening the website or the donation link).

## License

Lumen is released under the MIT License (see `LICENSE`). It bundles third-party components
under their own licenses, listed in `THIRD_PARTY_NOTICES.md`.

The software is provided "as is", without warranty of any kind. Keep backups of your original
photos.
