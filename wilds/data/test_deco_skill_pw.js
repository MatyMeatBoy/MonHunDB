// Quick test: scrape a decoration detail + skill detail from Kiranico via Playwright
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function go() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });

  // Decoration detail
  await page.goto('https://mhwilds.kiranico.com/data/decorations/attack-jewel-1', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);
  const decoHtml = await page.content();
  fs.writeFileSync(path.join(__dirname, 'deco_detail_rendered.html'), decoHtml);

  const decoData = await page.evaluate(() => {
    const text = document.body.textContent.replace(/\s+/g, ' ').trim();
    return { text: text.slice(0, 500), hasItems: !!document.querySelector('[href*="/data/items/"]'), hasMaterials: /material/i.test(text) };
  });
  console.log('DECO:', JSON.stringify(decoData));

  // Skill detail
  await page.goto('https://mhwilds.kiranico.com/data/skills/attack-boost', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);
  const skillHtml = await page.content();
  fs.writeFileSync(path.join(__dirname, 'skill_detail_rendered.html'), skillHtml);

  const skillData = await page.evaluate(() => {
    const text = document.body.textContent.replace(/\s+/g, ' ').trim();
    // find Lv1, Lv2 etc
    const levels = [...text.matchAll(/Lv\s*\d+\s*([\s\S]*?)(?=Lv\s*\d+|$)/gi)];
    return { text: text.slice(0, 800), levelCount: levels.length };
  });
  console.log('SKILL:', JSON.stringify(skillData));

  await browser.close();
}
go();
