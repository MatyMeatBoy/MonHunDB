const fs = require('fs');
const path = require('path');

const BASE = 'https://mhwilds.kiranico.com';
const OUT_DIR = path.join(__dirname, 'wilds_raw');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
};

async function fetchHtml(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.text();
}

function parseSkillList(html) {
  const skills = [];
  const regex = /<a href="\/data\/skills\/([^"]+)">([^<]+)<\/a>/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    skills.push({ slug: match[1], name: match[2].trim() });
  }
  return skills;
}

async function scrapeSkillList(lang = 'en') {
  const url = lang === 'es' ? `${BASE}/es/data/skills` : `${BASE}/data/skills`;
  const html = await fetchHtml(url);
  return parseSkillList(html);
}

function parseSkillDetail(html) {
  const data = { id: '', name: '', description: '', levels: [] };

  const idMatch = html.match(/\/data\/skills\/([^\/]+)\/?$/);
  if (idMatch) data.id = idMatch[1];

  const nameMatch = html.match(/<h2[^>]*>([^<]+)<\/h2>/);
  if (nameMatch) data.name = nameMatch[1].trim();

  const descMatch = html.match(/<blockquote[^>]*>([^<]+)<\/blockquote>/);
  if (descMatch) data.description = descMatch[1].trim();

  const levelRegex = /Lv(\d+)[^<]*<td[^>]*>([^<]+)<\/td>/g;
  let levelMatch;
  while ((levelMatch = levelRegex.exec(html)) !== null) {
    data.levels.push({ level: parseInt(levelMatch[1], 10), effect: levelMatch[2].trim() });
  }

  return data;
}

async function scrapeSkillDetail(slug, lang = 'en') {
  const url = lang === 'es' ? `${BASE}/es/data/skills/${slug}` : `${BASE}/data/skills/${slug}`;
  const html = await fetchHtml(url);
  return parseSkillDetail(html);
}

async function main() {
  console.log('Scraping skill list (EN)...');
  const skillsEn = await scrapeSkillList('en');
  console.log(`Found ${skillsEn.length} skills`);

  console.log('Scraping skill list (ES)...');
  const skillsEs = await scrapeSkillList('es');
  const esMap = new Map(skillsEs.map(s => [s.slug, s.name]));

  const results = [];
  for (let i = 0; i < skillsEn.length; i++) {
    const s = skillsEn[i];
    console.log(`[${i+1}/${skillsEn.length}] Scraping ${s.name}...`);
    try {
      const [detailEn, detailEs] = await Promise.all([
        scrapeSkillDetail(s.slug, 'en'),
        scrapeSkillDetail(s.slug, 'es'),
      ]);
      results.push({
        id: detailEn.id || s.slug,
        name: s.name,
        nameEs: esMap.get(s.slug) || s.name,
        description: detailEn.description,
        descriptionEs: detailEs.description,
        levels: detailEn.levels.map((l, idx) => ({ ...l, effectEs: detailEs.levels[idx]?.effect || l.effect })),
      });
      await new Promise(r => setTimeout(r, 150));
    } catch (e) {
      console.error(`  ERROR: ${e.message}`);
    }
  }

  fs.writeFileSync(path.join(OUT_DIR, 'skills.json'), JSON.stringify(results, null, 2));
  console.log('Done! Saved to wilds_raw/skills.json');
}

main().catch(console.error);