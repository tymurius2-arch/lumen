// Interface language (Українська / Русский / English) and the Preferences window.
// The interface is written in Russian; every text that appears on screen is translated on
// the fly from i18n-dict.js, so switching languages needs no restart and loses no work.
(function () {
  const DICT = window.LUMEN_DICT || {};
  const KEYS = Object.keys(DICT).sort((a, b) => b.length - a.length);
  const CYR = /[А-Яа-яЁё]/, LETTER = /[A-Za-zА-Яа-яЁёІіЇїЄєҐґ'’]/;
  const LANGS = [['uk', 'Українська'], ['ru', 'Русский'], ['en', 'English']];
  const store = {get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }};
  const detect = () => { const n = (navigator.language || '').toLowerCase(); return n.startsWith('uk') ? 'uk' : n.startsWith('ru') || n.startsWith('be') ? 'ru' : 'en'; };
  let lang = store.get('lumen.lang', '') || detect();

  // whole phrase first; otherwise replace known phrases inside the text (longest first,
  // whole words only), through placeholders so a translation is never translated twice
  function t(s) {
    if (lang === 'ru' || !s || !CYR.test(s)) return s;
    const lead = s.match(/^\s*/)[0], trail = s.match(/\s*$/)[0], core = s.trim();
    if (DICT[core]) return lead + DICT[core][lang] + trail;
    let out = core; const parts = [];
    for (const k of KEYS) {
      if (out.indexOf(k) < 0) continue;
      let i = 0, res = '';
      while (true) {
        const j = out.indexOf(k, i);
        if (j < 0) { res += out.slice(i); break; }
        const before = out[j - 1], after = out[j + k.length];
        if ((before && LETTER.test(before)) || (after && LETTER.test(after))) { res += out.slice(i, j + 1); i = j + 1; continue; }
        res += out.slice(i, j) + '\u0001' + parts.length + '\u0002'; parts.push(DICT[k][lang]); i = j + k.length;
      }
      out = res;
      if (!CYR.test(out.replace(/\u0001\d+\u0002/g, ''))) break;
    }
    return lead + out.replace(/\u0001(\d+)\u0002/g, (_, n) => parts[+n]) + trail;
  }

  /* ---------- live translation of the page ---------- */
  const textOrig = new WeakMap(), attrOrig = new WeakMap(), ATTRS = ['title', 'aria-label', 'placeholder', 'alt'];
  function trText(n) {
    const v = n.nodeValue, rec = textOrig.get(n);
    const ru = rec && v === rec.shown ? rec.ru : v;
    if (!CYR.test(ru) && !(rec && rec.ru !== ru)) return;
    const shown = t(ru);
    textOrig.set(n, {ru, shown});
    if (shown !== v) n.nodeValue = shown;
  }
  function trAttr(el, a) {
    const v = el.getAttribute(a); if (v === null) return;
    let m = attrOrig.get(el); if (!m) { m = {}; attrOrig.set(el, m); }
    const rec = m[a], ru = rec && v === rec.shown ? rec.ru : v;
    if (!CYR.test(ru)) return;
    const shown = t(ru); m[a] = {ru, shown};
    if (shown !== v) el.setAttribute(a, shown);
  }
  function trTree(root) {
    if (root.nodeType === 3) return trText(root);
    if (root.nodeType !== 1 || root.tagName === 'SCRIPT' || root.tagName === 'STYLE') return;
    ATTRS.forEach(a => root.hasAttribute(a) && trAttr(root, a));
    const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) {
      if (n.nodeType === 3) { const p = n.parentNode; if (p && (p.tagName === 'SCRIPT' || p.tagName === 'STYLE')) continue; trText(n); }
      else ATTRS.forEach(a => n.hasAttribute(a) && trAttr(n, a));
    }
  }
  let titleRu = document.title;
  const applyAll = () => { trTree(document.body); document.title = t(titleRu); document.documentElement.lang = lang; };
  const mo = new MutationObserver(muts => {
    for (const m of muts) {
      if (m.type === 'childList') m.addedNodes.forEach(trTree);
      else if (m.type === 'characterData') trText(m.target);
      else if (m.type === 'attributes') trAttr(m.target, m.attributeName);
    }
  });
  let started = false;
  function start() {
    if (started) return; started = true;
    applyAll();
    mo.observe(document.body, {childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS});
  }
  function setLang(l) {
    if (!LANGS.some(x => x[0] === l)) return;
    lang = l; store.set('lumen.lang', l);
    applyAll();
    const nat = window.lumenNative; if (nat && nat.setLanguage) nat.setLanguage(l);
    renderPrefs();
    if (window.Lumen) window.Lumen.schedule();
  }

  /* ---------- preferences ---------- */
  const prefs = {get jpeg() { return Math.min(1, Math.max(.5, +store.get('lumen.jpeg', '92') / 100)); }, get hints() { return store.get('lumen.hints', '1') === '1'; }};
  window.LumenPrefs = prefs;
  let sheet = null;
  function renderPrefs() {
    if (!sheet) return;
    sheet.querySelectorAll('#prefLang button').forEach(b => b.setAttribute('aria-pressed', b.dataset.l === lang));
    sheet.querySelectorAll('#prefHints button').forEach(b => b.setAttribute('aria-pressed', (b.dataset.v === '1') === prefs.hints));
    const q = sheet.querySelector('#prefJpeg'); q.value = Math.round(prefs.jpeg * 100); sheet.querySelector('#prefJpegVal').textContent = q.value + '%';
    document.body.classList.toggle('no-hints', !prefs.hints);
  }
  function buildPrefs() {
    sheet = document.createElement('div');
    sheet.className = 'modal'; sheet.id = 'prefSheet'; sheet.hidden = true;
    sheet.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="prefTitle">
      <div class="sheet-head"><h2 id="prefTitle">Параметры</h2><button class="btn" id="prefClose">Закрыть</button></div>
      <div class="rhead"><b>Язык</b></div>
      <div class="seg" id="prefLang">${LANGS.map(([id, name]) => `<button data-l="${id}" lang="${id}">${name}</button>`).join('')}</div>
      <p class="note">Язык меняется сразу, перезапуск не нужен.</p>
      <div class="rhead"><b>Подсказки на холсте</b></div>
      <div class="seg" id="prefHints"><button data-v="1">Показывать</button><button data-v="0">Скрывать</button></div>
      <div class="rhead"><b>Качество JPEG при экспорте</b><output id="prefJpegVal"></output></div>
      <input type="range" id="prefJpeg" min="60" max="100" step="1" aria-label="JPEG">
    </div>`;
    document.body.appendChild(sheet);
    sheet.querySelector('#prefClose').onclick = () => { sheet.hidden = true; };
    sheet.addEventListener('click', e => { if (e.target === sheet) sheet.hidden = true; });
    sheet.querySelector('#prefLang').onclick = e => { const b = e.target.closest('button'); if (b) setLang(b.dataset.l); };
    sheet.querySelector('#prefHints').onclick = e => { const b = e.target.closest('button'); if (b) { store.set('lumen.hints', b.dataset.v); renderPrefs(); } };
    sheet.querySelector('#prefJpeg').oninput = e => { store.set('lumen.jpeg', e.target.value); renderPrefs(); };
    const btn = document.createElement('button');
    btn.className = 'btn icon'; btn.id = 'btnPrefs'; btn.title = 'Параметры (Ctrl+,)'; btn.setAttribute('aria-label', 'Параметры');
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>`;
    const sup = document.getElementById('btnSupport') || document.getElementById('btnRevert');
    sup.before(btn);
    btn.onclick = () => { renderPrefs(); sheet.hidden = false; };
    if (window.Lumen) window.Lumen.commands.prefs = btn.onclick;
    renderPrefs();
  }

  document.addEventListener('DOMContentLoaded', () => setTimeout(() => { if (!document.getElementById('app')) start(); }, 0));
  window.LumenI18n = {t, get lang() { return lang; }, setLang, LANGS};
  document.addEventListener('lumen:ready', () => {
    buildPrefs();
    start();
    const nat = window.lumenNative; if (nat && nat.setLanguage) nat.setLanguage(lang);
  });
})();
