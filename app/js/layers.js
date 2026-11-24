// Layers: text (Canva-style fonts and effects), images and logos, shapes, stickers.
// Photoshop-style: opacity, blend modes, order, visibility, free transform (V).
(function () {
  const L = window.Lumen, $ = L.$, clamp = L.clamp, mk = L.mk;
  L.assets = L.assets || new Map();

  const FONTS = ['Inter', 'Montserrat', 'Rubik', 'Playfair Display', 'Caveat', 'Lobster', 'Manrope', 'Unbounded', 'Golos Text',
    'Oswald', 'Russo One', 'Comfortaa', 'Raleway', 'Nunito', 'Ubuntu', 'Exo 2', 'Jura', 'Tenor Sans', 'Prata', 'Lora',
    'PT Serif', 'Alegreya', 'Cormorant Garamond', 'Roboto Slab', 'Yeseva One', 'Philosopher', 'Kelly Slab', 'Marck Script',
    'Bad Script', 'Great Vibes', 'Pacifico', 'Amatic SC', 'Neucha', 'Pangolin', 'Press Start 2P', 'Rubik Mono One'];
  L.FONTS = FONTS;
  const BLENDS = [['source-over', 'Обычный'], ['multiply', 'Умножение'], ['screen', 'Экран'], ['overlay', 'Перекрытие'],
    ['darken', 'Затемнение'], ['lighten', 'Замена светлым'], ['color-dodge', 'Осветление основы'], ['color-burn', 'Затемнение основы'],
    ['soft-light', 'Мягкий свет'], ['hard-light', 'Жесткий свет'], ['difference', 'Разница'], ['exclusion', 'Исключение'],
    ['hue', 'Цветовой тон'], ['saturation', 'Насыщенность'], ['color', 'Цветность'], ['luminosity', 'Яркость']];
  const SHAPES = [['rect', 'Прямоугольник'], ['round', 'Скругленный'], ['ellipse', 'Круг'], ['triangle', 'Треугольник'],
    ['star', 'Звезда'], ['heart', 'Сердце'], ['line', 'Линия'], ['arrow', 'Стрелка'], ['badge', 'Ценник']];
  const STICKERS = ['😍', '🔥', '✨', '❤️', '👍', '😂', '🎉', '⭐', '💯', '🌸', '☀️', '🌈', '📸', '💡', '🛍️', '🏷️', '✅', '➡️', '💬', '🎁', '🥳', '😎', '🍀', '⚡'];
  const EMOJI_FONT = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
  const TEXT_STYLES = [
    {name: 'Заголовок', s: {font: 'Montserrat', weight: 900, size: .09, color: '#ffffff', shadow: {color: 'rgba(0,0,0,.45)', blur: 18, y: 4}, stroke: null, bg: null}},
    {name: 'Подзаголовок', s: {font: 'Manrope', weight: 700, size: .05, color: '#ffffff', shadow: {color: 'rgba(0,0,0,.35)', blur: 12, y: 2}, stroke: null, bg: null}},
    {name: 'Неон', s: {font: 'Rubik', weight: 700, size: .08, color: '#fff4ff', shadow: {color: '#ff2bd6', blur: 60, y: 0}, stroke: {color: '#ff2bd6', w: 3}, bg: null}},
    {name: 'Контур', s: {font: 'Unbounded', weight: 900, size: .08, color: 'rgba(0,0,0,0)', stroke: {color: '#ffffff', w: 5}, shadow: null, bg: null}},
    {name: 'Плашка', s: {font: 'Golos Text', weight: 700, size: .05, color: '#111111', bg: {color: '#ffd60a', r: 30}, shadow: null, stroke: null}},
    {name: 'Ретро', s: {font: 'Lobster', weight: 400, size: .1, color: '#ffcf4a', stroke: {color: '#7a2b00', w: 10}, shadow: {color: 'rgba(0,0,0,.4)', blur: 0, y: 8}, bg: null}},
    {name: 'Рукописный', s: {font: 'Caveat', weight: 700, size: .085, color: '#ffffff', shadow: {color: 'rgba(0,0,0,.35)', blur: 10, y: 2}, stroke: null, bg: null}},
    {name: 'Элегантный', s: {font: 'Playfair Display', weight: 400, italic: true, size: .075, color: '#ffffff', shadow: null, stroke: null, bg: null}},
    {name: 'Скидка', s: {font: 'Russo One', weight: 400, size: .1, color: '#ffffff', bg: {color: '#ff375f', r: 12}, shadow: null, stroke: null}},
    {name: 'Пиксели', s: {font: 'Press Start 2P', weight: 400, size: .045, color: '#30d158', shadow: {color: '#000000', blur: 0, y: 4}, stroke: null, bg: null}},
  ];
  L.TEXT_STYLES = TEXT_STYLES;

  L.HOOKS.state.push(st => { st.layers = []; });
  const layers = () => { if (!L.S.layers) L.S.layers = []; return L.S.layers; };
  const uid = () => Math.random().toString(36).slice(2, 9);
  let sel = null, drag = null, guides = null;
  const byId = id => layers().find(l => l.id === id);
  L.addAsset = (canvas) => { const id = 'a' + uid(); L.assets.set(id, canvas); return id; };

  /* ---------- drawing ---------- */
  const fontStr = (ly, fs) => ly.emoji ? `${fs}px ${EMOJI_FONT}` : `${ly.italic ? 'italic ' : ''}${ly.weight || 700} ${fs}px "${ly.font}", "Inter", sans-serif`;
  function textBox(ctx, ly, W) {
    const fs = ly.size * W;
    ctx.font = fontStr(ly, fs);
    try { ctx.letterSpacing = ((ly.ls || 0) * fs / 100) + 'px'; } catch (e) {}
    const lines = String(ly.text || ' ').split('\n'), lh = fs * (ly.lh || 1.15);
    let w = 0; lines.forEach(t => { w = Math.max(w, ctx.measureText(t).width); });
    const pad = ly.bg ? fs * .38 : 0;
    return {fs, lines, lh, tw: w, th: lh * lines.length, pad, w: w + pad * 2, h: lh * lines.length + pad * 1.3};
  }
  const meas = mk(4, 4).getContext('2d');
  function bounds(ly, W, H) {
    if (ly.type === 'text') { const b = textBox(meas, ly, W); return {w: b.w, h: b.h}; }
    if (ly.type === 'image') { const a = L.assets.get(ly.asset); const w = ly.w * W; return {w, h: a ? w * a.height / a.width : w}; }
    return {w: ly.w * W, h: ly.h * H};
  }
  function shapePath(ctx, kind, w, h, radius) {
    ctx.beginPath();
    const x = -w / 2, y = -h / 2;
    switch (kind) {
      case 'rect': ctx.rect(x, y, w, h); break;
      case 'round': ctx.roundRect(Math.min(x, -x), Math.min(y, -y), Math.abs(w), Math.abs(h), Math.min(Math.abs(w), Math.abs(h)) * Math.max(0, radius ?? 18) / 100); break;
      case 'ellipse': ctx.ellipse(0, 0, Math.abs(w / 2), Math.abs(h / 2), 0, 0, Math.PI * 2); break;
      case 'triangle': ctx.moveTo(0, y); ctx.lineTo(w / 2, h / 2); ctx.lineTo(x, h / 2); ctx.closePath(); break;
      case 'star': for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .42 : 1; ctx.lineTo(Math.cos(a) * w / 2 * r, Math.sin(a) * h / 2 * r); } ctx.closePath(); break;
      case 'heart': ctx.moveTo(0, h * .32);
        ctx.bezierCurveTo(-w * .55, -h * .05, -w * .38, -h * .55, 0, -h * .22);
        ctx.bezierCurveTo(w * .38, -h * .55, w * .55, -h * .05, 0, h * .32); ctx.closePath(); break;
      case 'badge': ctx.moveTo(x + h * .35, y); ctx.lineTo(w / 2, y); ctx.lineTo(w / 2, h / 2); ctx.lineTo(x + h * .35, h / 2); ctx.lineTo(x, 0); ctx.closePath(); break;
      case 'line': case 'arrow': ctx.moveTo(x, 0); ctx.lineTo(w / 2, 0);
        if (kind === 'arrow') { const hl = Math.max(10, h * 1.2); ctx.moveTo(w / 2 - hl, -hl * .6); ctx.lineTo(w / 2, 0); ctx.lineTo(w / 2 - hl, hl * .6); }
        break;
    }
  }
  // canvas text only uses a web font once it is loaded: load on first use, then redraw
  const fontWait = new Set();
  function ensureFont(ly) {
    if (ly.type !== 'text' || ly.emoji) return;
    const spec = fontStr(ly, 40);
    if (document.fonts.check(spec) || fontWait.has(spec)) return;
    fontWait.add(spec);
    document.fonts.load(spec).then(() => { fontWait.delete(spec); L.schedule(); }).catch(() => fontWait.delete(spec));
  }
  L.loadLayerFonts = () => Promise.all(layers().filter(l => l.type === 'text' && !l.emoji).map(l => document.fonts.load(fontStr(l, 40)).catch(() => {})));
  function drawLayer(ctx, ly, W, H) {
    if (ly.visible === false || !(W > 1 && H > 1)) return;
    ensureFont(ly);
    ctx.save();
    // a failing layer must never leave the canvas half-configured (clip, alpha, blend)
    try { paintLayer(ctx, ly, W, H); } catch (e) { console.warn('layer skipped', e); } finally { ctx.restore(); }
  }
  function paintLayer(ctx, ly, W, H) {
    ctx.globalAlpha = (ly.opacity ?? 100) / 100;
    ctx.globalCompositeOperation = ly.blend || 'source-over';
    ctx.translate(ly.x * W, ly.y * H); ctx.rotate((ly.rot || 0) * Math.PI / 180);
    if (ly.type === 'text') {
      const b = textBox(ctx, ly, W);
      if (ly.bg) { ctx.fillStyle = ly.bg.color; ctx.beginPath(); ctx.roundRect(-b.w / 2, -b.h / 2, b.w, b.h, Math.max(0, Math.min(b.fs * (ly.bg.r || 0) / 100, Math.min(b.w, b.h) / 2))); ctx.fill(); }
      ctx.textBaseline = 'middle'; ctx.textAlign = ly.align || 'center';
      const ax = ly.align === 'left' ? -b.tw / 2 : ly.align === 'right' ? b.tw / 2 : 0;
      b.lines.forEach((t, i) => {
        const y = -b.th / 2 + b.lh * (i + .5);
        if (ly.shadow) { ctx.shadowColor = ly.shadow.color; ctx.shadowBlur = ly.shadow.blur * b.fs / 100; ctx.shadowOffsetY = ly.shadow.y * b.fs / 100; }
        if (ly.stroke && ly.stroke.w > 0) { ctx.lineJoin = 'round'; ctx.lineWidth = ly.stroke.w * b.fs / 100; ctx.strokeStyle = ly.stroke.color; ctx.strokeText(t, ax, y); }
        ctx.fillStyle = ly.color; ctx.fillText(t, ax, y);
        ctx.shadowColor = 'transparent';
      });
    } else if (ly.type === 'image') {
      const a = L.assets.get(ly.asset);
      if (a) {
        const w = ly.w * W, h = w * a.height / a.width;
        if (ly.flip) ctx.scale(-1, 1);
        if (ly.shadow) { ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = w * .05; ctx.shadowOffsetY = w * .02; }
        if (ly.round) { ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, Math.max(0, Math.min(w, h) * ly.round / 100)); ctx.clip(); }
        ctx.drawImage(a, -w / 2, -h / 2, w, h);
      }
    } else if (ly.type === 'shape') {
      const w = ly.w * W, h = ly.h * H, line = ly.shape === 'line' || ly.shape === 'arrow';
      shapePath(ctx, ly.shape, w, line ? Math.max(4, (ly.sw || 4) * W / 400) : h, ly.radius);
      if (ly.fill && !line) { ctx.fillStyle = ly.fill; ctx.fill(); }
      if (ly.strokeC && (ly.sw || line)) { ctx.lineWidth = Math.max(1, (ly.sw || 4) * W / 400); ctx.strokeStyle = ly.strokeC; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); }
    }
  }
  L.drawLayer = drawLayer;
  L.HOOKS.overlay.push((ctx, W, H) => layers().forEach(ly => drawLayer(ctx, ly, W, H)));

  /* ---------- selection frame on the canvas ---------- */
  function frame(ly, r) {
    const b = bounds(ly, r.w, r.h), cx = r.x + ly.x * r.w, cy = r.y + ly.y * r.h, a = (ly.rot || 0) * Math.PI / 180;
    const ca = Math.cos(a), sa = Math.sin(a);
    const pt = (lx, ly2) => [cx + lx * ca - ly2 * sa, cy + lx * sa + ly2 * ca];
    return {cx, cy, w: b.w, h: Math.max(b.h, 8), a, pt};
  }
  L.HOOKS.afterDraw.push((ctx, r) => {
    if (L.mode !== 'layers') return;
    if (guides) {
      ctx.save(); ctx.strokeStyle = '#ff2bd6'; ctx.lineWidth = 1; ctx.setLineDash([4, 3]); ctx.beginPath();
      if (guides.v) { ctx.moveTo(r.x + r.w / 2, r.y); ctx.lineTo(r.x + r.w / 2, r.y + r.h); }
      if (guides.h) { ctx.moveTo(r.x, r.y + r.h / 2); ctx.lineTo(r.x + r.w, r.y + r.h / 2); }
      ctx.stroke(); ctx.restore();
    }
    const ly = byId(sel); if (!ly) return;
    const f = frame(ly, r), hw = f.w / 2 + 6, hh = f.h / 2 + 6;
    const c = [f.pt(-hw, -hh), f.pt(hw, -hh), f.pt(hw, hh), f.pt(-hw, hh)];
    ctx.save();
    ctx.strokeStyle = '#0a84ff'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
    ctx.beginPath(); c.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.stroke();
    ctx.setLineDash([]);
    const top = f.pt(0, -hh), knob = f.pt(0, -hh - 26);
    ctx.beginPath(); ctx.moveTo(top[0], top[1]); ctx.lineTo(knob[0], knob[1]); ctx.stroke();
    ctx.fillStyle = '#fff';
    c.forEach(p => { ctx.fillRect(p[0] - 5, p[1] - 5, 10, 10); ctx.strokeRect(p[0] - 5, p[1] - 5, 10, 10); });
    ctx.beginPath(); ctx.arc(knob[0], knob[1], 6, 0, 7); ctx.fill(); ctx.stroke();
    ctx.restore();
  });

  function hitLayer(p, r) {
    const ls = layers();
    for (let i = ls.length - 1; i >= 0; i--) {
      const ly = ls[i]; if (ly.visible === false || ly.locked) continue;
      const f = frame(ly, r), dx = p.x - f.cx, dy = p.y - f.cy;
      const lx = dx * Math.cos(-f.a) - dy * Math.sin(-f.a), lyy = dx * Math.sin(-f.a) + dy * Math.cos(-f.a);
      if (Math.abs(lx) <= f.w / 2 + 6 && Math.abs(lyy) <= f.h / 2 + 6) return ly;
    }
    return null;
  }
  function hitHandle(p, r) {
    const ly = byId(sel); if (!ly) return null;
    const f = frame(ly, r), hw = f.w / 2 + 6, hh = f.h / 2 + 6;
    const k = f.pt(0, -hh - 26);
    if (Math.hypot(p.x - k[0], p.y - k[1]) < 12) return 'rot';
    for (const [x, y] of [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]]) { const q = f.pt(x, y); if (Math.hypot(p.x - q[0], p.y - q[1]) < 11) return 'scale'; }
    return null;
  }
  L.HOOKS.pointer.layers = {
    down(p, e) {
      const r = L.outRect();
      const h = hitHandle(p, r);
      let ly = h ? byId(sel) : hitLayer(p, r);
      if (!ly) { sel = null; renderPanel(); L.schedule(); return; }
      if (ly.id !== sel) { sel = ly.id; renderPanel(); }
      const f = frame(ly, r);
      drag = {kind: h || 'move', ly, start: JSON.parse(JSON.stringify(ly)), p0: p, c: [f.cx, f.cy], shift: e.shiftKey};
      if (e.altKey && !h) { // Alt+drag duplicates, as in Photoshop
        const copy = JSON.parse(JSON.stringify(ly)); copy.id = uid(); copy.name = ly.name + ' копия';
        layers().push(copy); sel = copy.id; drag.ly = copy; renderPanel();
      }
      L.schedule();
    },
    move(p, e, pressed) {
      const view = L.view;
      if (!drag) { const r = L.outRect(); view.style.cursor = hitHandle(p, r) ? 'nwse-resize' : hitLayer(p, r) ? 'move' : 'default'; return; }
      const r = L.outRect(), ly = drag.ly, s = drag.start;
      if (drag.kind === 'move') {
        let nx = s.x + (p.x - drag.p0.x) / r.w, ny = s.y + (p.y - drag.p0.y) / r.h;
        guides = {v: Math.abs((nx - .5) * r.w) < 6, h: Math.abs((ny - .5) * r.h) < 6};
        if (guides.v) nx = .5; if (guides.h) ny = .5;
        ly.x = nx; ly.y = ny;
      } else if (drag.kind === 'scale') {
        const d0 = Math.hypot(drag.p0.x - drag.c[0], drag.p0.y - drag.c[1]) || 1, d1 = Math.hypot(p.x - drag.c[0], p.y - drag.c[1]);
        const k = clamp(d1 / d0, .05, 20);
        if (ly.type === 'text') ly.size = clamp(s.size * k, .005, 1);
        else { ly.w = clamp(s.w * k, .01, 5); if (ly.type === 'shape') ly.h = clamp(s.h * k, .005, 5); }
      } else if (drag.kind === 'rot') {
        const a0 = Math.atan2(drag.p0.y - drag.c[1], drag.p0.x - drag.c[0]), a1 = Math.atan2(p.y - drag.c[1], p.x - drag.c[0]);
        let deg = (s.rot || 0) + (a1 - a0) * 180 / Math.PI;
        deg = ((deg + 180) % 360 + 360) % 360 - 180;
        for (const snap of [-180, -90, 0, 90, 180]) if (Math.abs(deg - snap) < 4) deg = snap;
        ly.rot = Math.round(deg);
      }
      L.schedule(); syncProps();
    },
    up() {
      if (!drag) return;
      const changed = JSON.stringify(drag.start) !== JSON.stringify(drag.ly) || !byId(drag.start.id) || drag.ly.id !== drag.start.id;
      const label = {move: 'Перемещение', scale: 'Масштаб', rot: 'Поворот'}[drag.kind];
      drag = null; guides = null;
      if (changed) L.push(`Слой: ${label}`);
      L.schedule(); renderPanel();
    },
  };
  L.HOOKS.keydown.push(e => {
    if (e.code === 'KeyV' && !e.ctrlKey && !e.metaKey && !e.altKey) { L.setMode('layers'); return true; }
    if (L.mode !== 'layers') return false;
    const ly = byId(sel); if (!ly) return false;
    if (e.key === 'Delete' || e.key === 'Backspace') { removeLayer(ly.id); return true; }
    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyJ') { e.preventDefault(); duplicate(ly.id); return true; }
    const step = e.shiftKey ? 10 : 1, r = L.outRect();
    const mv = {ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]}[e.key];
    if (mv) { e.preventDefault(); ly.x += mv[0] * step / r.w; ly.y += mv[1] * step / r.h; L.schedule(); clearTimeout(nudgeT); nudgeT = setTimeout(() => L.push('Слой: сдвиг'), 500); return true; }
    if (e.key === 'Escape') { sel = null; renderPanel(); L.schedule(); return true; }
    return false;
  });
  let nudgeT = 0;
  L.view.addEventListener('dblclick', () => { if (L.mode === 'layers') { const t = $('#lyText'); if (t) { t.focus(); t.select(); } } });

  /* ---------- actions ---------- */
  function addLayer(ly, label) {
    ly.id = uid(); ly.visible = true; ly.opacity = ly.opacity ?? 100; ly.blend = ly.blend || 'source-over'; ly.rot = ly.rot || 0;
    layers().push(ly); sel = ly.id;
    if (L.mode !== 'layers') L.setMode('layers');
    L.push(label); renderPanel(); L.schedule();
    return ly;
  }
  L.addTextLayer = (text, style, at) => {
    const st = style || TEXT_STYLES[0].s;
    const brand = window.LumenBrand && window.LumenBrand.get();
    const tt = s => window.LumenI18n ? window.LumenI18n.t(s) : s;
    text = tt(text || 'Ваш текст');
    const ly = Object.assign({type: 'text', name: 'Текст', text, x: at ? at[0] : .5, y: at ? at[1] : .5,
      align: 'center', ls: 0, lh: 1.15, italic: false}, JSON.parse(JSON.stringify(st)));
    if (!style && brand && brand.heading) ly.font = brand.heading;
    ly.name = (text || 'Текст').slice(0, 24);
    return addLayer(ly, 'Добавлен текст');
  };
  L.addImageLayer = (canvas, name, w) => {
    if (window.LumenI18n && name) name = window.LumenI18n.t(name);
    const id = L.addAsset(canvas);
    return addLayer({type: 'image', name: name || 'Изображение', asset: id, x: .5, y: .5, w: w || .45}, 'Добавлено изображение');
  };
  function addShape(kind) {
    const line = kind === 'line' || kind === 'arrow';
    const r = L.outRect(), sq = r.w / r.h;
    addLayer({type: 'shape', name: SHAPES.find(s => s[0] === kind)[1], shape: kind, x: .5, y: .5, w: .3, h: line ? .02 : .3 * sq,
      fill: line ? null : L.markColor, strokeC: line ? L.markColor : null, sw: line ? 8 : 0, radius: 18}, 'Добавлена фигура');
  }
  function removeLayer(id) {
    const ls = layers(), i = ls.findIndex(l => l.id === id); if (i < 0) return;
    ls.splice(i, 1); sel = null; L.push('Слой удален'); renderPanel(); L.schedule();
  }
  function duplicate(id) {
    const ly = byId(id); if (!ly) return;
    const c = JSON.parse(JSON.stringify(ly)); c.id = uid(); c.name = ly.name + ' копия'; c.x += .03; c.y += .03;
    layers().splice(layers().indexOf(ly) + 1, 0, c); sel = c.id; L.push('Слой продублирован'); renderPanel(); L.schedule();
  }
  function move(id, dir) {
    const ls = layers(), i = ls.findIndex(l => l.id === id), j = i + dir;
    if (i < 0 || j < 0 || j >= ls.length) return;
    [ls[i], ls[j]] = [ls[j], ls[i]]; L.push(dir > 0 ? 'Слой выше' : 'Слой ниже'); renderPanel(); L.schedule();
  }
  // makes near-white (or near-black) backgrounds of logos transparent
  function knockOut(canvas, white) {
    const c = mk(canvas.width, canvas.height), x = c.getContext('2d', {willReadFrequently: true});
    x.drawImage(canvas, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height), p = d.data;
    for (let k = 0; k < p.length; k += 4) {
      const v = white ? Math.min(p[k], p[k + 1], p[k + 2]) : 255 - Math.max(p[k], p[k + 1], p[k + 2]);
      const a = clamp((250 - v) / 30, 0, 1);
      p[k + 3] = Math.round(p[k + 3] * a);
    }
    x.putImageData(d, 0, 0); return c;
  }
  async function fileToCanvas(file) {
    const src = await L.decodeFile(file);
    const w = src.naturalWidth || src.width, h = src.naturalHeight || src.height, s = Math.min(1, 2400 / Math.max(w, h));
    const c = mk(Math.round(w * s), Math.round(h * s)); c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
    return c;
  }
  L.fileToCanvas = fileToCanvas;

  /* ---------- panel ---------- */
  const pane = document.createElement('div');
  pane.className = 'pane'; pane.dataset.pane = 'layers'; pane.hidden = true;
  pane.innerHTML = `
    <div class="row">
      <button class="tool" id="lyAddText"><svg ${L.SVGA}><path d="M5 6V4.5h14V6M12 4.5v15M9 19.5h6"/></svg>Текст</button>
      <button class="tool" id="lyAddImage"><svg ${L.SVGA}><rect x="3" y="5" width="18" height="14" rx="2.5"/><circle cx="8.5" cy="10" r="1.6"/><path d="m21 16-5-5-8 8"/></svg>Фото или логотип</button>
      <button class="tool" id="lyAddShape"><svg ${L.SVGA}><rect x="3.5" y="10" width="9" height="9" rx="1"/><circle cx="15.5" cy="8.5" r="5"/></svg>Фигура</button>
      <button class="tool" id="lyAddSticker" data-pro="stickers"><span style="font-size:17px;line-height:1">😍</span>Стикер</button>
    </div>
    <input type="file" id="lyFile" accept="image/*,.heic,.heif" hidden>
    <div class="pills" id="lyShapes" hidden></div>
    <div class="stickers" id="lyStickers" hidden></div>
    <div class="rhead"><b>Стили текста</b></div>
    <div class="styles" id="lyStyles"></div>
    <div class="rhead"><b>Слои</b><span class="meta" id="lyCount"></span></div>
    <div class="lylist" id="lyList"></div>
    <div class="lyprops" id="lyProps"></div>
    <div id="brandSlot"></div>
    <p class="note">V — инструмент «Перемещение». Тяните слой, углы меняют размер, кружок сверху поворачивает. Alt + перетаскивание создает копию, Ctrl+J дублирует, Delete удаляет.</p>`;
  document.querySelector('.panel .sec:not(.histo):not(.history)').appendChild(pane);
  const railBtn = document.createElement('button');
  railBtn.className = 'mode'; railBtn.dataset.mode = 'layers'; railBtn.setAttribute('aria-pressed', 'false'); railBtn.title = 'Слои, текст и шрифты (V)';
  railBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="m12 3 9 5-9 5-9-5z"/><path d="m3 12.5 9 5 9-5"/><path d="m3 16.5 9 5 9-5" opacity=".55"/></svg>Слои`;
  document.querySelector('.mode[data-mode="markup"]').before(railBtn);

  $('#lyStyles').innerHTML = TEXT_STYLES.map((t, i) => `<button class="tstyle" data-i="${i}" style="font-family:'${t.s.font}';font-weight:${t.s.weight};${t.s.italic ? 'font-style:italic;' : ''}">${t.name}</button>`).join('');
  $('#lyShapes').innerHTML = SHAPES.map(s => `<button class="pill" data-k="${s[0]}">${s[1]}</button>`).join('');
  $('#lyStickers').innerHTML = STICKERS.map(s => `<button class="stk" data-s="${s}">${s}</button>`).join('');
  $('#lyAddText').onclick = () => L.img && L.addTextLayer('Ваш текст');
  $('#lyAddImage').onclick = () => $('#lyFile').click();
  $('#lyFile').onchange = async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    try { L.addImageLayer(await fileToCanvas(f), f.name.replace(/\.[^.]+$/, '')); } catch (err) { L.toast('Не получилось открыть этот файл'); }
  };
  $('#lyAddShape').onclick = () => { $('#lyShapes').hidden = !$('#lyShapes').hidden; $('#lyStickers').hidden = true; };
  $('#lyShapes').addEventListener('click', e => { const b = e.target.closest('.pill'); if (b && L.img) { addShape(b.dataset.k); $('#lyShapes').hidden = true; } });
  $('#lyAddSticker').onclick = () => { if (!L.requirePro('stickers')) return; $('#lyStickers').hidden = !$('#lyStickers').hidden; $('#lyShapes').hidden = true; };
  $('#lyStickers').addEventListener('click', e => {
    const b = e.target.closest('.stk'); if (!b || !L.img) return;
    addLayer({type: 'text', name: 'Стикер ' + b.dataset.s, text: b.dataset.s, emoji: true, size: .14, color: '#000', x: .5, y: .5, align: 'center'}, 'Добавлен стикер');
    $('#lyStickers').hidden = true;
  });
  $('#lyStyles').addEventListener('click', e => {
    const b = e.target.closest('.tstyle'); if (!b || !L.img) return;
    const st = TEXT_STYLES[+b.dataset.i];
    if (!L.isFreeFont(st.s.font) && !L.requirePro('premiumFonts', 'Шрифт ' + st.s.font)) return;
    const ly = byId(sel);
    if (ly && ly.type === 'text' && !ly.emoji) { Object.assign(ly, JSON.parse(JSON.stringify(st.s))); L.push('Стиль текста: ' + st.name); renderPanel(); L.schedule(); }
    else L.addTextLayer(st.name, st.s);
  });

  const ICON = {text: 'T', image: '▣', shape: '◆'};
  function renderList() {
    const ls = layers();
    $('#lyCount').textContent = ls.length ? `${ls.length}` : '';
    $('#lyList').innerHTML = ls.length ? ls.slice().reverse().map(ly => `
      <div class="lyrow${ly.id === sel ? ' sel' : ''}" data-id="${ly.id}">
        <button class="lyeye" data-act="eye" title="Показать или скрыть" aria-label="Видимость">${ly.visible === false ? '◌' : '●'}</button>
        <span class="lyico">${ly.emoji ? ly.text : ICON[ly.type]}</span>
        <span class="lyname"></span>
        <button class="lybtn" data-act="up" title="Выше">↑</button><button class="lybtn" data-act="down" title="Ниже">↓</button>
        <button class="lybtn" data-act="dup" title="Дублировать (Ctrl+J)">⧉</button><button class="lybtn" data-act="del" title="Удалить (Delete)">✕</button>
      </div>`).join('') : '<p class="note">Слоев пока нет. Добавьте текст, логотип, фигуру или стикер.</p>';
    $('#lyList').querySelectorAll('.lyrow').forEach(row => { row.querySelector('.lyname').textContent = byId(row.dataset.id).name; });
  }
  $('#lyList').addEventListener('click', e => {
    const row = e.target.closest('.lyrow'); if (!row) return;
    const id = row.dataset.id, act = e.target.closest('[data-act]') && e.target.closest('[data-act]').dataset.act;
    if (act === 'eye') { const ly = byId(id); ly.visible = ly.visible === false; L.push(ly.visible ? 'Слой показан' : 'Слой скрыт'); }
    else if (act === 'up') return move(id, 1);
    else if (act === 'down') return move(id, -1);
    else if (act === 'dup') return duplicate(id);
    else if (act === 'del') return removeLayer(id);
    else sel = id;
    renderPanel(); L.schedule();
  });

  // property editors -------------------------------------------------------
  const swatchRow = (key, val) => {
    const brand = (window.LumenBrand && window.LumenBrand.get().colors) || [];
    const cols = [...new Set([...brand, ...L.COLORS, '#ff9f0a', '#bf5af2', '#64d2ff', '#ff375f'])];
    return `<div class="swatches small" data-key="${key}">${cols.map(c => `<button class="sw" data-c="${c}" style="background:${c}" aria-pressed="${c === val}" aria-label="Цвет ${c}"></button>`).join('')}<label class="sw custom" title="Свой цвет"><input type="color" data-key="${key}" value="${/^#[0-9a-f]{6}$/i.test(val) ? val : '#ffffff'}"></label></div>`;
  };
  const range = (key, label, min, max, val, step = 1) => `<div class="rhead"><b>${label}</b><output>${val}</output></div><input type="range" data-key="${key}" min="${min}" max="${max}" step="${step}" value="${val}">`;
  function renderProps() {
    const ly = byId(sel), el = $('#lyProps');
    if (!ly) { el.innerHTML = ''; return; }
    let h = `<div class="rhead"><b>Слой: ${ly.type === 'text' ? 'текст' : ly.type === 'image' ? 'изображение' : 'фигура'}</b></div>`;
    if (ly.type === 'text' && !ly.emoji) {
      h += `<textarea id="lyText" class="txt-in area" rows="2"></textarea>`;
      h += `<div class="rhead"><b>Шрифт</b><span class="meta">${ly.font}</span></div><div class="fontlist" id="lyFonts">${FONTS.map(f => `<button class="fnt${f === ly.font ? ' sel' : ''}${L.isFreeFont(f) || L.isPro() ? '' : ' pro'}" data-f="${f}" style="font-family:'${f}'">${f}</button>`).join('')}</div>`;
      h += range('size', 'Размер', 1, 40, Math.round(ly.size * 200) / 2, .5);
      h += `<div class="rhead"><b>Цвет</b></div>` + swatchRow('color', ly.color);
      h += `<div class="seg" id="lyAlign">${[['left', 'Слева'], ['center', 'По центру'], ['right', 'Справа']].map(a => `<button data-a="${a[0]}" aria-pressed="${(ly.align || 'center') === a[0]}">${a[1]}</button>`).join('')}</div>`;
      h += `<div class="row"><button class="pill" data-tog="bold" aria-pressed="${(ly.weight || 700) >= 700}">Жирный</button><button class="pill" data-tog="italic" aria-pressed="${!!ly.italic}">Курсив</button><button class="pill" data-tog="caps" aria-pressed="${ly.text === ly.text.toUpperCase()}">ПРОПИСНЫЕ</button></div>`;
      h += range('ls', 'Межбуквенный интервал', -10, 60, ly.ls || 0);
      h += range('lh', 'Межстрочный интервал', 80, 200, Math.round((ly.lh || 1.15) * 100));
      h += `<div class="rhead"><b>Эффекты</b></div><div class="row"><button class="pill" data-tog="stroke" aria-pressed="${!!ly.stroke}">Обводка</button><button class="pill" data-tog="shadow" aria-pressed="${!!ly.shadow}">Тень</button><button class="pill" data-tog="bg" aria-pressed="${!!ly.bg}">Плашка</button></div>`;
      if (ly.stroke) h += range('strokeW', 'Толщина обводки', 1, 30, ly.stroke.w) + swatchRow('strokeC', ly.stroke.color);
      if (ly.shadow) h += range('shadowB', 'Размытие тени', 0, 80, ly.shadow.blur) + range('shadowY', 'Смещение тени', -20, 20, ly.shadow.y);
      if (ly.bg) h += range('bgR', 'Скругление плашки', 0, 60, ly.bg.r) + swatchRow('bgC', ly.bg.color);
    }
    if (ly.type === 'text' && ly.emoji) h += range('size', 'Размер', 2, 60, Math.round(ly.size * 200) / 2, .5);
    if (ly.type === 'shape') {
      h += `<div class="rhead"><b>Заливка</b></div>` + swatchRow('fill', ly.fill || '');
      h += range('sw', 'Обводка', 0, 40, ly.sw || 0) + swatchRow('strokeC', ly.strokeC || '');
      if (ly.shape === 'round') h += range('radius', 'Скругление', 0, 50, ly.radius ?? 18);
      h += `<div class="row"><button class="pill" data-act2="nofill">Без заливки</button></div>`;
    }
    if (ly.type === 'image') {
      h += range('round', 'Скругление углов', 0, 50, ly.round || 0);
      h += `<div class="row"><button class="pill" data-tog="flip" aria-pressed="${!!ly.flip}">Отразить</button><button class="pill" data-tog="ishadow" aria-pressed="${!!ly.shadow}">Тень</button></div>`;
      h += `<div class="row"><button class="tool" data-act2="aibg">Убрать фон (ИИ)</button><button class="tool" data-act2="white">Убрать белый фон</button><button class="tool" data-act2="black">Убрать черный фон</button></div>`;
    }
    h += range('opacity', 'Непрозрачность', 0, 100, ly.opacity ?? 100);
    h += range('rot', 'Поворот', -180, 180, ly.rot || 0);
    h += `<div class="rhead"><b>Режим наложения</b></div><select class="txt-in" data-key="blend">${BLENDS.map(b => `<option value="${b[0]}"${b[0] === (ly.blend || 'source-over') ? ' selected' : ''}>${b[1]}</option>`).join('')}</select>`;
    h += `<div class="row"><button class="pill" data-act2="center">По центру</button><button class="pill" data-act2="front">На передний план</button><button class="pill" data-act2="back">На задний план</button></div>`;
    el.innerHTML = h;
    const ta = $('#lyText'); if (ta) ta.value = ly.text;
  }
  function syncProps() {
    const ly = byId(sel); if (!ly) return;
    const set = (k, v) => { const i = $(`#lyProps input[data-key="${k}"]`); if (i && document.activeElement !== i) { i.value = v; i.previousElementSibling.querySelector('output').textContent = v; } };
    if (ly.type === 'text') set('size', Math.round(ly.size * 200) / 2); else if (ly.type !== 'text') {}
    set('rot', ly.rot || 0);
  }
  const SETTERS = {
    size: (ly, v) => { ly.size = v / 100; }, ls: (ly, v) => { ly.ls = v; }, lh: (ly, v) => { ly.lh = v / 100; },
    strokeW: (ly, v) => { ly.stroke.w = v; }, shadowB: (ly, v) => { ly.shadow.blur = v; }, shadowY: (ly, v) => { ly.shadow.y = v; },
    bgR: (ly, v) => { ly.bg.r = v; }, sw: (ly, v) => { ly.sw = v; if (v && !ly.strokeC) ly.strokeC = '#ffffff'; }, radius: (ly, v) => { ly.radius = v; },
    round: (ly, v) => { ly.round = v; }, opacity: (ly, v) => { ly.opacity = v; }, rot: (ly, v) => { ly.rot = v; },
  };
  const COLOR_SET = {color: (ly, c) => { ly.color = c; }, strokeC: (ly, c) => { if (ly.type === 'text') { ly.stroke = ly.stroke || {w: 4}; ly.stroke.color = c; } else { ly.strokeC = c; if (!ly.sw) ly.sw = 6; } },
    bgC: (ly, c) => { ly.bg.color = c; }, fill: (ly, c) => { ly.fill = c; }};
  const props = $('#lyProps');
  props.addEventListener('input', e => {
    const ly = byId(sel); if (!ly) return;
    const t = e.target, k = t.dataset.key;
    if (t.id === 'lyText') { ly.text = t.value || ' '; ly.name = (t.value || 'Текст').split('\n')[0].slice(0, 24); renderList(); L.schedule(); return; }
    if (t.type === 'range' && SETTERS[k]) { SETTERS[k](ly, +t.value); t.previousElementSibling.querySelector('output').textContent = t.value; L.schedule(); }
    if (t.type === 'color' && COLOR_SET[k]) { COLOR_SET[k](ly, t.value); L.schedule(); }
  });
  props.addEventListener('change', e => {
    const ly = byId(sel); if (!ly) return;
    const t = e.target, k = t.dataset.key;
    if (t.id === 'lyText') return L.push('Текст изменен');
    if (k === 'blend') { ly.blend = t.value; L.push('Режим наложения: ' + t.selectedOptions[0].textContent); L.schedule(); return; }
    if (t.type === 'range' || t.type === 'color') L.push('Слой: ' + (t.closest('label') ? 'цвет' : (t.previousElementSibling && t.previousElementSibling.querySelector('b') ? t.previousElementSibling.querySelector('b').textContent.toLowerCase() : 'свойство')));
  });
  props.addEventListener('click', async e => {
    const ly = byId(sel); if (!ly) return;
    const sw = e.target.closest('.sw[data-c]');
    if (sw) { const k = sw.closest('[data-key]').dataset.key; COLOR_SET[k](ly, sw.dataset.c); L.push('Слой: цвет'); renderProps(); L.schedule(); return; }
    const fb = e.target.closest('.fnt');
    if (fb) {
      if (!L.isFreeFont(fb.dataset.f) && !L.requirePro('premiumFonts', 'Шрифт ' + fb.dataset.f)) return;
      ly.font = fb.dataset.f; await document.fonts.load(`700 40px "${ly.font}"`).catch(() => {});
      L.push('Шрифт: ' + ly.font); renderProps(); L.schedule(); return;
    }
    const al = e.target.closest('#lyAlign button');
    if (al) { ly.align = al.dataset.a; L.push('Выравнивание текста'); renderProps(); L.schedule(); return; }
    const tg = e.target.closest('[data-tog]');
    if (tg) {
      const k = tg.dataset.tog;
      if (k === 'bold') ly.weight = (ly.weight || 700) >= 700 ? 400 : 800;
      if (k === 'italic') ly.italic = !ly.italic;
      if (k === 'caps') ly.text = ly.text === ly.text.toUpperCase() ? ly.text.charAt(0) + ly.text.slice(1).toLowerCase() : ly.text.toUpperCase();
      if (k === 'stroke') ly.stroke = ly.stroke ? null : {color: '#000000', w: 6};
      if (k === 'shadow') ly.shadow = ly.shadow ? null : {color: 'rgba(0,0,0,.5)', blur: 16, y: 4};
      if (k === 'bg') ly.bg = ly.bg ? null : {color: '#ffd60a', r: 24};
      if (k === 'flip') ly.flip = !ly.flip;
      if (k === 'ishadow') ly.shadow = !ly.shadow;
      L.push('Слой: ' + tg.textContent.toLowerCase()); renderProps(); L.schedule(); return;
    }
    const a2 = e.target.closest('[data-act2]');
    if (!a2) return;
    const act = a2.dataset.act2, ls = layers(), i = ls.indexOf(ly);
    if (act === 'center') { ly.x = .5; ly.y = .5; L.push('Слой по центру'); }
    if (act === 'front') { ls.splice(i, 1); ls.push(ly); L.push('На передний план'); }
    if (act === 'back') { ls.splice(i, 1); ls.unshift(ly); L.push('На задний план'); }
    if (act === 'nofill') { ly.fill = null; if (!ly.sw) { ly.sw = 6; ly.strokeC = ly.strokeC || '#ffffff'; } L.push('Фигура без заливки'); }
    if (act === 'white' || act === 'black') { ly.asset = L.addAsset(knockOut(L.assets.get(ly.asset), act === 'white')); L.push(act === 'white' ? 'Убран белый фон' : 'Убран черный фон'); }
    if (act === 'aibg') {
      if (!L.ai) { L.toast('Модуль ИИ еще загружается, попробуйте через пару секунд'); return; }
      if (!L.requirePro('select', 'Удаление фона ИИ')) return;
      L.toast('Ищу главный объект…');
      try { const c = await L.ai.cutoutMain(L.assets.get(ly.asset)); ly.asset = L.addAsset(c); L.push('Фон слоя удален (ИИ)'); }
      catch (err) { console.error(err); L.toast('Не получилось выделить объект'); }
    }
    renderPanel(); L.schedule();
  });

  function renderPanel() {
    if (sel && !byId(sel)) sel = null;
    renderList(); renderProps();
    if (window.LumenBrand) window.LumenBrand.render();
    if (L.refreshLocks) L.refreshLocks();
  }
  L.layersPanel = {render: renderPanel, select(id) { sel = id; renderPanel(); }};
  L.HOOKS.sync.push(renderPanel);
  L.HOOKS.mode.push(m => { if (m === 'layers') setTimeout(renderPanel); else { sel = null; guides = null; } });
  L.HOOKS.image.push(() => { sel = null; });
  // keep layers on the same spot of the photo when it is cropped, rotated or flipped
  L.HOOKS.remap.push(T => layers().forEach(ly => {
    [ly.x, ly.y] = T.pt(ly.x, ly.y);
    if (ly.type === 'text') ly.size *= T.sw;
    else { ly.w *= T.sw; if (ly.type === 'shape') ly.h *= T.sh; }
    if (T.kind === 'rot') ly.rot = (((ly.rot || 0) - 90 + 180) % 360 + 360) % 360 - 180;
    if (T.kind === 'flip') ly.rot = -(ly.rot || 0);
  }));
  document.addEventListener('lumen:plan', () => { if (L.mode === 'layers') renderPanel(); });
  Object.assign(L.commands, {newText: () => L.img && L.addTextLayer('Ваш текст')});
})();
