# Lumen: maintainer guide

Lumen is free: every feature is open, no accounts and no subscriptions. Donations go to a
monobank jar.

## 1. Donation link

The jar link is set in two places:
- `app/js/config.js` → `monoJarUrl` (the Support button in the app);
- `web/index.html` → `const JAR = '...'` (the Support section of the website).

## 2. Publishing a release

The website is the `web/` folder (deployed by `.github/workflows/pages.yml` on every push to
`main`). Installers are built by `.github/workflows/release.yml`:

1. Update `version` in `package.json` and the notes in `RELEASE_NOTES.md`.
2. Commit, then tag and push: `git tag v1.3.0 && git push origin main --tags`.
3. In about 20 minutes the release contains `Lumen-Setup.exe`, `Lumen-macOS.dmg` and
   `Lumen-Android.apk`, and the website download buttons point to them.

## 3. Code signing (removes the security warnings)

The current builds are unsigned. To sign them:

- **Windows:** buy a code-signing certificate (for example Certum Open Source, about 50 € per
  year, or an OV certificate from Sectigo or DigiCert; the CA verifies your identity). Export it
  as `.pfx`, encode it as base64 and add two repository secrets: `WIN_CSC_LINK` (the base64
  text) and `WIN_CSC_KEY_PASSWORD`. The next tag produces a signed installer. Certificates
  stored on a token or in the cloud need their vendor's signing tool instead; the workflow step
  has to be adapted for that.
- **macOS:** join the Apple Developer Program (99 $ per year), create a "Developer ID
  Application" certificate and an app-specific password, add them as secrets (`CSC_LINK`,
  `CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`), set
  `mac.identity` back to automatic and enable notarization in `package.json`.
- **Android:** create a release keystore, add it as a secret and switch the workflow from
  `assembleDebug` to a signed `assembleRelease` / `bundleRelease`. Google Play needs a developer
  account (25 $ once).
- **iOS:** needs the Apple Developer Program; the build can then be uploaded to TestFlight
  and the App Store from GitHub Actions.

## 4. Development

```
npm install
npm start                    # desktop app in development mode (with developer tools in the View menu)
npm run dist:win             # Windows installer into dist/
python scripts/dev-page.py   # app/__dev.html: the editor with a stub bridge, for testing in a browser
```

`scripts/vendor.js` copies the WebAssembly libraries, fonts and AI models into `app/vendor/`;
it runs automatically before `start` and the builds.
