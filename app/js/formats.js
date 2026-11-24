// Extra file formats: camera RAW (LibRaw) and iPhone HEIC/HEIF (libheif). Both run locally.
const L = window.Lumen;
const RAW_EXT = /\.(dng|cr2|cr3|crw|nef|nrw|arw|srf|sr2|raf|orf|rw2|raw|pef|srw|3fr|iiq|erf|mos|mrw|x3f|kdc|dcr)$/i;
const HEIC = file => /\.(heic|heif)$/i.test(file.name) || /hei[cf]/i.test(file.type || '');
L.RAW_EXT = RAW_EXT;

async function decodeRaw(file) {
  const { default: LibRaw } = await import('../vendor/libraw/index.js');
  const raw = new LibRaw();
  try {
    await raw.open(new Uint8Array(await file.arrayBuffer()), {useCameraWb: true, outputBps: 8, userQual: 3, outputColor: 1, noAutoBright: false});
    const im = await raw.imageData();
    const n = im.width * im.height, c = L.mk(im.width, im.height), x = c.getContext('2d');
    const out = x.createImageData(im.width, im.height), d = out.data, s = im.data, ch = im.colors || 3;
    const shift = im.bits === 16 ? 8 : 0;
    for (let i = 0; i < n; i++) {
      d[i * 4] = s[i * ch] >> shift; d[i * 4 + 1] = s[i * ch + 1] >> shift; d[i * 4 + 2] = s[i * ch + 2] >> shift; d[i * 4 + 3] = 255;
    }
    x.putImageData(out, 0, 0);
    return c;
  } finally { raw.dispose(); }
}
let heifP = null;
async function decodeHeic(file) {
  if (!heifP) heifP = import('../vendor/libheif/libheif-bundle.mjs').then(async m => {
    let lib = m.default();
    if (lib && typeof lib.then === 'function') lib = await lib;
    if (lib && lib.ready && typeof lib.ready.then === 'function') await lib.ready;
    return lib;
  });
  const lib = await heifP;
  const dec = new lib.HeifDecoder(), images = dec.decode(new Uint8Array(await file.arrayBuffer()));
  if (!images || !images.length) throw new Error('HEIC: no image');
  const img = images[0], w = img.get_width(), h = img.get_height();
  const c = L.mk(w, h), x = c.getContext('2d'), id = x.createImageData(w, h);
  await new Promise((res, rej) => img.display(id, data => data ? res() : rej(new Error('HEIC decode failed'))));
  x.putImageData(id, 0, 0);
  images.forEach(i => i.free && i.free());
  return c;
}
L.HOOKS.decode.push(async file => {
  if (RAW_EXT.test(file.name)) {
    if (!L.requirePro('raw')) { const e = new Error('pro'); e.silent = true; throw e; }
    L.toast('Проявляю RAW, это займет несколько секунд…');
    return decodeRaw(file);
  }
  if (HEIC(file)) { L.toast('Открываю HEIC…'); return decodeHeic(file); }
  return null;
});
