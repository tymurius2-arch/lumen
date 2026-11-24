// AI object selection (MediaPipe Interactive Segmenter, runs on the device, offline).
// Click an object to select it; Alt-click removes, drag paints, lasso circles it.
// Then: remove / blur / desaturate / recolor the background, cut the object to a layer,
// or turn the selection into a local-adjustment mask.
import { FilesetResolver, InteractiveSegmenter } from '../vendor/mediapipe/vision_bundle.mjs';

const L = window.Lumen, $ = L.$, mk = L.mk;
const WASM = new URL('../vendor/mediapipe/wasm', import.meta.url).href;
const MODEL = new URL('../vendor/models/interactive_segmentation.task', import.meta.url).href;
let segP = null, imageKey = null;

async function segmenter() {
  if (!segP) segP = (async () => {
    const vision = await FilesetResolver.forVisionTasks(WASM);
    // CPU: the GPU path returned empty masks on some drivers, CPU is reliable and fast enough
    return InteractiveSegmenter.createFromOptions(vision, {baseOptions: {modelAssetPath: MODEL, delegate: 'CPU'}});
  })();
  return segP;
}
// probability mask -> white canvas with alpha
function maskToCanvas(mask) {
  const w = mask.width, h = mask.height, f = mask.getAsFloat32Array(), c = mk(w, h), x = c.getContext('2d');
  const id = x.createImageData(w, h), d = id.data;
  for (let i = 0; i < w * h; i++) { const v = f[i], a = v <= .35 ? 0 : v >= .65 ? 1 : (v - .35) / .3; d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = 255; d[i * 4 + 3] = a * 255; }
  x.putImageData(id, 0, 0);
  // soften the cut edge a little
  const s = mk(w, h), sx = s.getContext('2d'); sx.filter = `blur(${Math.max(.6, Math.max(w, h) / 900).toFixed(1)}px)`; sx.drawImage(c, 0, 0);
  return s;
}
function baseImage() {
  const [OW, OH] = L.oriented(L.img.prev.width, L.img.prev.height), c = L.S.geom.crop;
  const W = Math.max(1, Math.round(c.w * OW)), H = Math.max(1, Math.round(c.h * OH));
  const cv = mk(W, H); L.drawGeomOutput(cv.getContext('2d'), L.procC, W, H);
  return cv;
}

/* ---------- selection state ---------- */
let strokes = [], selC = null, tool = 'click', busy = false, live = null;
async function run() {
  if (!strokes.length) { selC = null; L.schedule(); renderPanel(); return; }
  busy = true; renderPanel();
  try {
    const seg = await segmenter();
    const key = L.img.name + '|' + JSON.stringify(L.S.geom) + '|' + L.img.prev.width;
    if (key !== imageKey) { seg.setImage(baseImage()); imageKey = key; }
    const m = seg.segment(strokes);
    selC = maskToCanvas(m); m.close();
  } catch (e) { console.error(e); L.toast('Не получилось выделить. Попробуйте нажать в центр объекта.'); }
  busy = false; renderPanel(); L.schedule();
}
async function cutoutMain(canvas) {
  const seg = await segmenter();
  seg.setImage(canvas); imageKey = null;
  const m = seg.segment([{brushMode: 1, point: [{x: .5, y: .5}], isCompleted: true}]);
  const mc = maskToCanvas(m); m.close();
  const out = mk(canvas.width, canvas.height), x = out.getContext('2d');
  x.drawImage(canvas, 0, 0); x.globalCompositeOperation = 'destination-in'; x.drawImage(mc, 0, 0, out.width, out.height);
  return out;
}
L.ai = {cutoutMain, segmenter};

/* ---------- background effects (stored in history as S.bg) ---------- */
L.HOOKS.state.push(st => { st.bg = null; });
const tmp = document.createElement('canvas'), obj = document.createElement('canvas');
L.HOOKS.out.push(cv => {
  const bg = L.S.bg; if (!bg) return;
  const mask = L.assets.get(bg.asset); if (!mask) return;
  const W = cv.width, H = cv.height, x = cv.getContext('2d');
  obj.width = W; obj.height = H;
  const ox = obj.getContext('2d'); ox.drawImage(cv, 0, 0); ox.globalCompositeOperation = 'destination-in'; ox.drawImage(mask, 0, 0, W, H); ox.globalCompositeOperation = 'source-over';
  if (bg.invert) { ox.globalCompositeOperation = 'source-over'; }
  x.save(); x.setTransform(1, 0, 0, 1, 0, 0);
  if (bg.mode === 'remove') { x.clearRect(0, 0, W, H); }
  else if (bg.mode === 'color') { x.fillStyle = bg.color; x.fillRect(0, 0, W, H); }
  else {
    tmp.width = W; tmp.height = H; const tx = tmp.getContext('2d');
    tx.filter = bg.mode === 'blur' ? `blur(${(W * .012 * (bg.amount || 60) / 60).toFixed(1)}px)` : 'grayscale(1)';
    tx.drawImage(cv, 0, 0); tx.filter = 'none';
    x.clearRect(0, 0, W, H); x.drawImage(tmp, 0, 0);
  }
  x.drawImage(obj, 0, 0);
  x.restore();
});
L.HOOKS.outKey.push(() => JSON.stringify(L.S.bg || null));
const syncTransparent = () => { L.transparent = !!(L.S.bg && L.S.bg.mode === 'remove'); };
L.HOOKS.sync.push(syncTransparent);

