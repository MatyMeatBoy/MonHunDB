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
  // Each item: <a href="/data/decorations/slug">Name [N]</a> <p>Description</p>
  const decos = [];
  const pattern = /<a[^>]*href="\/data\/decorations\/([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<p[^>]*>([^<]+)<\/p>/g;
  let m;
  while ((m = pattern.exec(html))) {
    const [, slug, nameRaw, desc] = m;
    const name = nameRaw.replace(/&amp;/g, '&').replace(/&#x27;/g, "'").trim();
    const slotM = name.match(/\[(\d+)\]/);
    const slot = slotM ? parseInt(slotM[1]) : 1;
    const id = slug;
    // Extract skill names from description
    const skills = [];
    // "A decoration that grants the X skill." or "A decoration that grants the X and Y skills."
    const skillM = desc.match(/grants the ([A-Za-z '&+/-]+?(?:\s+and\s+[A-Za-z '&+/-]+?)?)\s+skills?\./);
    if (skillM) {
      const names = skillM[1].split(/\s+and\s+/);
      names.forEach(n => skills.push({ name: n.trim(), level: 1 }));
    }
    decos.push({ id, name, nameEs: '', slotLevel: slot, description: desc, descriptionEs: '', skills, materials: [] });
  }
  console.log('decorations:', decos.length);
  // verify by slot
  for (const sl of [1,2,3,4]) console.log('  slot', sl, ':', decos.filter(d => d.slotLevel === sl).length);
  return decos;
}

function parseSkills(html) {
  // Each skill link: <a href="/data/skills/slug">Name</a> <p>description</p>
  const skills = [];
  const pattern = /<a[^>]*href="\/data\/skills\/([^"]+)"[^>]*>([^<]+)<\/a>\s*<\/h\d>\s*<p[^>]*>([^<]+)<\/p>/gi;
  let m;
  while ((m = pattern.exec(html))) {
    const [, slug, name, desc] = m;
    const id = slug;
    skills.push({ id, name: name.trim(), nameEs: '', descEn: desc.trim(), descEs: '', levels: [], colorIndex: 0 });
  }
  // fallback: simpler pattern for just links
  if (!skills.length) {
    const pattern2 = /<a[^>]*href="\/data\/skills\/([^"]+)"[^>]*>([^<]+)<\/a>/gi;
    while ((m = pattern2.exec(html))) {
      const [, slug, name] = m;
      if (!skills.find(s => s.id === slug)) {
        skills.push({ id: slug, name: name.trim(), nameEs: '', descEn: '', descEs: '', levels: [], colorIndex: 0 });
      }
    }
  }
  console.log('skills:', skills.length);
  return skills;
}

function parseCharms(html) {
  // Each charm link: <a href="/data/charms/slug">Name</a>
  const charms = [];
  const pattern = /<a[^>]*href="\/data\/charms\/([^"]+)"[^>]*>([^<]+)<\/a>/gi;
  let m;
  while ((m = pattern.exec(html))) {
    const [, slug, name] = m;
    const id = slug;
    // slot and skills can be derived from name? Charms in Wilds don't show skills in list page
    // Just capture basic info; details would need individual page visits
    charms.push({ id, name: name.trim(), nameEs: '', rarity: 0, skills: [], materials: [], decoSlots: [] });
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
