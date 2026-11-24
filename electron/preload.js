const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('lumenNative', {
  platform: process.platform,
  mobile: false,
  isDev: process.argv.includes('--lumen-dev'),
  onOpenFile: cb => ipcRenderer.on('open-file', (_e, m) => cb({ name: m.name, data: m.data })),
  onMenu: cb => ipcRenderer.on('menu', (_e, cmd) => cb(cmd)),
  onAuthUrl: cb => ipcRenderer.on('auth-url', (_e, url) => cb(url)),
  openExternal: url => ipcRenderer.invoke('open-external', url),
  chooseFolder: () => ipcRenderer.invoke('choose-folder'),
  writeFile: (dir, name, data) => ipcRenderer.invoke('write-file', dir, name, data),
  setLanguage: lang => ipcRenderer.send('set-lang', lang),
  saveFile: async (name, blob) => ipcRenderer.invoke('save-file', name, await blob.arrayBuffer()),
});
