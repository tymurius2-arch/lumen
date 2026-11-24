// Batch processing: apply the current look (settings, filter, curves, corrections, effects)
// to many photos at once, optionally resize and crop to a ratio, and save them to a folder.
(function () {
  const L = window.Lumen, $ = L.$, mk = L.mk, clamp = L.clamp;
  const sheet = document.createElement('div');
  sheet.className = 'modal'; sheet.id = 'batchSheet'; sheet.hidden = true;
  sheet.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="batchTitle">
    <div class="sheet-head"><h2 id="batchTitle">Пакетная обработка</h2><button class="btn" id="batchClose">Закрыть</button></div>
    <p class="note">Текущие правки этого фото (настройки, фильтр, кривые, коррекция, эффекты) применятся ко всем выбранным фото. Подходит для сотен кадров со съемки, в том числе RAW.</p>
    <div class="row"><button class="btn done" id="batchPick">Выбрать фото</button><span class="meta" id="batchCount">Фото не выбраны</span></div>
    <input type="file" id="batchFiles" multiple hidden accept="image/*,.heic,.heif,.dng,.cr2,.cr3,.nef,.arw,.raf,.orf,.rw2,.pef,.srw">
    <div class="rhead"><b>Размер по длинной стороне</b></div>
    <div class="pills" id="batchSize"><button class="pill" data-v="0" aria-pressed="true">Как есть</button><button class="pill" data-v="4096">4096</button><button class="pill" data-v="2048">2048</button><button class="pill" data-v="1600">1600</button><button class="pill" data-v="1080">1080</button></div>
    <div class="rhead"><b>Формат кадра</b></div>
    <div class="pills" id="batchRatio"><button class="pill" data-v="0" aria-pressed="true">Без обрезки</button><button class="pill" data-v="1">1:1</button><button class="pill" data-v="0.8">4:5</button><button class="pill" data-v="1.5">3:2</button><button class="pill" data-v="1.7778">16:9</button></div>
    <div class="rhead"><b>Файл</b></div>
    <div class="seg" id="batchFmt"><button data-f="jpeg" aria-pressed="true">JPEG</button><button data-f="png" aria-pressed="false">PNG</button></div>
    <div class="progress" hidden id="batchProg"><i></i></div>
    <p class="meta" id="batchStatus"></p>
    <div class="row"><button class="btn done" id="batchRun" disabled>Обработать и сохранить</button><button class="btn" id="batchStop" hidden>Остановить</button></div>
  </div>`;
  document.body.appendChild(sheet);
  let files = [], size = 0, ratio = 0, fmt = 'jpeg', stop = false;
  const seg = (id, set) => $(id).addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $(id).querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); set(b.dataset.v || b.dataset.f); });
  seg('#batchSize', v => size = +v); seg('#batchRatio', v => ratio = +v); seg('#batchFmt', v => fmt = v);
  $('#batchClose').onclick = () => { sheet.hidden = true; };
  $('#batchPick').onclick = () => $('#batchFiles').click();
  $('#batchFiles').onchange = e => { files = [...e.target.files]; e.target.value = ''; $('#batchCount').textContent = files.length ? `Выбрано фото: ${files.length}` : 'Фото не выбраны'; $('#batchRun').disabled = !files.length; };
  $('#batchStop').onclick = () => { stop = true; };

  function render(src, look) {
    let w = src.naturalWidth || src.width, h = src.naturalHeight || src.height;
    let sx = 0, sy = 0, sw = w, sh = h;
    if (ratio) { if (w / h > ratio) { sw = Math.round(h * ratio); sx = Math.round((w - sw) / 2); } else { sh = Math.round(w / ratio); sy = Math.round((h - sh) / 2); } }
    const s = size ? Math.min(1, size / Math.max(sw, sh)) : Math.min(1, 6000 / Math.max(sw, sh));
    const W = Math.max(1, Math.round(sw * s)), H = Math.max(1, Math.round(sh * s));
    const c = mk(W, H), x = c.getContext('2d', {willReadFrequently: true});
    x.imageSmoothingQuality = 'high'; x.drawImage(src, sx, sy, sw, sh, 0, 0, W, H);
    const id = x.getImageData(0, 0, W, H), p = L.params(look);
    const sp = (p.sharpness || p.definition || p.noise) ? L.spatial(id.data, W, H, p) : null;
    const out = new ImageData(W, H);
    L.colorPass(sp || id.data, sp ? 3 : 4, out.data, W * H, p, id.data);
    L.corrPass(out.data, W * H, look.cor); L.fxPass(out.data, W, H, look.fx);
    x.putImageData(out, 0, 0);
    if (L.vignette) L.vignette(x, W, H, p.vignette);
    if (L.watermark) L.watermark(x, W, H);
    return c;
  }
  const toBlob = (c) => new Promise(res => {
    if (fmt === 'jpeg') { const t = mk(c.width, c.height), tx = t.getContext('2d'); tx.fillStyle = '#fff'; tx.fillRect(0, 0, t.width, t.height); tx.drawImage(c, 0, 0); c = t; }
    c.toBlob(res, fmt === 'png' ? 'image/png' : 'image/jpeg', window.LumenPrefs ? window.LumenPrefs.jpeg : .92);
  });
  $('#batchRun').onclick = async () => {
    if (!files.length) return;
    const nat = L.native;
    let dir = null;
    if (nat && nat.chooseFolder) { dir = await nat.chooseFolder(); if (!dir) return; }
    const look = Object.assign({}, L.S, L.look());
    stop = false; $('#batchRun').disabled = true; $('#batchStop').hidden = false; $('#batchProg').hidden = false;
    let ok = 0, fail = 0;
    for (let i = 0; i < files.length && !stop; i++) {
      const f = files[i];
      $('#batchStatus').textContent = `${i + 1} из ${files.length}: ${f.name}`;
      $('#batchProg').firstElementChild.style.width = (i / files.length * 100) + '%';
      await new Promise(r => setTimeout(r, 0));
      try {
        const src = await L.decodeFile(f);
        const blob = await toBlob(render(src, look));
        const name = f.name.replace(/\.[^.]+$/, '') + '-lumen.' + (fmt === 'png' ? 'png' : 'jpg');
        if (dir) await nat.writeFile(dir, name, await blob.arrayBuffer());
        else if (nat && nat.saveFile) await nat.saveFile(name, blob);
        else { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
        ok++;
      } catch (e) { if (!(e && e.silent)) console.error(e); fail++; }
    }
    $('#batchProg').firstElementChild.style.width = '100%';
    $('#batchStatus').textContent = stop ? `Остановлено. Готово: ${ok}` : `Готово: ${ok}${fail ? `, не открылись: ${fail}` : ''}${dir ? ' · папка: ' + dir : ''}`;
    $('#batchRun').disabled = false; $('#batchStop').hidden = true;
  };
  L.commands.batch = () => { if (!L.requirePro('batch')) return; sheet.hidden = false; };
})();
