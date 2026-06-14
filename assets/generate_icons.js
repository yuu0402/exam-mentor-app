const fs = require('fs');
const zlib = require('zlib');

function createPNG(w, h, r, g, b) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;

  const crc32 = (buf) => {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let j = 0; j < 8; j++)
        c = (c >>> 1) ^ (c & 1 ? 0xEDB88320 : 0);
    }
    return (c ^ 0xFFFFFFFF) >>> 0;
  };

  const chunk = (t, d) => {
    const l = Buffer.alloc(4);
    l.writeUInt32BE(d.length, 0);
    const tb = Buffer.from(t);
    const crc = crc32(Buffer.concat([tb, d]));
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc, 0);
    return Buffer.concat([l, tb, d, c]);
  };

  const raw = [];
  for (let y = 0; y < h; y++) {
    raw.push(0); // filter byte
    for (let x = 0; x < w; x++)
      raw.push(r, g, b);
  }

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(Buffer.from(raw))),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

const path = require('path');
const assetsDir = __dirname;

// Deep green background icons
fs.writeFileSync(path.join(assetsDir, 'icon.png'), createPNG(1024, 1024, 46, 125, 50));
fs.writeFileSync(path.join(assetsDir, 'splash.png'), createPNG(1024, 1024, 76, 175, 80));
fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.png'), createPNG(1024, 1024, 76, 175, 80));
fs.writeFileSync(path.join(assetsDir, 'favicon.png'), createPNG(48, 48, 46, 125, 50));

console.log('Icons generated successfully.');
