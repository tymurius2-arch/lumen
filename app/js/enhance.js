// "Улучшить с ИИ": one-click enhancement. Analyses light, color cast, noise and detail of the
// photo, finds faces with an on-device face detector (MediaPipe BlazeFace) and brightens
// underexposed faces with their own soft masks. Everything is a normal, editable setting.
import { FilesetResolver, FaceDetector } from '../vendor/mediapipe/vision_bundle.mjs';

const L = window.Lumen, $ = L.$, clamp = L.clamp;
const WASM = new URL('../vendor/mediapipe/wasm', import.meta.url).href;
const MODEL = new URL('../vendor/models/blaze_face_short_range.tflite', import.meta.url).href;
let detP = null;
const detector = () => detP || (detP = FilesetResolver.forVisionTasks(WASM).then(v =>
  FaceDetector.createFromOptions(v, {baseOptions: {modelAssetPath: MODEL, delegate: 'CPU'}, runningMode: 'IMAGE', minDetectionConfidence: .55})));

/* ---------- analysis of the original photo ---------- */
function analyse(d, w, h) {
  const H = new Uint32Array(256);
  let n = 0, sat = 0, cr = 0, cg = 0, cb = 0, cn = 0;
  for (let k = 0; k < d.length; k += 16) {
    const r = d[k], g = d[k + 1], b = d[k + 2], L8 = (.2126 * r + .7152 * g + .0722 * b) | 0;
    H[L8]++; n++;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    sat += mx ? (mx - mn) / mx : 0;
    // grey-world on mid-tones that are not strongly colored: the light's color cast
    if (L8 > 50 && L8 < 210 && mx - mn < 60) { cr += r; cg += g; cb += b; cn++; }
  }
  const pct = q => { let a = 0; for (let i = 0; i < 256; i++) { a += H[i]; if (a >= q * n) return i / 255; } return 1; };
  // noise: median of |pixel - average of its neighbours| in a sparse grid
  const diffs = [];
  for (let y = 2; y < h - 2; y += 7) for (let x = 2; x < w - 2; x += 7) {
    const i = (y * w + x) * 4, g0 = d[i + 1];
    const nb = (d[i + 5] + d[i - 3] + d[i + w * 4 + 1] + d[i - w * 4 + 1]) / 4;
    diffs.push(Math.abs(g0 - nb));
  }
  diffs.sort((a, b) => a - b);
  const m = cn ? [cr / cn, cg / cn, cb / cn] : [128, 128, 128], avg = (m[0] + m[1] + m[2]) / 3;
  return {p1: pct(.01), p5: pct(.05), p50: pct(.5), p95: pct(.95), p99: pct(.99), sat: sat / n,
    castRB: (m[0] - m[2]) / avg, castG: (m[1] - (m[0] + m[2]) / 2) / avg,
    noise: diffs[Math.floor(diffs.length * .5)] || 0, detail: diffs[Math.floor(diffs.length * .9)] || 0};
}
function plan(a) {
  const r = Math.round, adj = {};
  adj.exposure = r(clamp((.47 - a.p50) * 140, -55, 55));
  adj.highlights = a.p99 > .96 ? -r(clamp((a.p99 - .88) * 450, 0, 60)) : 0;
  adj.shadows = a.p5 < .08 ? r(clamp((.14 - a.p5) * 380, 0, 50)) : 5;
  adj.blackpoint = a.p1 > .05 ? r(clamp(a.p1 * 260, 0, 30)) : 3;
  const spread = a.p95 - a.p5;
  adj.contrast = r(clamp((.78 - spread) * 70, -10, 28));
  adj.brilliance = 18;
  adj.vibrance = r(clamp((.32 - a.sat) * 110, 6, 35));
  adj.warmth = r(clamp(-a.castRB * 180, -30, 30));
  adj.tint = r(clamp(a.castG * 220, -20, 20));
  adj.noise = a.noise > 5 ? r(clamp((a.noise - 4) * 9, 0, 55)) : 0;
  adj.sharpness = a.noise > 9 ? 8 : 18;
  adj.definition = a.detail < 22 ? 14 : 6;
  return adj;
}
// source pixel (of the preview image) -> point in the visible frame
function srcToOut(x, y) {
  const g = L.S.geom, w = L.img.prev.width, h = L.img.prev.height, [OW, OH] = L.oriented(w, h), c = g.crop;
  const a = (((g.rot % 4) + 4) % 4) * Math.PI / 2;
  let px = x - w / 2, py = y - h / 2;
  let qx = px * Math.cos(a) - py * Math.sin(a), qy = px * Math.sin(a) + py * Math.cos(a);
  if (g.flip) qx = -qx;
  const u = (qx + OW / 2) / OW, v = (qy + OH / 2) / OH;
  return [(u - c.x) / c.w, (v - c.y) / c.h];
}
async function enhance() {
  const img = L.img; if (!img) return;
  const btn = $('#btnAiEnh'); btn.disabled = true; btn.querySelector('span').textContent = 'ИИ анализирует фото…';
  try {
    const d = img.prevData, w = img.prev.width, h = img.prev.height;
    const a = analyse(d.data, w, h), adj = plan(a);
    const S = L.S;
    Object.assign(S.adj, adj); S.off = {};
    // faces: brighten the ones that are darker than the rest of the photo
    let faces = [];
    try { const det = await detector(); faces = det.detect(img.prev).detections || []; } catch (e) { console.warn('face detector unavailable', e); }
    let lifted = 0;
    S.masks = (S.masks || []).filter(m => !m.aiFace);
    faces.slice(0, 6).forEach((f, i) => {
      const b = f.boundingBox; if (!b) return;
      let sum = 0, cnt = 0;
      for (let y = Math.max(0, b.originY | 0); y < Math.min(h, b.originY + b.height); y += 3)
        for (let x = Math.max(0, b.originX | 0); x < Math.min(w, b.originX + b.width); x += 3) { const k = (y * w + x) * 4; sum += .2126 * d.data[k] + .7152 * d.data[k + 1] + .0722 * d.data[k + 2]; cnt++; }
      const fl = cnt ? sum / cnt / 255 : .5;
      const target = Math.max(.42, a.p50 + .05);
      const ev = clamp(Math.round((target - fl) * 160), 0, 45);
      if (ev < 6) return;
      const [cu, cv] = srcToOut(b.originX + b.width / 2, b.originY + b.height * .45);
      const [eu, ev2] = srcToOut(b.originX + b.width, b.originY + b.height);
      const [ou, ov] = srcToOut(b.originX, b.originY);
      const rx = Math.abs(eu - ou) * .85, ry = Math.abs(ev2 - ov) * .9;
      S.masks.push({id: Math.random().toString(36).slice(2, 9), kind: 'radial', name: `Лицо ${i + 1}`, aiFace: true, invert: false,
        geo: [cu, cv, Math.max(.02, rx), Math.max(.02, ry), .6], strokes: [],
        p: {exposure: ev, contrast: 0, saturation: -4, warmth: 6, tint: 0, blur: 0, bw: 0}});
      lifted++;
    });
    L.push('Улучшить с ИИ');
    L.syncUI(); L.invalidate(true);
    const facesNote = faces.length ? (lifted ? `Лиц найдено: ${faces.length}, высветлено: ${lifted}. ` : `Лиц найдено: ${faces.length}, они уже хорошо освещены. `) : '';
    L.toast(`${facesNote}Свет, цвет и резкость выровнены. Все можно поправить вручную или отменить Ctrl+Z.`);
  } finally {
    btn.disabled = false; btn.querySelector('span').textContent = 'Улучшить с ИИ';
  }
}

/* ---------- button in the adjustments panel ---------- */
const b = document.createElement('button');
b.className = 'aienh'; b.id = 'btnAiEnh'; b.title = 'Свет, цвет, шум и лица — автоматически';
b.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 19.5 14 10"/><path d="m12.5 8.5 3 3"/><path d="M17 2.5 18 5l2.5 1L18 7l-1 2.5L16 7l-2.5-1L16 5z" fill="currentColor"/><path d="M7 3v3M5.5 4.5h3"/></svg><span>Улучшить с ИИ</span>`;
$('#chips').before(b);
b.onclick = enhance;
L.commands.aiEnhance = enhance;
L.aiEnhance = enhance;
