const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, 'wilds_raw');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

async function scrapeMonsterList() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('https://mhwilds.kiranico.com/data/monsters', { waitUntil: 'networkidle' });

  // Wait for table to load
  await page.waitForSelector('table');

  const monsters = await page.evaluate(() => {
    const rows = document.querySelectorAll('table tbody tr');
    return Array.from(rows).map(row => {
      const link = row.querySelector('a');
      if (!link) return null;
      return {
        slug: link.href.split('/').pop(),
        name: link.textContent.trim(),
      };
    }).filter(Boolean);
  });

  await browser.close();
  return monsters;
}

async function main() {
  console.log('Scraping monster list with Playwright...');
  const monsters = await scrapeMonsterList();
  console.log(`Found ${monsters.length} monsters`);

  fs.writeFileSync(path.join(OUT_DIR, 'monsters_kiranico.json'), JSON.stringify(monsters, null, 2));
  console.log('Saved to wilds_raw/monsters_kiranico.json');
}

main().catch(console.error);