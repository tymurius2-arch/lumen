# Third-party components

Lumen bundles the following components. Each remains under its own license.

| Component | Used for | License |
|---|---|---|
| [Electron](https://www.electronjs.org/) | desktop app shell | MIT |
| [Capacitor](https://capacitorjs.com/) | Android and iOS app shell | MIT |
| [MediaPipe Tasks Vision](https://github.com/google-ai-edge/mediapipe) | AI object selection, face detection | Apache-2.0 |
| MediaPipe models: Interactive Segmenter (Magic Touch), BlazeFace short range | on-device AI models | Apache-2.0 |
| [LibRaw](https://www.libraw.org/) via [libraw-wasm](https://www.npmjs.com/package/libraw-wasm) | camera RAW decoding | LibRaw: LGPL-2.1 or CDDL-1.0; libraw-wasm wrapper: ISC |
| [libheif](https://github.com/strukturag/libheif) via [libheif-js](https://github.com/catdad-experiments/libheif-js) | HEIC/HEIF decoding | LGPL-3.0 |
| Google Fonts: Montserrat, Playfair Display, Lobster, Comfortaa, Caveat, Rubik, Oswald, Russo One, Unbounded, Manrope, Prata, Marck Script, Bad Script, Amatic SC, Yeseva One, Alegreya, PT Serif, Ubuntu, Nunito, Raleway, Exo 2, Philosopher, Neucha, Pangolin, Golos Text, Inter, Roboto Slab, Lora, Cormorant Garamond, Kelly Slab, Press Start 2P, Rubik Mono One, Great Vibes, Pacifico, Jura, Tenor Sans | bundled text fonts | SIL Open Font License 1.1 (Ubuntu: Ubuntu Font Licence 1.0) |

The LGPL libraries are used unmodified as separate WebAssembly modules in `app/vendor/`
(copied from npm by `scripts/vendor.js`), so they can be replaced with other builds.
