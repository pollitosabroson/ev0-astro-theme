#!/usr/bin/env node
// Sube una imagen a img.pro y devuelve la línea de heroImage lista para el frontmatter.
// Uso: node scripts/img-pro.cjs "/ruta/a/portada.webp"
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const file = process.argv[2];
if (!file) {
  console.error('Uso: node scripts/img-pro.cjs <fichero>');
  process.exit(1);
}
if (!process.env.IMG_PRO_KEY) {
  console.error('Falta IMG_PRO_KEY en .env');
  process.exit(1);
}

(async () => {
  const body = new FormData();
  body.append('file', new Blob([fs.readFileSync(file)]), path.basename(file));
  body.append('public', 'true');

  const res = await fetch('https://api.img.pro/v1/images', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.IMG_PRO_KEY}` },
    body,
  });
  const data = await res.json();
  if (!res.ok || !data.url) {
    console.error(`❌ ${res.status}:`, JSON.stringify(data).slice(0, 300));
    process.exit(1);
  }
  console.log(`✅ ${data.width}×${data.height}, ${Math.round(data.bytes / 1024)} KB`);
  console.log(`\nheroImage: "${data.url}"`);
})();
