// Bridge for the phone app (Capacitor). Gives the editor the same `lumenNative`
// object the desktop app gets from Electron's preload script.
(function () {
  const C = window.Capacitor;
  if (window.lumenNative || !C || !C.isNativePlatform || !C.isNativePlatform()) return;
  const P = C.Plugins || {};
  const authCbs = [];
  if (P.App) {
    P.App.addListener('appUrlOpen', ev => authCbs.forEach(cb => cb(ev.url)));
    P.App.addListener('backButton', () => {
      const exp = document.getElementById('exp');
      if (exp && !exp.hidden) exp.hidden = true;
    });
  }
  const toBase64 = blob => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(blob);
  });
  window.lumenNative = {
    platform: C.getPlatform(),
    mobile: true,
    isDev: false,
    onMenu() {},
    onOpenFile() {},
    onAuthUrl(cb) { authCbs.push(cb); },
    async openExternal(url) {
      if (P.Browser) await P.Browser.open({ url });
      else window.open(url, '_blank');
    },
    async closeExternal() { if (P.Browser) try { await P.Browser.close(); } catch (e) {} },
    // Saves into the app's cache and opens the share sheet, where the person picks
    // "Save image", Files, Telegram and so on.
    async saveFile(name, blob) {
      const { Filesystem, Share } = P;
      const data = await toBase64(blob);
      const res = await Filesystem.writeFile({ path: name, data, directory: 'CACHE' });
      await Share.share({ title: name, files: [res.uri] });
      return 'shared';
    },
  };
})();