/* ---------- canvas interaction ---------- */
L.HOOKS.afterDraw.push((ctx, r) => {
  if (L.mode !== 'select') return;
  if (selC) {
    const t = mk(Math.round(r.w), Math.round(r.h)), tx = t.getContext('2d');
    tx.drawImage(selC, 0, 0, t.width, t.height); tx.globalCompositeOperation = 'source-in'; tx.fillStyle = 'rgba(10,132,255,.42)'; tx.fillRect(0, 0, t.width, t.height);
    ctx.drawImage(t, r.x, r.y);
  }
  ctx.save(); ctx.lineWidth = 2;
  strokes.forEach(s => {
    ctx.strokeStyle = ctx.fillStyle = s.brushMode === 2 ? '#ff453a' : s.brushMode === 3 ? '#ffd60a' : '#30d158';
    if (s.point.length === 1) { const p = s.point[0]; ctx.beginPath(); ctx.arc(r.x + p.x * r.w, r.y + p.y * r.h, 5, 0, 7); ctx.fill(); }
    else { ctx.beginPath(); s.point.forEach((p, i) => (i ? ctx.lineTo : ctx.moveTo).call(ctx, r.x + p.x * r.w, r.y + p.y * r.h)); if (s.brushMode === 3) ctx.closePath(); ctx.stroke(); }
  });
  if (live) { ctx.strokeStyle = '#fff'; ctx.beginPath(); live.point.forEach((p, i) => (i ? ctx.lineTo : ctx.moveTo).call(ctx, r.x + p.x * r.w, r.y + p.y * r.h)); ctx.stroke(); }
  ctx.restore();
});
L.HOOKS.pointer.select = {
  down(p, e) {
    if (busy) return;
    const r = L.outRect(), u = (p.x - r.x) / r.w, v = (p.y - r.y) / r.h;
    if (u < 0 || v < 0 || u > 1 || v > 1) return;
    const mode = e.altKey ? 2 : tool === 'lasso' ? 3 : 1;
    if (!e.shiftKey && !e.altKey && tool === 'click') strokes = [];
    live = {brushMode: mode, point: [{x: u, y: v}], isCompleted: true};
  },
  move(p) {
    if (!live) return;
    const r = L.outRect();
    live.point.push({x: L.clamp((p.x - r.x) / r.w, 0, 1), y: L.clamp((p.y - r.y) / r.h, 0, 1)});
    L.schedule();
  },
  up() {
    if (!live) return;
    if (live.point.length > 3 && tool === 'click' && live.brushMode === 1) live.point = live.point.filter((_, i) => i % 2 === 0);
    if (tool === 'lasso' && live.point.length < 3) live.brushMode = 1;
    strokes.push(live); live = null; run();
  },
};

/* ---------- panel ---------- */
const pane = document.createElement('div');
pane.className = 'pane'; pane.dataset.pane = 'select'; pane.hidden = true;
pane.innerHTML = `
  <div class="seg" id="aiTools"><button data-t="click" aria-pressed="true">Клик по объекту</button><button data-t="lasso" aria-pressed="false">Лассо</button></div>
  <p class="note" id="aiHint">Нажмите на человека, вещь или животное — ИИ выделит его целиком. Shift + клик добавляет, Alt + клик убирает лишнее. Можно провести линию по объекту.</p>
  <div class="row"><button class="tool" id="aiMain">Выделить главный объект</button><button class="pill" id="aiClear">Сбросить</button></div>
  <p class="meta" id="aiStatus"></p>
  <div class="rhead"><b>Фон</b></div>
  <div class="row">
    <button class="tool" data-bg="remove">Удалить фон</button><button class="tool" data-bg="blur">Размыть фон</button>
    <button class="tool" data-bg="bw">Ч/Б фон</button><button class="tool" data-bg="color">Залить фон цветом</button>
  </div>
  <div class="row"><button class="pill" id="aiBgOff">Вернуть фон</button></div>
  <div class="rhead"><b>Объект</b></div>
  <div class="row"><button class="tool" id="aiLayer">Вырезать в слой</button><button class="tool" id="aiMask">Маска для коррекции</button><button class="tool" id="aiMaskInv">Маска для фона</button></div>
  <p class="note">Все работает на вашем устройстве, фото никуда не отправляются. Фото без фона сохраняйте в PNG.</p>`;
