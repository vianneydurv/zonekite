// Télécharge la photo Wikimedia Commons de chaque spot (Spot.photoUrl dans
// src/data/spots.ts), la réduit à 1280 px (sips, sur Mac) dans
// assets/spots/<id>.jpg, puis régénère src/data/spotPhotos.ts. Ainsi les
// photos de l'app sont exactement celles créditées dans « Crédits et
// sources ».
//
// Usage, depuis la racine du projet : node scripts/fetch-spot-photos.mjs
import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';

const UA = 'ZoneKiteApp/1.0 (spot photos; https://zonekite.web.app)';
const source = readFileSync('src/data/spots.ts', 'utf8');

// Chaque spot commence par « id: '...' » ; sa photo éventuelle suit avant
// le spot suivant.
const blocks = source.split(/\n\s*id: '/).slice(1);
const list = blocks
  .map((b) => ({ id: b.slice(0, b.indexOf("'")), url: b.match(/photoUrl: '([^']+)'/)?.[1] }))
  .filter((s) => s.url);

// Vignette 1280 px servie par Commons (plus légère), sinon l'original.
function thumbUrl(url) {
  const m = url.match(/^(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons)\/(.\/..\/)(.+)$/);
  return m ? `${m[1]}/thumb/${m[2]}${m[3]}/1280px-${m[3]}` : url;
}

async function download(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

const ok = [];
for (const { id, url } of list) {
  const out = `assets/spots/${id}.jpg`;
  const tmp = `assets/spots/.${id}.download`;
  try {
    let data;
    try {
      data = await download(thumbUrl(url));
    } catch {
      data = await download(url);
    }
    writeFileSync(tmp, data);
    try {
      execFileSync('sips', ['-Z', '1280', '-s', 'format', 'jpeg', '-s', 'formatOptions', '72', tmp, '--out', out], { stdio: 'ignore' });
    } catch {
      writeFileSync(out, data); // hors Mac : fichier tel quel
    }
    ok.push(id);
    console.log('✓', id);
  } catch (e) {
    // Spot laissé sans photo dans l'app (fond neutre).
    console.log('✗', id, '—', e.message);
  } finally {
    rmSync(tmp, { force: true });
  }
  await new Promise((r) => setTimeout(r, 400)); // politesse envers Wikimedia
}

if (ok.length === 0) {
  console.log('\nAucune photo téléchargée (connexion ?) : rien n’a été modifié.');
  process.exit(1);
}

const lines = ok.map((id) => {
  const key = /^[a-z]+$/.test(id) ? id : `'${id}'`;
  return `  ${key}: require('../../assets/spots/${id}.jpg'),`;
});
writeFileSync(
  'src/data/spotPhotos.ts',
  `// Photos locales des spots (require statique obligatoire pour Metro).
// Une entrée par spot id — voir src/data/spots.ts. Chaque photo doit être
// celle de Spot.photoUrl (Wikimedia Commons, licence libre), créditée dans
// l'app : le script scripts/fetch-spot-photos.mjs les télécharge et
// régénère ce fichier. Un spot sans photo affiche un fond neutre.
export const spotPhotos: Record<string, number> = {
${lines.join('\n')}
};
`
);
console.log(`\n${ok.length}/${list.length} photos. src/data/spotPhotos.ts régénéré.`);
