// Fetch each armor set's monsterhunterwiki.org page and extract "Total
// Forging Materials" -> merge into armor_sets.json by normalized name match.
const https = require('https');
const fs = require('fs');
const path = require('path');
const OUT_DIR = __dirname;
const RAW_DIR = path.join(OUT_DIR, 'mhwikiorg_armor_pages_raw');
fs.mkdirSync(RAW_DIR, { recursive: true });
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': UA } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchUrl(res.headers.location).then(resolve, reject);
        return;
      }
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        if (res.statusCode !== 200) reject(new Error('HTTP ' + res.statusCode));
        else resolve(data);
      });
    }).on('error', reject);
  });
}
function decodeEntities(s) {
  return s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/&amp;/g, '&').trim();
}
function normName(n) {
  return n.replace(/α/g, 'alpha').replace(/β/g, 'beta').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function parseMaterials(html) {
  const idx = html.indexOf('Total Forging Materials');
  if (idx === -1) return null;
  const sectionEnd = html.indexOf('</table>', idx);
  const section = html.slice(idx, sectionEnd);
  const materials = [];
  for (const m of section.matchAll(/<a href="\/wiki\/[^"]+" title="[^"]+">([^<]+)<\/a><\/span> x(\d+)/g)) {
    materials.push({ material: decodeEntities(m[1]), qty: Number(m[2]) });
  }
  return materials;
}

async function main() {
  const hubHtml = fs.readFileSync(path.join(OUT_DIR, 'mhwikiorg_armor_raw.html'), 'utf8');
  const urls = [...new Set([...hubHtml.matchAll(/href="(\/wiki\/[^"]*_Set_\(MHWilds\))"/g)].map(m => 'https://monsterhunterwiki.org' + m[1]))];
  console.log('found', urls.length, 'set URLs');

  const sets = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'armor_sets.json'), 'utf8'));
  const byNormName = new Map(sets.map(s => [normName(s.name), s]));

  let matched = 0, withMats = 0, fail = 0;
  const CONC = 6;
  for (let i = 0; i < urls.length; i += CONC) {
    const chunk = urls.slice(i, i + CONC);
    await Promise.all(chunk.map(async (url) => {
      const file = path.join(RAW_DIR, decodeURIComponent(url.split('/').pop()).replace(/[^a-zA-Z0-9]+/g, '_') + '.html');
      let html;
      if (fs.existsSync(file)) {
        html = fs.readFileSync(file, 'utf8');
      } else {
        try { html = await fetchUrl(url); fs.writeFileSync(file, html); }
        catch (e) { fail++; return; }
      }
      const nameFromUrl = decodeURIComponent(url.split('/wiki/')[1]).replace(/_Set_\(MHWilds\)$/, '').replace(/_/g, ' ');
      const target = byNormName.get(normName(nameFromUrl + ' Set')) || byNormName.get(normName(nameFromUrl));
      if (!target) return;
      matched++;
      const materials = parseMaterials(html);
      if (materials && materials.length) { target.materials = materials; withMats++; }
    }));
    process.stdout.write(`\r${Math.min(i + CONC, urls.length)}/${urls.length}`);
  }
  console.log('');
  fs.writeFileSync(path.join(OUT_DIR, 'armor_sets.json'), JSON.stringify(sets, null, 1));
  console.log('matched to our sets:', matched, 'with materials:', withMats, 'fetch fail:', fail);
}

main().catch(e => { console.error(e); process.exit(1); });
