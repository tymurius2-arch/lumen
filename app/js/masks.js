// Local adjustments (Photoshop adjustment layer + mask / Lightroom masking):
// brush, linear gradient, radial gradient and AI object masks, each with its own corrections.
(function () {
  const L = window.Lumen, $ = L.$, clamp = L.clamp, mk = L.mk;
  const PARAMS = [
    {id: 'exposure', name: 'Экспозиция', ic: '<circle cx="12" cy="12" r="8.5"/><path d="M7.5 9.5h4M9.5 7.5v4M12.5 15.5h4"/><path d="M6 18 18 6"/>'},
    {id: 'contrast', name: 'Контраст', ic: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 0 0 17z" fill="currentColor"/>'},
    {id: 'saturation', name: 'Насыщенность', ic: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17M7.5 4.8v14.4M16.5 4.8v14.4"/>'},
    {id: 'warmth', name: 'Теплота', ic: '<path d="M10 14.3V5a2 2 0 0 1 4 0v9.3a4.2 4.2 0 1 1-4 0z"/><path d="M12 9.5v7"/>'},
    {id: 'tint', name: 'Оттенок', ic: '<path d="M12 3c3.2 4.3 6.2 7.4 6.2 11.2a6.2 6.2 0 0 1-12.4 0C5.8 10.4 8.8 7.3 12 3z"/>'},
    {id: 'blur', name: 'Размытие', ic: '<circle cx="12" cy="12" r="8" opacity=".3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="4"/>'},
    {id: 'bw', name: 'Обесцветить', ic: '<circle cx="12" cy="12" r="8.5"/><path d="M5 18 18 5"/>'},
  ];
  const KINDS = [['brush', 'Кисть'], ['linear', 'Градиент'], ['radial', 'Радиальный']];
  L.HOOKS.state.push(st => { st.masks = []; });
  const masks = () => { if (!L.S.masks) L.S.masks = []; return L.S.masks; };
  let sel = null, tool = 'linear', selParam = 'exposure', drag = null, showMask = false, brushSize = 60, erase = false;
  const byId = id => masks().find(m => m.id === id);
  const uid = () => Math.random().toString(36).slice(2, 9);

  /* ---------- rendering ---------- */
  const mC = document.createElement('canvas'), lC = document.createElement('canvas');
  function maskCanvas(m, W, H) {
    if (mC.width !== W || mC.height !== H) { mC.width = W; mC.height = H; }
    const x = mC.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, W, H);
    if (m.kind === 'linear') {
      const [a, b] = m.geo, g = x.createLinearGradient(a[0] * W, a[1] * H, b[0] * W, b[1] * H);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
    } else if (m.kind === 'radial') {
      const [cx, cy, rx, ry, fe] = m.geo;
      x.save(); x.translate(cx * W, cy * H); x.scale(1, (ry * H) / Math.max(1, rx * W));
      const R = rx * W, g = x.createRadialGradient(0, 0, R * (1 - fe), 0, 0, R);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.beginPath(); x.arc(0, 0, R, 0, 7); x.fill(); x.restore();
    } else if (m.kind === 'brush') {
      x.lineCap = 'round'; x.lineJoin = 'round';
      m.strokes.forEach(s => {
        x.globalCompositeOperation = s.erase ? 'destination-out' : 'source-over';
        x.filter = `blur(${Math.max(.5, s.size * W * .18).toFixed(1)}px)`;
        x.strokeStyle = x.fillStyle = '#fff'; x.lineWidth = s.size * W;
        L.strokePath(x, s.pts, W, H, s.size * W);
      });
      x.filter = 'none'; x.globalCompositeOperation = 'source-over';
    } else if (m.kind === 'ai') {
      const a = L.assets.get(m.asset); if (a) x.drawImage(a, 0, 0, W, H);
    }
    if (m.invert) { x.globalCompositeOperation = 'xor'; x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'source-over'; }
    return mC;
  }
  L.maskCanvas = maskCanvas;
  const active = m => PARAMS.some(p => (m.p[p.id] || 0) !== 0);
  // AI masks may be left at zero corrections: they still exist for background effects
  function applyMask(cv, m) {
    const W = cv.width, H = cv.height, p = m.p;
    if (lC.width !== W || lC.height !== H) { lC.width = W; lC.height = H; }
    const x = lC.getContext('2d');
    x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.clearRect(0, 0, W, H);
    const f = [];
    if (p.exposure) f.push(`brightness(${(Math.pow(2, p.exposure / 70)).toFixed(3)})`);
    if (p.contrast) f.push(`contrast(${(1 + p.contrast / 100).toFixed(3)})`);
    if (p.saturation) f.push(`saturate(${(1 + p.saturation / 100).toFixed(3)})`);
    if (p.bw) f.push(`grayscale(${(p.bw / 100).toFixed(2)})`);
    if (p.blur) f.push(`blur(${(p.blur / 100 * W * .012).toFixed(1)}px)`);
    x.filter = f.length ? f.join(' ') : 'none';
    x.drawImage(cv, 0, 0); x.filter = 'none';
    if (p.warmth || p.tint) {
      x.globalCompositeOperation = 'soft-light';
      if (p.warmth) { x.globalAlpha = Math.abs(p.warmth) / 100 * .6; x.fillStyle = p.warmth > 0 ? '#ff8a00' : '#0077ff'; x.fillRect(0, 0, W, H); }
      if (p.tint) { x.globalAlpha = Math.abs(p.tint) / 100 * .5; x.fillStyle = p.tint > 0 ? '#ff00c8' : '#00ff6a'; x.fillRect(0, 0, W, H); }
      x.globalAlpha = 1;
    }
    x.globalCompositeOperation = 'destination-in';
    x.drawImage(maskCanvas(m, W, H), 0, 0);
    const c = cv.getContext('2d'); c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(lC, 0, 0); c.restore();
  }
  L.HOOKS.out.push(cv => masks().forEach(m => { if (active(m)) applyMask(cv, m); }));
  L.HOOKS.outKey.push(() => JSON.stringify(masks()));

  // on-canvas guides
  L.HOOKS.afterDraw.push((ctx, r) => {
    if (L.mode !== 'masks') return;
    const m = byId(sel); if (!m) return;
    if (showMask || (m.kind === 'brush' && drag)) {
      const W = Math.round(r.w), H = Math.round(r.h), mc = maskCanvas(m, W, H);
      const t = mk(W, H), tx = t.getContext('2d'); tx.drawImage(mc, 0, 0); tx.globalCompositeOperation = 'source-in'; tx.fillStyle = 'rgba(255,45,85,.45)'; tx.fillRect(0, 0, W, H);
      ctx.drawImage(t, r.x, r.y);
    }
    ctx.save(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 3;
    const P = (u, v) => [r.x + u * r.w, r.y + v * r.h];
    if (m.kind === 'linear') {
      const [a, b] = m.geo, pa = P(...a), pb = P(...b), dx = pb[0] - pa[0], dy = pb[1] - pa[1], len = Math.hypot(dx, dy) || 1, nx = -dy / len * 2000, ny = dx / len * 2000;
      [[pa, 1], [[(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2], .5], [pb, 1]].forEach(([q, al]) => { ctx.globalAlpha = al; ctx.beginPath(); ctx.moveTo(q[0] - nx, q[1] - ny); ctx.lineTo(q[0] + nx, q[1] + ny); ctx.stroke(); });
      ctx.globalAlpha = 1; [pa, pb].forEach(q => { ctx.beginPath(); ctx.arc(q[0], q[1], 6, 0, 7); ctx.fillStyle = '#0a84ff'; ctx.fill(); ctx.stroke(); });
    } else if (m.kind === 'radial') {
      const [cx, cy, rx, ry, fe] = m.geo, c = P(cx, cy);
      ctx.beginPath(); ctx.ellipse(c[0], c[1], rx * r.w, ry * r.h, 0, 0, 7); ctx.stroke();
      ctx.globalAlpha = .5; ctx.beginPath(); ctx.ellipse(c[0], c[1], rx * r.w * (1 - fe), ry * r.h * (1 - fe), 0, 0, 7); ctx.stroke(); ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(c[0], c[1], 6, 0, 7); ctx.fillStyle = '#0a84ff'; ctx.fill(); ctx.stroke();
      [[c[0] + rx * r.w, c[1]], [c[0], c[1] + ry * r.h]].forEach(q => { ctx.beginPath(); ctx.arc(q[0], q[1], 5, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); });
    } else if (m.kind === 'brush' && L.mode === 'masks' && hover) {
      ctx.beginPath(); ctx.arc(hover.x, hover.y, brushSize / 2, 0, 7); ctx.stroke();
    }
    ctx.restore();
  });
  let hover = null;

  /* ---------- pointer ---------- */
  L.HOOKS.pointer.masks = {
    down(p, e) {
      const r = L.outRect(), u = (p.x - r.x) / r.w, v = (p.y - r.y) / r.h;
      let m = byId(sel);
      // grab handles of the selected mask first
      if (m && m.kind === 'linear') {
        const [a, b] = m.geo;
        for (const [i, q] of [[0, a], [1, b]]) if (Math.hypot((q[0] - u) * r.w, (q[1] - v) * r.h) < 12) { drag = {kind: 'lin-pt', i, m, before: JSON.stringify(m)}; return; }
      }
      if (m && m.kind === 'radial') {
        const [cx, cy, rx, ry] = m.geo;
        if (Math.hypot((cx + rx - u) * r.w, (cy - v) * r.h) < 12) { drag = {kind: 'rad-rx', m, before: JSON.stringify(m)}; return; }
        if (Math.hypot((cx - u) * r.w, (cy + ry - v) * r.h) < 12) { drag = {kind: 'rad-ry', m, before: JSON.stringify(m)}; return; }
        if (Math.hypot((cx - u) * r.w, (cy - v) * r.h) < 14) { drag = {kind: 'rad-move', m, before: JSON.stringify(m), u0: u, v0: v, g0: m.geo.slice()}; return; }
      }
      if (m && m.kind === 'brush' && tool === 'brush') {
        const s = {pts: [[u, v]], size: brushSize / r.w, erase: erase || e.altKey}; m.strokes.push(s);
        drag = {kind: 'paint', m, s}; L.schedule(); return;
      }
      // otherwise create a new mask of the current tool
      m = newMask(tool);
      if (tool === 'linear') { m.geo = [[u, v], [u, v + .001]]; drag = {kind: 'lin-pt', i: 1, m, fresh: true}; }
      else if (tool === 'radial') { m.geo = [u, v, .001, .001, .5]; drag = {kind: 'rad-new', m, u0: u, v0: v, fresh: true}; }
      else { const s = {pts: [[u, v]], size: brushSize / r.w, erase: false}; m.strokes.push(s); drag = {kind: 'paint', m, s, fresh: true}; }
      L.schedule();
    },
    move(p, e, pressed) {
      hover = p;
      if (!drag) { if (tool === 'brush') L.schedule(); return; }
      const r = L.outRect(), u = (p.x - r.x) / r.w, v = (p.y - r.y) / r.h, m = drag.m;
      if (drag.kind === 'lin-pt') m.geo[drag.i] = [u, v];
      else if (drag.kind === 'rad-new') { m.geo[2] = Math.max(.01, Math.abs(u - drag.u0)); m.geo[3] = Math.max(.01, Math.abs(v - drag.v0)); if (e.shiftKey || true) { const rr = Math.hypot((u - drag.u0) * r.w, (v - drag.v0) * r.h); m.geo[2] = Math.max(.01, rr / r.w); m.geo[3] = Math.max(.01, rr / r.h); } }
      else if (drag.kind === 'rad-rx') m.geo[2] = Math.max(.01, Math.abs(u - m.geo[0]));
      else if (drag.kind === 'rad-ry') m.geo[3] = Math.max(.01, Math.abs(v - m.geo[1]));
      else if (drag.kind === 'rad-move') { m.geo[0] = drag.g0[0] + u - drag.u0; m.geo[1] = drag.g0[1] + v - drag.v0; }
      else if (drag.kind === 'paint') drag.s.pts.push([u, v]);
      L.schedule();
    },
    up() {
      if (!drag) return;
      const d = drag; drag = null;
      if (d.fresh) L.push('Маска: ' + KINDS.find(k => k[0] === d.m.kind)[1].toLowerCase());
      else if (d.kind === 'paint') L.push(d.s.erase ? 'Маска: стерто' : 'Маска: кисть');
      else if (d.before !== JSON.stringify(d.m)) L.push('Маска изменена');
      renderPanel(); L.schedule();
    },
  };
  function newMask(kind, extra) {
    const n = masks().filter(m => m.kind === kind).length + 1;
    const m = Object.assign({id: uid(), kind, name: `${(KINDS.find(k => k[0] === kind) || [0, 'Объект'])[1]} ${n}`, invert: false,
      p: {exposure: kind === 'linear' ? -40 : kind === 'radial' ? 30 : 0, contrast: 0, saturation: 0, warmth: 0, tint: 0, blur: 0, bw: 0}, strokes: []}, extra || {});
    masks().push(m); sel = m.id; return m;
  }
  L.addMask = (kind, extra, label) => { const m = newMask(kind, extra); L.setMode('masks'); L.push(label || 'Новая маска'); renderPanel(); L.schedule(); return m; };

  /* ---------- panel ---------- */
  const pane = document.createElement('div');
  pane.className = 'pane'; pane.dataset.pane = 'masks'; pane.hidden = true;
  pane.innerHTML = `
    <div class="seg" id="mkTools">${KINDS.map(k => `<button data-k="${k[0]}" aria-pressed="${k[0] === tool}">${k[1]}</button>`).join('')}</div>
    <p class="note" id="mkHint"></p>
    <div class="lylist" id="mkList"></div>
    <div id="mkProps" hidden>
      <div class="chips" id="mkChips"></div>
      <div class="rhead"><b id="mkName">Экспозиция</b><output id="mkVal">0</output></div>
      <canvas class="ruler" id="mkRuler" role="slider" aria-label="Сила коррекции в маске"></canvas>
      <div id="mkBrush"><div class="rhead"><b>Размер кисти</b><output id="mkSizeVal">60</output></div><input type="range" id="mkSize" min="6" max="400" value="60">
        <div class="row"><button class="pill" id="mkErase" aria-pressed="false">Стирать (Alt)</button></div></div>
      <div class="row"><button class="pill" id="mkInvert" aria-pressed="false">Инвертировать</button><button class="pill" id="mkShow" aria-pressed="false">Показать маску</button><button class="pill" id="mkDel">Удалить маску</button></div>
    </div>`;
  document.querySelector('.panel .sec:not(.histo):not(.history)').appendChild(pane);
  const railBtn = document.createElement('button');
  railBtn.className = 'mode'; railBtn.dataset.mode = 'masks'; railBtn.setAttribute('aria-pressed', 'false'); railBtn.title = 'Маски: коррекция части фото';
  railBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3.5" y="3.5" width="17" height="17" rx="3"/><circle cx="12" cy="12" r="5" fill="currentColor" opacity=".45"/></svg>Маски`;
  document.querySelector('.mode[data-mode="crop"]').before(railBtn);
  $('#mkChips').innerHTML = PARAMS.map(p => L.chipHTML(p.id, p.name, p.ic)).join('');
  const ruler = new L.Ruler($('#mkRuler'), {min: -100, max: 100, def: 0});
  ruler.onInput = v => { const m = byId(sel); if (!m) return; m.p[selParam] = v; $('#mkVal').textContent = v; updChips(); L.schedule(); };
  ruler.onCommit = v => L.push(`Маска: ${PARAMS.find(p => p.id === selParam).name} ${v}`);
  const HINTS = {linear: 'Проведите линию по фото: с одной стороны коррекция полная, к другой плавно сходит на нет. Например, затемните небо.',
    radial: 'Нажмите в центр и тяните: внутри овала коррекция, к краям она мягко исчезает. Например, высветлите лицо.',
    brush: 'Закрасьте участок, который хотите изменить. С зажатым Alt кисть стирает маску.'};
  $('#mkTools').onclick = e => { const b = e.target.closest('button'); if (!b) return; tool = b.dataset.k; renderPanel(); };
  $('#mkChips').onclick = e => { const b = e.target.closest('.chip'); if (!b) return; selParam = b.dataset.id; renderPanel(); };
  $('#mkSize').oninput = e => { brushSize = +e.target.value; $('#mkSizeVal').textContent = brushSize; };
  $('#mkErase').onclick = () => { erase = !erase; renderPanel(); };
  $('#mkShow').onclick = () => { showMask = !showMask; renderPanel(); L.schedule(); };
  $('#mkInvert').onclick = () => { const m = byId(sel); if (!m) return; m.invert = !m.invert; L.push('Маска инвертирована'); renderPanel(); L.schedule(); };
  $('#mkDel').onclick = () => { const i = masks().findIndex(m => m.id === sel); if (i < 0) return; masks().splice(i, 1); sel = null; L.push('Маска удалена'); renderPanel(); L.schedule(); };
  $('#mkList').onclick = e => {
    const r = e.target.closest('.lyrow'); if (!r) return;
    const m = byId(r.dataset.id);
    sel = r.dataset.id; if (m.kind === 'brush') tool = 'brush'; renderPanel(); L.schedule();
  };
  function updChips() {
    const m = byId(sel);
    $('#mkChips').querySelectorAll('.chip').forEach(b => { const v = m ? (m.p[b.dataset.id] || 0) : 0; L.setChip(b, Math.abs(v) / 100, b.dataset.id === selParam, v !== 0); });
  }
  function renderPanel() {
    if (sel && !byId(sel)) sel = null;
    $('#mkTools').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.k === tool));
    $('#mkHint').textContent = HINTS[tool];
    const ms = masks();
    $('#mkList').innerHTML = ms.length ? ms.map(m => `<div class="lyrow${m.id === sel ? ' sel' : ''}" data-id="${m.id}"><span class="lyico">${{linear: '▤', radial: '◎', brush: '✎', ai: '✦'}[m.kind]}</span><span class="lyname">${m.name}</span></div>`).join('') : '<p class="note">Масок пока нет. Выберите инструмент выше и нарисуйте маску на фото.</p>';
    const m = byId(sel);
    $('#mkProps').hidden = !m;
    if (m) {
      const param = PARAMS.find(p => p.id === selParam);
      $('#mkName').textContent = param.name;
      const min = param.id === 'blur' || param.id === 'bw' ? 0 : -100;
      ruler.setRange(min, 100, 0); ruler.setValue(m.p[selParam] || 0); $('#mkVal').textContent = m.p[selParam] || 0;
      $('#mkBrush').hidden = m.kind !== 'brush';
      $('#mkInvert').setAttribute('aria-pressed', !!m.invert);
    }
    $('#mkShow').setAttribute('aria-pressed', showMask);
    $('#mkErase').setAttribute('aria-pressed', erase);
    updChips();
  }
  L.masksPanel = {render: renderPanel, select(id) { sel = id; renderPanel(); }};
  L.HOOKS.sync.push(renderPanel);
  L.HOOKS.mode.push(m => { if (m === 'masks') setTimeout(renderPanel); });
  L.HOOKS.image.push(() => { sel = null; });
  // keep masks on the same spot of the photo when it is cropped, rotated or flipped
  L.HOOKS.remap.push(T => masks().forEach(m => {
    if (m.kind === 'linear') m.geo = m.geo.map(([u, v]) => T.pt(u, v));
    else if (m.kind === 'radial') {
      const [cx, cy] = T.pt(m.geo[0], m.geo[1]);
      let rx = m.geo[2], ry = m.geo[3];
      if (T.kind === 'rot') [rx, ry] = [ry, rx]; else { rx *= T.sw; ry *= T.sh; }
      m.geo = [cx, cy, rx, ry, m.geo[4]];
    } else if (m.kind === 'brush') m.strokes.forEach(s => { s.pts = s.pts.map(([u, v]) => T.pt(u, v)); s.size *= T.sw; });
    else if (m.kind === 'ai') { const a = L.assets.get(m.asset); if (a) m.asset = L.addAsset(T.canvas(a)); }
  }));
})();
