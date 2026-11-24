// Canva part: brand kit (colors, fonts, logo), design templates in social-media sizes,
// and saved looks ("Мои стили") that can be applied to any photo.
(function () {
  const L = window.Lumen, $ = L.$, mk = L.mk;
  const KEY = 'lumen.brand.v1', LOOKS = 'lumen.looks.v1';
  const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  let brand = load(KEY, {colors: ['#0a84ff', '#ffd60a', '#111111'], heading: 'Montserrat', body: 'Manrope', logo: null});

  /* ---------- brand kit (inside the Layers panel) ---------- */
  const LumenBrand = window.LumenBrand = {
    get: () => brand,
    render() {
      const slot = $('#brandSlot'); if (!slot) return;
      const pro = L.isPro() || !L.isProFeature('brand');
      slot.innerHTML = `
        <div class="rhead" data-pro="brand"><b>Фирменный стиль</b>${pro ? '' : '<span class="pro-tag inline">PRO</span>'}</div>
        <div class="swatches small" id="brColors">${brand.colors.map((c, i) => `<button class="sw" data-i="${i}" style="background:${c}" title="${c}: клик — выбрать, правый клик — убрать"></button>`).join('')}
          <button class="sw add" id="brAdd" title="Добавить текущий цвет">+</button></div>
        <div class="row brfonts">
          <label class="meta">Заголовки <select class="txt-in" id="brHead">${L.FONTS.map(f => `<option${f === brand.heading ? ' selected' : ''}>${f}</option>`).join('')}</select></label>
          <label class="meta">Текст <select class="txt-in" id="brBody">${L.FONTS.map(f => `<option${f === brand.body ? ' selected' : ''}>${f}</option>`).join('')}</select></label>
        </div>
        <div class="row">
          <button class="tool" id="brLogoSet">${brand.logo ? 'Сменить логотип' : 'Загрузить логотип'}</button>
          ${brand.logo ? '<button class="tool" id="brLogoAdd">Вставить логотип</button>' : ''}
        </div>
        <input type="file" id="brLogoFile" accept="image/*" hidden>`;
      $('#brColors').onclick = e => {
        if (!L.requirePro('brand')) return;
        if (e.target.id === 'brAdd') { if (!brand.colors.includes(L.markColor)) brand.colors.push(L.markColor); save(KEY, brand); LumenBrand.render(); L.toast('Цвет добавлен в фирменный стиль'); return; }
        const b = e.target.closest('.sw[data-i]'); if (b) { L.markColor = brand.colors[+b.dataset.i]; L.toast('Выбран фирменный цвет ' + L.markColor); }
      };
      $('#brColors').oncontextmenu = e => { const b = e.target.closest('.sw[data-i]'); if (!b) return; e.preventDefault(); brand.colors.splice(+b.dataset.i, 1); save(KEY, brand); LumenBrand.render(); };
      $('#brHead').onchange = e => { if (!L.requirePro('brand')) { e.target.value = brand.heading; return; } brand.heading = e.target.value; save(KEY, brand); };
      $('#brBody').onchange = e => { if (!L.requirePro('brand')) { e.target.value = brand.body; return; } brand.body = e.target.value; save(KEY, brand); };
      $('#brLogoSet').onclick = () => { if (L.requirePro('brand')) $('#brLogoFile').click(); };
      $('#brLogoFile').onchange = async e => {
        const f = e.target.files[0]; e.target.value = ''; if (!f) return;
        const c = await L.fileToCanvas(f), s = Math.min(1, 800 / Math.max(c.width, c.height)), t = mk(Math.round(c.width * s), Math.round(c.height * s));
        t.getContext('2d').drawImage(c, 0, 0, t.width, t.height);
        brand.logo = t.toDataURL('image/png'); save(KEY, brand); LumenBrand.render(); L.toast('Логотип сохранен');
      };
      const add = $('#brLogoAdd');
      if (add) add.onclick = () => {
        const im = new Image(); im.onload = () => { const c = mk(im.width, im.height); c.getContext('2d').drawImage(im, 0, 0); const ly = L.addImageLayer(c, 'Логотип', .2); ly.x = .85; ly.y = .88; L.schedule(); }; im.src = brand.logo;
      };
    },
  };

  /* ---------- templates and new design ---------- */
  const SIZES = [
    {id: 'ig-post', name: 'Пост Instagram', w: 1080, h: 1350}, {id: 'ig-sq', name: 'Квадрат', w: 1080, h: 1080},
    {id: 'story', name: 'Сторис / Reels', w: 1080, h: 1920}, {id: 'yt', name: 'Обложка YouTube', w: 1280, h: 720},
    {id: 'fb', name: 'Пост Facebook', w: 1200, h: 630}, {id: 'card', name: 'Карточка товара', w: 900, h: 1200},
    {id: 'a4', name: 'Листовка A4', w: 2480, h: 3508}, {id: 'pres', name: 'Слайд 16:9', w: 1920, h: 1080},
  ];
  const BGS = [
    ['#0f172a', '#4f46e5'], ['#ff7a18', '#af002d'], ['#00c6ff', '#0072ff'], ['#f7971e', '#ffd200'], ['#ee9ca7', '#ffdde1'],
    ['#11998e', '#38ef7d'], ['#232526', '#414345'], ['#fdfbfb', '#ebedee'], ['#ff5f6d', '#ffc371'], ['#654ea3', '#eaafc8'],
  ];
  const T = L.TEXT_STYLES.reduce((m, t) => (m[t.name] = t.s, m), {});
  const TEMPLATES = [
    {name: 'Распродажа', size: 'ig-post', bg: 1, layers: [
      ['Скидка', 'SALE −50%', .5, .38, {size: .14}], ['Заголовок', 'Только до воскресенья', .5, .56, {size: .06}],
      ['Плашка', 'Ссылка в профиле', .5, .74, {size: .045}]]},
    {name: 'Цитата', size: 'story', bg: 0, layers: [
      ['Элегантный', '«Делай сегодня то,\nза что завтра\nскажешь спасибо»', .5, .45, {size: .085}], ['Подзаголовок', '— твой кофе', .5, .66, {size: .045}]]},
    {name: 'Обложка видео', size: 'yt', bg: 2, layers: [
      ['Контур', 'КАК Я ЭТО', .38, .38, {size: .1}], ['Заголовок', 'СДЕЛАЛ', .38, .6, {size: .14, color: '#ffd60a'}]]},
    {name: 'Анонс события', size: 'ig-sq', bg: 9, layers: [
      ['Ретро', 'Вечеринка', .5, .38, {size: .15}], ['Плашка', 'суббота · 20:00', .5, .62, {size: .05}]]},
    {name: 'Новинка', size: 'card', bg: 7, layers: [
      ['Плашка', 'НОВИНКА', .5, .12, {size: .06, bg: {color: '#111111', r: 30}, color: '#ffffff'}],
      ['Заголовок', 'Название товара', .5, .82, {size: .07, color: '#111111', shadow: null}], ['Подзаголовок', '1 990 ₴', .5, .9, {size: .055, color: '#ff375f', shadow: null}]]},
    {name: 'Неоновая афиша', size: 'story', bg: 6, layers: [
      ['Неон', 'OPEN\nLATE', .5, .42, {size: .2}], ['Пиксели', 'NIGHT SHOW', .5, .7, {size: .05}]]},
  ];
  function bgCanvas(w, h, pair, photo) {
    const c = mk(w, h), x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, pair[0]); g.addColorStop(1, pair[1]);
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    if (photo) { const s = Math.max(w / photo.width, h / photo.height); x.drawImage(photo, (w - photo.width * s) / 2, (h - photo.height * s) / 2, photo.width * s, photo.height * s); }
    return c;
  }
  function newDesign(sizeId, bgIdx, tpl) {
    const sz = SIZES.find(s => s.id === sizeId);
    L.setImage(bgCanvas(sz.w, sz.h, BGS[bgIdx]), tpl ? tpl.name : sz.name, {label: 'Новый дизайн: ' + (tpl ? tpl.name : sz.name)});
    if (tpl) {
      const brandFont = brand.heading;
      const tt = s => window.LumenI18n ? window.LumenI18n.t(s) : s;
      tpl.layers.forEach(([style, text0, x, y, over]) => {
        const text = tt(text0);
        const s = Object.assign(JSON.parse(JSON.stringify(T[style])), over || {});
        const ly = Object.assign({type: 'text', name: text.split('\n')[0].slice(0, 24), text, x, y, align: 'center', ls: 0, lh: 1.1, italic: !!s.italic,
          id: Math.random().toString(36).slice(2, 9), visible: true, opacity: 100, blend: 'source-over', rot: 0}, s);
        if (L.isPro() && style === 'Заголовок' && brandFont) ly.font = brandFont;
        L.S.layers.push(ly);
      });
      L.push('Шаблон: ' + tpl.name);
    }
    L.setMode('layers'); L.schedule(); closeSheet();
  }
  const sheet = document.createElement('div');
  sheet.className = 'modal'; sheet.id = 'newSheet'; sheet.hidden = true;
  sheet.innerHTML = `<div class="sheet wide" role="dialog" aria-modal="true" aria-labelledby="newTitle">
    <div class="sheet-head"><h2 id="newTitle">Новый дизайн</h2><button class="btn" id="newClose">Закрыть</button></div>
    <div class="rhead"><b>Размер</b></div><div class="pills" id="newSizes">${SIZES.map((s, i) => `<button class="pill" data-id="${s.id}" aria-pressed="${i === 0}">${s.name} · ${s.w}×${s.h}</button>`).join('')}</div>
    <div class="rhead"><b>Фон</b></div><div class="swatches" id="newBgs">${BGS.map((b, i) => `<button class="sw" data-i="${i}" aria-pressed="${i === 0}" style="background:linear-gradient(135deg,${b[0]},${b[1]})"></button>`).join('')}</div>
    <div class="row"><button class="btn done" id="newBlank">Создать пустой</button></div>
    <div class="rhead" data-pro="templates"><b>Шаблоны</b><span class="meta">готовые надписи, их можно менять</span></div>
    <div class="tpls" id="newTpls">${TEMPLATES.map((t, i) => `<button class="tpl" data-i="${i}" style="background:linear-gradient(135deg,${BGS[t.bg][0]},${BGS[t.bg][1]})"><span style="font-family:'${T[t.layers[0][0]].font}'">${t.layers[0][1].split('\n')[0]}</span><small>${t.name}</small></button>`).join('')}</div>
  </div>`;
  document.body.appendChild(sheet);
  let nsSize = SIZES[0].id, nsBg = 0;
  const closeSheet = () => { sheet.hidden = true; };
  $('#newClose').onclick = closeSheet;
  sheet.addEventListener('click', e => { if (e.target === sheet) closeSheet(); });
  $('#newSizes').onclick = e => { const b = e.target.closest('.pill'); if (!b) return; nsSize = b.dataset.id; $('#newSizes').querySelectorAll('.pill').forEach(x => x.setAttribute('aria-pressed', x === b)); };
  $('#newBgs').onclick = e => { const b = e.target.closest('.sw'); if (!b) return; nsBg = +b.dataset.i; $('#newBgs').querySelectorAll('.sw').forEach(x => x.setAttribute('aria-pressed', x === b)); };
  $('#newBlank').onclick = () => newDesign(nsSize, nsBg, null);
  $('#newTpls').onclick = e => { const b = e.target.closest('.tpl'); if (!b) return; if (!L.requirePro('templates')) return; const t = TEMPLATES[+b.dataset.i]; newDesign(t.size, t.bg, t); };
  L.commands.newDesign = () => { sheet.hidden = false; };
  const newBtn = document.createElement('button');
  newBtn.className = 'btn'; newBtn.id = 'btnNew'; newBtn.title = 'Новый дизайн по шаблону (Ctrl+N)';
  newBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M12 8v8M8 12h8"/></svg><span class="txt">Новый</span>`;
  $('#btnOpen').before(newBtn);
  newBtn.onclick = L.commands.newDesign;

  /* ---------- my looks: save the current edit as a style, apply to any photo ---------- */
  let looks = load(LOOKS, []);
  const lookSheet = document.createElement('div');
  lookSheet.className = 'modal'; lookSheet.id = 'lookSheet'; lookSheet.hidden = true;
  lookSheet.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="lookTitle">
    <div class="sheet-head"><h2 id="lookTitle">Мои стили</h2><button class="btn" id="lookClose">Закрыть</button></div>
    <p class="note">Стиль запоминает настройки, фильтр, кривые, коррекцию и эффекты. Обрезка, ретушь и слои в стиль не входят.</p>
    <div class="row"><input class="txt-in" id="lookName" placeholder="Название, например «Теплый закат»" style="flex:1"><button class="btn done" id="lookSave">Сохранить текущий</button></div>
    <div id="lookList"></div>
    <div class="row"><button class="tool" id="lookCopy">Скопировать правки</button><button class="tool" id="lookPaste">Вставить правки</button></div>
  </div>`;
  document.body.appendChild(lookSheet);
  let clip = null;
  function renderLooks() {
    $('#lookList').innerHTML = looks.length ? looks.map((l, i) => `<div class="lyrow" data-i="${i}"><span class="lyname"></span><button class="pill" data-act="apply">Применить</button><button class="lybtn" data-act="del" title="Удалить">✕</button></div>`).join('') : '<p class="note">Сохраненных стилей пока нет.</p>';
    $('#lookList').querySelectorAll('.lyrow').forEach(r => { r.querySelector('.lyname').textContent = looks[+r.dataset.i].name; });
  }
  function applyLook(lk, label) {
    const S = L.S; Object.assign(S, JSON.parse(JSON.stringify(lk)));
    L.push(label); L.syncUI(); L.invalidate(true);
  }
  $('#lookClose').onclick = () => { lookSheet.hidden = true; };
  lookSheet.addEventListener('click', e => { if (e.target === lookSheet) lookSheet.hidden = true; });
  $('#lookSave').onclick = () => {
    const name = $('#lookName').value.trim() || `Стиль ${looks.length + 1}`;
    looks.push(Object.assign({name}, L.look())); save(LOOKS, looks); $('#lookName').value = ''; renderLooks(); L.toast('Стиль сохранен');
  };
  $('#lookList').onclick = e => {
    const r = e.target.closest('.lyrow'), a = e.target.closest('[data-act]'); if (!r || !a) return;
    const lk = looks[+r.dataset.i];
    if (a.dataset.act === 'del') { looks.splice(+r.dataset.i, 1); save(LOOKS, looks); renderLooks(); return; }
    const {name, ...rest} = lk; applyLook(rest, 'Стиль: ' + name); lookSheet.hidden = true;
  };
  $('#lookCopy').onclick = () => { clip = L.look(); L.toast('Правки скопированы'); };
  $('#lookPaste').onclick = () => { if (clip) { applyLook(clip, 'Вставлены правки'); lookSheet.hidden = true; } else L.toast('Сначала скопируйте правки'); };
  L.commands.looks = () => { if (!L.requirePro('presets')) return; renderLooks(); lookSheet.hidden = false; };
  L.commands.copyEdits = () => { clip = L.look(); L.toast('Правки скопированы'); };
  L.commands.pasteEdits = () => { if (clip) applyLook(clip, 'Вставлены правки'); else L.toast('Сначала скопируйте правки'); };
  L.HOOKS.keydown.push(e => {
    const mod = e.ctrlKey || e.metaKey;
    if (L.native && !L.native.mobile) return false;   // desktop: the menu owns these
    if (mod && e.code === 'KeyN') { e.preventDefault(); L.commands.newDesign(); return true; }
    return false;
  });
})();
