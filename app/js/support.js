// "Поддержать" button: Lumen is free, donations go to the author's monobank jar.
(function () {
  const L = window.Lumen, $ = L.$, nat = L.native || {};
  const JAR = (window.LUMEN_CONFIG && window.LUMEN_CONFIG.monoJarUrl) || '';
  const valid = /^https:\/\/send\.monobank\.ua\/jar\/[A-Za-z0-9]+\/?$/.test(JAR);

  const btn = document.createElement('button');
  btn.className = 'btn support'; btn.id = 'btnSupport'; btn.title = 'Поддержать автора Lumen';
  btn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 20.5s-7.5-4.4-7.5-10.1A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.8c0 5.7-7.5 10.1-7.5 10.1z"/></svg><span class="txt">Поддержать</span>`;
  $('#btnRevert').before(btn);

  const sheet = document.createElement('div');
  sheet.className = 'modal'; sheet.id = 'supportSheet'; sheet.hidden = true;
  sheet.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="supTitle">
    <div class="sheet-head"><h2 id="supTitle">Поддержать Lumen</h2><button class="btn" id="supClose">Закрыть</button></div>
    <p class="lead-pay">Lumen полностью бесплатный: все функции открыты, без подписок и рекламы.</p>
    <p class="note">Если программа вам помогла, можно закинуть любую сумму на банку monobank. Это добровольно и помогает выпускать новые версии.</p>
    ${valid ? `
      <div class="row"><button class="btn done" id="supOpen"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 20.5s-7.5-4.4-7.5-10.1A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.8c0 5.7-7.5 10.1-7.5 10.1z"/></svg>Открыть банку monobank</button><button class="btn" id="supCopy">Скопировать ссылку</button></div>
      <p class="meta jar-link"></p>
      <p class="note">Откроется страница monobank: оплатить можно картой любого банка, Apple Pay или Google Pay.</p>`
    : `<p class="note">Ссылка на банку еще не добавлена. Владельцу программы: вставьте ее в <code>app/js/config.js</code> → <code>monoJarUrl</code>.</p>`}
  </div>`;
  document.body.appendChild(sheet);
  if (valid) sheet.querySelector('.jar-link').textContent = JAR;

  const open = () => { sheet.hidden = false; };
  btn.onclick = open;
  $('#supClose').onclick = () => { sheet.hidden = true; };
  sheet.addEventListener('click', e => { if (e.target === sheet) sheet.hidden = true; });
  const go = $('#supOpen');
  if (go) go.onclick = () => { if (nat.openExternal) nat.openExternal(JAR); else window.open(JAR, '_blank'); };
  const cp = $('#supCopy');
  if (cp) cp.onclick = () => {
    try { navigator.clipboard.writeText(JAR).then(() => L.toast('Ссылка скопирована'), () => L.toast(JAR)); } catch (e) { L.toast(JAR); }
  };
  L.commands.support = open;
})();
