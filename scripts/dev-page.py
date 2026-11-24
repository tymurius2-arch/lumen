# Builds app/__dev.html: the editor with a stub of the desktop bridge, for testing in a browser.
s = open('app/index.html', encoding='utf-8').read()
stub = '<script>window.lumenNative={platform:"test",mobile:false,isDev:true,onOpenFile(){},onMenu(cb){window.__menu=cb},onAuthUrl(){},openExternal(u){console.log("open",u)}};</script>\n'
open('app/__dev.html', 'w', encoding='utf-8').write(s.replace('<title>', stub + '<title>', 1))
