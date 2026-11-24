const { app, BrowserWindow, Menu, shell, protocol, net, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

const isMac = process.platform === 'darwin';
const IMAGE_EXT = /\.(jpe?g|png|webp|gif|bmp|heic|heif|dng|cr2|cr3|crw|nef|nrw|arw|srf|sr2|raf|orf|rw2|raw|pef|srw|3fr|iiq|erf|mos|mrw|x3f)$/i;
const SITE_URL = 'https://tymurius2-arch.github.io/lumen/';
const APP_DIR = path.join(__dirname, '..', 'app');
const DICT = require('../app/js/i18n-dict.js');
let lang = 'ru';
const settingsFile = () => path.join(app.getPath('userData'), 'settings.json');
function loadLang() {
  try { const l = JSON.parse(fs.readFileSync(settingsFile(), 'utf8')).lang; if (['uk', 'ru', 'en'].includes(l)) { lang = l; return; } } catch {}
  const loc = (app.getLocale() || '').toLowerCase();
  lang = loc.startsWith('uk') ? 'uk' : loc.startsWith('ru') || loc.startsWith('be') ? 'ru' : 'en';
}
function saveLang() { try { fs.writeFileSync(settingsFile(), JSON.stringify({ lang })); } catch {} }
// menu labels are written in Russian; "Кисть  (B)" keeps its shortcut hint
function T(label) {
  if (lang === 'ru' || !label) return label;
  const m = /^(.*?)(\s{2}\(.+\))?$/.exec(label);
  const tr = DICT[m[1]] ? DICT[m[1]][lang] : m[1];
  return tr + (m[2] || '');
}
const translateMenu = items => items.forEach(it => { if (it.label) it.label = T(it.label); if (Array.isArray(it.submenu)) translateMenu(it.submenu); });
let win = null;
let pending = [];
let pendingAuth = null;

// The editor is served from app://lumen/ instead of file:// so that WebAssembly, module
// workers and fetch (AI selection, RAW, HEIC) work exactly as in a browser, offline.
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
]);

// lumen:// links bring the browser back to the app after Google sign-in
if (process.defaultApp && process.argv.length >= 2) app.setAsDefaultProtocolClient('lumen', process.execPath, [path.resolve(process.argv[1])]);
else app.setAsDefaultProtocolClient('lumen');

function sendFile(file) {
  if (!file || !IMAGE_EXT.test(file)) return;
  let data;
  try { data = fs.readFileSync(file); } catch { return; }
  const msg = { name: path.basename(file), data };
  if (win && !win.webContents.isLoading()) win.webContents.send('open-file', msg);
  else pending.push(msg);
}
function sendAuth(url) {
  if (!url || !url.startsWith('lumen://')) return;
  if (win && !win.webContents.isLoading()) { win.webContents.send('auth-url', url); if (win.isMinimized()) win.restore(); win.focus(); }
  else pendingAuth = url;
}

function send(cmd) {
  return () => { if (win) win.webContents.send('menu', cmd); };
}

