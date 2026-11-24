// Copies browser builds of third-party libraries, fonts and models into app/vendor
// so the app works fully offline (Electron and Capacitor load app/ as-is).
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const out = path.join(root, 'app', 'vendor');
const copy = (from, to) => {
  const src = path.join(root, from), dst = path.join(out, to);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  if (fs.statSync(src).isDirectory()) fs.cpSync(src, dst, { recursive: true });
  else fs.copyFileSync(src, dst);
};
fs.rmSync(out, { recursive: true, force: true });
copy('node_modules/@mediapipe/tasks-vision/vision_bundle.mjs', 'mediapipe/vision_bundle.mjs');
copy('node_modules/@mediapipe/tasks-vision/wasm/vision_wasm_internal.js', 'mediapipe/wasm/vision_wasm_internal.js');
copy('node_modules/@mediapipe/tasks-vision/wasm/vision_wasm_internal.wasm', 'mediapipe/wasm/vision_wasm_internal.wasm');
copy('build/models/interactive_segmentation.task', 'models/interactive_segmentation.task');
copy('build/models/blaze_face_short_range.tflite', 'models/blaze_face_short_range.tflite');
copy('node_modules/libraw-wasm/dist', 'libraw');
copy('node_modules/libheif-js/libheif-wasm/libheif-bundle.mjs', 'libheif/libheif-bundle.mjs');
copy('build/fonts', 'fonts');
console.log('vendor files copied to', path.relative(root, out));