document.querySelector('.panel .sec:not(.histo):not(.history)').appendChild(pane);
const railBtn = document.createElement('button');
railBtn.className = 'mode'; railBtn.dataset.mode = 'select'; railBtn.setAttribute('aria-pressed', 'false'); railBtn.title = 'Выделение объекта ИИ, удаление фона';
railBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2"/><path d="M12 7.5 13.2 10.8 16.5 12l-3.3 1.2L12 16.5l-1.2-3.3L7.5 12l3.3-1.2z" fill="currentColor"/></svg>Выделение`;
document.querySelector('.mode[data-mode="crop"]').before(railBtn);

const needSel = () => { if (!selC) { L.toast('Сначала выделите объект: нажмите на него на фото'); return false; } return true; };
function renderPanel() {
  $('#aiTools').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.t === tool));
  $('#aiStatus').textContent = busy ? 'ИИ думает…' : selC ? 'Объект выделен' : (segP ? '' : 'При первом выделении ИИ загружается пару секунд');
  pane.querySelectorAll('[data-bg]').forEach(b => b.setAttribute('aria-pressed', !!(L.S.bg && L.S.bg.mode === b.dataset.bg)));
}
$('#aiTools').onclick = e => { const b = e.target.closest('button'); if (b) { tool = b.dataset.t; renderPanel(); } };
$('#aiClear').onclick = () => { strokes = []; selC = null; renderPanel(); L.schedule(); };
$('#aiMain').onclick = () => { strokes = [{brushMode: 1, point: [{x: .5, y: .5}], isCompleted: true}]; run(); };
pane.querySelectorAll('[data-bg]').forEach(b => b.onclick = () => {
  if (!needSel()) return;
  const id = L.addAsset(selC);
  L.S.bg = {mode: b.dataset.bg, asset: id, color: L.markColor, amount: 60};
  syncTransparent();
  L.push({remove: 'Фон удален', blur: 'Фон размыт', bw: 'Фон обесцвечен', color: 'Фон залит цветом'}[b.dataset.bg]);
  strokes = []; selC = null; renderPanel(); L.schedule();
});
$('#aiBgOff').onclick = () => { if (!L.S.bg) return; L.S.bg = null; syncTransparent(); L.push('Фон возвращен'); renderPanel(); L.schedule(); };
$('#aiLayer').onclick = () => {
  if (!needSel()) return;
  const src = L.getOut(), c = mk(src.width, src.height), x = c.getContext('2d');
  x.drawImage(src, 0, 0); x.globalCompositeOperation = 'destination-in'; x.drawImage(selC, 0, 0, c.width, c.height);
  L.addImageLayer(c, 'Вырезанный объект', 1);
  strokes = []; selC = null; L.toast('Объект вырезан в новый слой: его можно двигать и копировать');
};
const toMask = inv => { if (!needSel()) return; L.addMask('ai', {asset: L.addAsset(selC), invert: inv, name: inv ? 'Фон' : 'Объект'}, inv ? 'Маска фона' : 'Маска объекта'); strokes = []; selC = null; };
$('#aiMask').onclick = () => toMask(false);
$('#aiMaskInv').onclick = () => toMask(true);
L.HOOKS.mode.push(m => { if (m === 'select') { renderPanel(); segmenter().then(() => renderPanel()).catch(e => { console.error(e); L.toast('ИИ не запустился на этом устройстве'); }); } else { live = null; } });
L.HOOKS.image.push(() => { strokes = []; selC = null; imageKey = null; L.transparent = false; });
// keep the removed/blurred background on the right spot after crop, rotate or flip
L.HOOKS.remap.push(T => {
  const bg = L.S.bg; if (bg) { const a = L.assets.get(bg.asset); if (a) bg.asset = L.addAsset(T.canvas(a)); }
  strokes = []; selC = null; imageKey = null;
});
document.dispatchEvent(new Event('lumen:ai'));
