// One-off: re-scrape a single monster fresh (fixes a bad cached HTML).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT_DIR = __dirname;
const RAW_DIR = path.join(OUT_DIR, 'monsters_raw');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

async function main() {
  const slugs = process.argv.slice(2);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ userAgent: UA, viewport: { width: 1366, height: 900 } });
  try {
    const all = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'monsters.json'), 'utf8'));
    for (const slug of slugs) {
      const mon = { slug, href: 'https://mhwilds.kiranico.com/data/monsters/' + slug };
      console.log('fetching', slug);
      await page.goto(mon.href, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(1500);
      const html = await page.content();
      fs.writeFileSync(path.join(RAW_DIR, slug + '.html'), html);
      console.log('saved raw, len', html.length, '| tables:', (html.match(/<table/g)||[]).length);
    }
  } finally {
    await browser.close();
  }
}
main().catch(e => { console.error(e); process.exit(1); });
