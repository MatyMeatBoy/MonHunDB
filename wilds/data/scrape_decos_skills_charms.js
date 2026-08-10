// Scrape MH Wilds decorations, skills, and charms from Kiranico list pages.
// Parses the description to extract skill names and slot levels.
// Output: wilds/data/decorations.json, skills.json, charms.json
const https = require('https');
const fs = require('fs');
const path = require('path');

const OUT = __dirname;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0';

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': UA } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume(); get(res.headers.location).then(resolve, reject); return;
      }
      if (res.statusCode !== 200) { reject(new Error('HTTP ' + res.statusCode)); res.resume(); return; }
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    }).on('error', reject);
  });
}

function parseDecorations(html) {
  const decos = [];
  // table rows: <td><a href="/data/decorations/slug"><span>Name</span></a></td><td><span>Desc</span></td>
  const rowRe = /<tr[^>]*>[\s\S]*?<td[^>]*>[\s\S]*?<a[^>]*href="\/data\/decorations\/([^"]+)"[^>]*>[\s\S]*?(?:<span[^>]*>)?([^<]+)(?:<\/span>)?<\/a>[\s\S]*?<\/td>[\s\S]*?<td[^>]*>[\s\S]*?(?:<span[^>]*>)?([^<]*)(?:<\/span>)?<\/td>[\s\S]*?<\/tr>/gi;
  let m;
  while ((m = rowRe.exec(html))) {
    const [, slug, nameRaw, descRaw] = m;
    const name = nameRaw.replace(/&amp;/g, '&').replace(/&#x27;/g, "'").trim();
    const desc = descRaw.trim();
    if (!name) continue;
    const slotM = name.match(/\[(\d+)\]/);
    const slot = slotM ? parseInt(slotM[1]) : 1;
    const skills = [];
    const skillM = desc.match(/grants the ([A-Za-z '&+\-\/]+?(?:\s+and\s+[A-Za-z '&+\-\/]+?)?)\s+skills?\./);
    if (skillM) {
      skillM[1].split(/\s+and\s+/).forEach(n => skills.push({ name: n.trim(), level: 1 }));
    }
    decos.push({ id: slug, name, nameEs: '', slotLevel: slot, description: desc, descriptionEs: '', skills, materials: [] });
  }
  console.log('decorations:', decos.length);
  for (const sl of [1,2,3,4]) console.log('  slot', sl, ':', decos.filter(d => d.slotLevel === sl).length);
  return decos;
}

function parseSkills(html) {
  const skills = [];
  // table rows: <td><a href="/data/skills/slug"><span>Name</span></a></td><td>desc</td>
  const rowRe = /<tr[^>]*>[\s\S]*?<td[^>]*>[\s\S]*?<a[^>]*href="\/data\/skills\/([^"]+)"[^>]*>[\s\S]*?(?:<span[^>]*>)?([^<]+)(?:<\/span>)?<\/a>[\s\S]*?<\/td>[\s\S]*?<td[^>]*>[\s\S]*?(?:<span[^>]*>)?([^<]*)(?:<\/span>)?<\/td>[\s\S]*?<\/tr>/gi;
  let m;
  while ((m = rowRe.exec(html))) {
    const [, slug, nameRaw, descRaw] = m;
    const name = nameRaw.replace(/&amp;/g, '&').trim();
    const desc = descRaw.trim();
    if (!name) continue;
    skills.push({ id: slug, name, nameEs: '', descEn: desc, descEs: '', levels: [], colorIndex: 0 });
  }
  console.log('skills:', skills.length);
  return skills;
}

function parseCharms(html) {
  const charms = [];
  // table rows: <td><a href="/data/charms/slug"><span>Name</span></a></td>
  const rowRe = /<tr[^>]*>[\s\S]*?<td[^>]*>[\s\S]*?<a[^>]*href="\/data\/charms\/([^"]+)"[^>]*>[\s\S]*?(?:<span[^>]*>)?([^<]+)(?:<\/span>)?<\/a>[\s\S]*?<\/td>[\s\S]*?<\/tr>/gi;
  let m;
  while ((m = rowRe.exec(html))) {
    const [, slug, nameRaw] = m;
    const name = nameRaw.replace(/&amp;/g, '&').trim();
    if (!name) continue;
    charms.push({ id: slug, name, nameEs: '', rarity: 0, skills: [], materials: [], decoSlots: [] });
  }
  console.log('charms:', charms.length);
  return charms;
}

async function main() {
  console.log('Fetching decorations list...');
  const decoHtml = await get('https://mhwilds.kiranico.com/data/decorations');
  fs.writeFileSync(path.join(OUT, 'decorations_raw.html'), decoHtml);
  const decos = parseDecorations(decoHtml);
  fs.writeFileSync(path.join(OUT, 'decorations.json'), JSON.stringify(decos, null, 1));

  console.log('Fetching skills list...');
  const skillsHtml = await get('https://mhwilds.kiranico.com/data/skills');
  fs.writeFileSync(path.join(OUT, 'skills_raw.html'), skillsHtml);
  const skills = parseSkills(skillsHtml);
  fs.writeFileSync(path.join(OUT, 'skills.json'), JSON.stringify(skills, null, 1));

  console.log('Fetching charms list...');
  const charmsHtml = await get('https://mhwilds.kiranico.com/data/charms');
  fs.writeFileSync(path.join(OUT, 'charms_raw.html'), charmsHtml);
  const charms = parseCharms(charmsHtml);
  fs.writeFileSync(path.join(OUT, 'charms.json'), JSON.stringify(charms, null, 1));

  console.log('All done!');
}

main().catch(e => { console.error(e); process.exit(1); });