function buildMenu() {
  const template = [
    ...(isMac ? [{
      label: 'Lumen',
      submenu: [
        { role: 'about', label: 'О программе Lumen' },
        { label: 'Поддержать Lumen…', click: send('support') },
        { label: 'Параметры…', accelerator: 'Cmd+,', click: send('prefs') },
        { type: 'separator' },
        { role: 'hide', label: 'Скрыть Lumen' },
        { role: 'hideOthers', label: 'Скрыть остальные' },
        { type: 'separator' },
        { role: 'quit', label: 'Завершить Lumen' },
      ],
    }] : []),
    {
      label: 'Файл',
      submenu: [
        { label: 'Новый дизайн…', accelerator: 'CmdOrCtrl+N', click: send('newDesign') },
        { label: 'Открыть…', accelerator: 'CmdOrCtrl+O', click: send('open') },
        { label: 'Экспорт…', accelerator: 'CmdOrCtrl+S', click: send('export') },
        { type: 'separator' },
        { label: 'Пакетная обработка…', accelerator: 'CmdOrCtrl+Alt+B', click: send('batch') },
        { label: 'Мои стили…', click: send('looks') },
        { type: 'separator' },
        { label: 'Вернуть к оригиналу', click: send('revert') },
        ...(isMac ? [] : [{ label: 'Параметры…', accelerator: 'Ctrl+,', click: send('prefs') }, { label: 'Поддержать Lumen…', click: send('support') }]),
        { type: 'separator' },
        isMac ? { role: 'close', label: 'Закрыть окно' } : { role: 'quit', label: 'Выход' },
      ],
    },
    {
      label: 'Правка',
      submenu: [
        { label: 'Отменить', accelerator: 'CmdOrCtrl+Z', click: send('undo') },
        { label: 'Повторить', accelerator: isMac ? 'Cmd+Shift+Z' : 'Ctrl+Y', click: send('redo') },
        { type: 'separator' },
        { label: 'Скопировать правки', accelerator: 'CmdOrCtrl+Shift+C', click: send('copyEdits') },
        { label: 'Вставить правки', accelerator: 'CmdOrCtrl+Shift+V', click: send('pasteEdits') },
        { type: 'separator' },
        { role: 'cut', label: 'Вырезать' },
        { role: 'copy', label: 'Копировать' },
        { role: 'paste', label: 'Вставить' },
        { role: 'selectAll', label: 'Выделить все' },
      ],
    },
    {
      label: 'Изображение',
      submenu: [
        {
          label: 'Коррекция',
          submenu: [
            { label: 'Уровни…', accelerator: 'CmdOrCtrl+L', click: send('corr:levels') },
            { label: 'Кривые…', accelerator: 'CmdOrCtrl+M', click: send('mode:curves') },
            { label: 'Цветовой баланс…', accelerator: 'CmdOrCtrl+B', click: send('corr:balance') },
            { label: 'Цветовой тон/Насыщенность…', accelerator: 'CmdOrCtrl+U', click: send('corr:hsl') },
            { label: 'Фотофильтр…', click: send('corr:photo') },
            { label: 'Карта градиента…', click: send('corr:gmap') },
            { type: 'separator' },
            { label: 'Обесцветить', accelerator: 'CmdOrCtrl+Shift+U', click: send('corr:desat') },
            { label: 'Инверсия', accelerator: 'CmdOrCtrl+I', click: send('corr:invert') },
            { label: 'Постеризация…', click: send('corr:posterize') },
            { label: 'Порог…', click: send('corr:threshold') },
          ],
        },
        { type: 'separator' },
        { label: 'Улучшить с ИИ', accelerator: 'CmdOrCtrl+Shift+E', click: send('aiEnhance') },
        { label: 'Настройки как на iPhone', click: send('mode:adjust') },
        { label: 'Фильтры iPhone', click: send('mode:filters') },
        { label: 'Маски (локальная коррекция)', click: send('mode:masks') },
        { label: 'Выделить объект (ИИ)', accelerator: 'CmdOrCtrl+Shift+A', click: send('mode:select') },
        { label: 'Кадрирование и поворот', click: send('mode:crop') },
      ],
    },
    {
      label: 'Слои',
      submenu: [
        { label: 'Слои и текст', click: send('mode:layers') },
        { label: 'Новый текст', accelerator: 'CmdOrCtrl+T', click: send('newText') },
      ],
    },
    {
      label: 'Фильтр',
      submenu: [
        { label: 'Размытие по Гауссу…', click: send('fx:blur') },
        { label: 'Размытие в движении…', click: send('fx:motion') },
        { label: 'Добавить шум…', click: send('fx:noise') },
        { label: 'Мозаика…', click: send('fx:mosaic') },
        { label: 'Тиснение…', click: send('fx:emboss') },
        { label: 'Выделение краев…', click: send('fx:edges') },
      ],
    },
    {
      label: 'Инструменты',
      submenu: [
        { label: 'Перемещение  (V)', click: send('mode:layers') },
        { label: 'Точечная восстанавливающая кисть  (J)', click: send('tool:spot') },
        { label: 'Восстанавливающая кисть', click: send('tool:heal') },
        { label: 'Убрать покраснения', click: send('tool:redness') },
        { label: 'Сглаживание кожи', click: send('tool:skin') },
        { label: 'Штамп  (S)', click: send('tool:clone') },
        { label: 'Размытие  (R)', click: send('tool:blurb') },
        { label: 'Осветлитель  (O)', click: send('tool:dodge') },
        { label: 'Затемнитель', click: send('tool:burn') },
        { label: 'Губка', click: send('tool:sponge') },
        { type: 'separator' },
        { label: 'Кисть  (B)', click: send('tool:pen') },
        { label: 'Ластик  (E)', click: send('tool:eraser') },
        { label: 'Прямоугольник  (U)', click: send('tool:rect') },
        { label: 'Пипетка  (I)', click: send('tool:picker') },
      ],
    },
    {
      label: 'Вид',
      submenu: [
        { label: 'Сетка', accelerator: "CmdOrCtrl+'", click: send('grid') },
        { type: 'separator' },
        { label: 'Увеличить', accelerator: 'CmdOrCtrl+=', click: send('zoomIn') },
        { label: 'Уменьшить', accelerator: 'CmdOrCtrl+-', click: send('zoomOut') },
        { label: 'Вписать в окно', accelerator: 'CmdOrCtrl+0', click: send('zoomFit') },
        { label: 'Реальный размер', accelerator: 'CmdOrCtrl+1', click: send('zoom100') },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Полный экран' },
        ...(app.isPackaged ? [] : [{ role: 'toggleDevTools', label: 'Инструменты разработчика' }]),
      ],
    },
    {
      label: 'Справка',
      submenu: [
        { label: 'Поддержать Lumen…', click: send('support') },
        { label: 'Сайт Lumen', click: () => shell.openExternal(SITE_URL) },
      ],
    },
  ];
  translateMenu(template);
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    title: 'Lumen',
    backgroundColor: '#000000',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      additionalArguments: app.isPackaged ? [] : ['--lumen-dev'],
    },
  });
  win.once('ready-to-show', () => win.show());
  win.loadURL('app://lumen/index.html');
  win.webContents.on('did-finish-load', () => {
    pending.forEach(m => win.webContents.send('open-file', m));
    pending = [];
    if (pendingAuth) { win.webContents.send('auth-url', pendingAuth); pendingAuth = null; }
  });
  // Links open in the system browser; the app window never navigates away.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('app://lumen/')) e.preventDefault(); });
  win.on('closed', () => { win = null; });
}

