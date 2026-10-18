// Genera los SVG maestros de la marca (assets/brand) y todos los íconos/splash de las apps.
// Uso: pnpm brand:assets
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export const colors = {
  naranja: '#E8590C',
  melena: '#F2A516',
  tinta: '#2B1A12',
  crema: '#FFF8EE',
};

// Símbolo "Melena" en un viewBox de 120×120: 12 lóbulos + disco = melena, círculo central y huella
const mane = [
  ...Array.from(
    { length: 12 },
    (_, i) => `<circle cx="60" cy="13" r="13" transform="rotate(${i * 30} 60 60)"/>`,
  ),
  '<circle cx="60" cy="60" r="47"/>',
].join('');
const paw = [
  '<path d="M50 90C33 90 23 81 25 69C27 57 38 50 50 50C62 50 73 57 75 69C77 81 67 90 50 90Z"/>',
  '<ellipse cx="20" cy="45" rx="9" ry="12" transform="rotate(-22 20 45)"/>',
  '<ellipse cx="38" cy="25" rx="9.5" ry="13" transform="rotate(-8 38 25)"/>',
  '<ellipse cx="62" cy="25" rx="9.5" ry="13" transform="rotate(8 62 25)"/>',
  '<ellipse cx="80" cy="45" rx="9" ry="12" transform="rotate(22 80 45)"/>',
].join('');
const pawTransform = 'translate(32 30) scale(0.56)';

function symbolGroup({ center = colors.naranja, pawColor = colors.crema } = {}) {
  return (
    `<g fill="${colors.melena}">${mane}</g>` +
    `<circle cx="60" cy="60" r="38" fill="${center}"/>` +
    `<g fill="${pawColor}" transform="${pawTransform}">${paw}</g>`
  );
}

// Una sola silueta (para el ícono monocromo de Android 13+)
function monochromeGroup(color) {
  return (
    `<defs><mask id="m"><g fill="#fff">${mane}</g><circle cx="60" cy="60" r="38" fill="#000"/>` +
    `<g fill="#fff" transform="${pawTransform}">${paw}</g></mask></defs>` +
    `<rect width="120" height="120" fill="${color}" mask="url(#m)"/>`
  );
}

// Coloca el símbolo (120×120) centrado en un lienzo `size`, ocupando `ratio` del lado
function canvas(size, inner, { ratio = 1, background } = {}) {
  const s = (size * ratio) / 120;
  const offset = (size - 120 * s) / 2;
  const bg = background ? `<rect width="${size}" height="${size}" fill="${background}"/>` : '';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
    `${bg}<g transform="translate(${offset} ${offset}) scale(${s})">${inner}</g></svg>`
  );
}

const svgs = {
  symbol: canvas(120, symbolGroup()),
  'symbol-on-orange': canvas(120, symbolGroup({ center: colors.tinta })),
  monochrome: canvas(120, monochromeGroup(colors.tinta)),
  'app-icon': canvas(1024, symbolGroup({ center: colors.tinta }), {
    ratio: 0.74,
    background: colors.naranja,
  }),
};

async function png(svg, out, size) {
  const file = join(root, out);
  await mkdir(dirname(file), { recursive: true });
  await sharp(Buffer.from(svg), { density: 300 }).resize(size, size).png().toFile(file);
  console.log('✓', out);
}

// ICO con un PNG embebido (formato válido desde Windows Vista; lo leen todos los navegadores)
async function ico(svg, out, size) {
  const data = await sharp(Buffer.from(svg), { density: 300 }).resize(size, size).png().toBuffer();
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  header.writeUInt8(size, 6);
  header.writeUInt8(size, 7);
  header.writeUInt16LE(1, 10);
  header.writeUInt16LE(32, 12);
  header.writeUInt32LE(data.length, 14);
  header.writeUInt32LE(22, 18);
  await writeFile(join(root, out), Buffer.concat([header, data]));
  console.log('✓', out);
}

await mkdir(join(root, 'assets/brand'), { recursive: true });
for (const [name, svg] of Object.entries(svgs)) {
  await writeFile(join(root, `assets/brand/${name}.svg`), svg);
  console.log('✓', `assets/brand/${name}.svg`);
}

const mobile = 'apps/mobile/assets/images';
await png(svgs['app-icon'], `${mobile}/icon.png`, 1024);
// Android adaptive: el sistema recorta un círculo del 61% central, el símbolo va al 58%
await png(
  canvas(512, symbolGroup({ center: colors.tinta }), { ratio: 0.58 }),
  `${mobile}/android-icon-foreground.png`,
  512,
);
await png(
  canvas(432, monochromeGroup('#000'), { ratio: 0.58 }),
  `${mobile}/android-icon-monochrome.png`,
  432,
);
await png(svgs.symbol, `${mobile}/splash-icon.png`, 512);
await png(svgs.symbol, `${mobile}/favicon.png`, 48);

const web = 'apps/web/src/app';
await writeFile(join(root, `${web}/icon.svg`), svgs.symbol);
console.log('✓', `${web}/icon.svg`);
await png(svgs['app-icon'], `${web}/apple-icon.png`, 180);
await ico(svgs.symbol, `${web}/favicon.ico`, 48);
