// Scrape skill levels from Kiranico detail pages via Playwright.
// Reads existing skills.json (177 skills), visits each detail page,
// extracts level data, and updates skills.json.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = __dirname;
const RAW = path.join(OUT, 'skills_raw');
if (!fs.existsSync(RAW)) fs.mkdirSync(RAW, { recursive: true });

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0';

function parseSkillLevels(html) {
  const levels = [];
  const doc = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  // Pattern: Lv1 ... description ... Lv2 ... description ...
  // Levels look like: "Lv1 100/3 Attack +3 Lv2 100/5 Attack +5"
  const re = /Lv\s*(\d+)\s+(.*?)(?=Lv\s*\d+\s|$)/gi;
  let m;
  while ((m = re.exec(doc))) {
    const level = parseInt(m[1]);
    const desc = m[2].trim();
    if (desc && !/Monster Hunter|Database|Toggle|English|Mission List/i.test(desc)) {
      levels.push({ level, descEn: desc, descEs: '' });
    }
  }
  return levels;
}

async function main() {
  const skills = JSON.parse(fs.readFileSync(path.join(OUT, 'skills.json'), 'utf8'));
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  let done = 0, withLevels = 0;

  for (const skill of skills) {
    const rawFile = path.join(RAW, skill.id + '.html');
    let html;
    if (fs.existsSync(rawFile)) {
      html = fs.readFileSync(rawFile, 'utf8');
    } else {
      try {
        await page.goto('https://mhwilds.kiranico.com/data/skills/' + skill.id, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(800);
        html = await page.content();
        fs.writeFileSync(rawFile, html);
      } catch (e) {
        console.log('  ERR', skill.name, e.message);
        continue;
      }
    }
    const levels = parseSkillLevels(html);
    if (levels.length) {
      skill.levels = levels;
      withLevels++;
    }
    done++;
    if (done % 30 === 0) console.log('  ' + done + '/' + skills.length, '| con niveles:', withLevels);
  }

  await browser.close();
  fs.writeFileSync(path.join(OUT, 'skills.json'), JSON.stringify(skills, null, 1));
  console.log('Done!', done, 'skills,', withLevels, 'con niveles');
}

main().catch(e => { console.error(e); process.exit(1); });