/* ---------- bridge for the editor (see preload.js) ---------- */
ipcMain.on('set-lang', (_e, l) => {
  if (!['uk', 'ru', 'en'].includes(l) || l === lang) return;
  lang = l; saveLang(); buildMenu();
});
ipcMain.handle('open-external', (_e, url) => {
  if (typeof url === 'string' && url.startsWith('https://')) return shell.openExternal(url);
});
ipcMain.handle('choose-folder', async () => {
  const r = await dialog.showOpenDialog(win, { title: 'Папка для обработанных фото', properties: ['openDirectory', 'createDirectory'] });
  return r.canceled ? null : r.filePaths[0];
});
ipcMain.handle('write-file', async (_e, dir, name, data) => {
  const safe = path.basename(String(name)).replace(/[\\/:*?"<>|]/g, '_');
  let target = path.join(dir, safe), n = 1;
  while (fs.existsSync(target)) target = path.join(dir, safe.replace(/(\.[^.]+)$/, ` (${n++})$1`));
  await fs.promises.writeFile(target, Buffer.from(data));
  return target;
});
ipcMain.handle('save-file', async (_e, name, data) => {
  const r = await dialog.showSaveDialog(win, { defaultPath: path.basename(String(name)) });
  if (r.canceled || !r.filePath) return 'canceled';
  await fs.promises.writeFile(r.filePath, Buffer.from(data));
  return 'saved';
});

// macOS: a photo dropped on the Dock icon or opened with "Open With", and lumen:// links.
app.on('open-file', (e, file) => { e.preventDefault(); sendFile(file); });
app.on('open-url', (e, url) => { e.preventDefault(); sendAuth(url); });

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', (_e, argv) => {
    if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
    sendFile(argv.slice(1).find(a => IMAGE_EXT.test(a)));
    sendAuth(argv.find(a => a.startsWith('lumen://')));
  });
  app.whenReady().then(() => {
    protocol.handle('app', req => {
      const { pathname } = new URL(req.url);
      const file = path.normalize(path.join(APP_DIR, decodeURIComponent(pathname)));
      if (!file.startsWith(APP_DIR)) return new Response('Not found', { status: 404 });
      return net.fetch(pathToFileURL(file).toString());
    });
    loadLang();
    buildMenu();
    createWindow();
    sendFile(process.argv.slice(1).find(a => IMAGE_EXT.test(a)));
    sendAuth(process.argv.find(a => a.startsWith('lumen://')));
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
  });
  app.on('window-all-closed', () => { if (!isMac) app.quit(); });
}
