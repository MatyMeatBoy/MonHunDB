const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, 'wilds_raw');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const BASE = 'https://mhwilds.kiranico.com';

async function scrapeList(page, url, selector = 'table tbody tr') {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForSelector('table');

  return await page.evaluate((sel) => {
    const rows = document.querySelectorAll(sel);
    return Array.from(rows).map(row => {
      const link = row.querySelector('a');
      if (!link) return null;
      const href = link.href;
      const slug = href.split('/').pop();
      return { slug, name: link.textContent.trim() };
    }).filter(Boolean);
  }, selector);
}

async function scrapeDetail(page, url) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForSelector('h2');

  return await page.evaluate(() => {
    const data = { name: '', description: '', skills: [], materials: [], stats: {} };

    const h2 = document.querySelector('h2');
    if (h2) data.name = h2.textContent.trim();

    const blockquote = document.querySelector('blockquote');
    if (blockquote) data.description = blockquote.textContent.trim();

    // Try to find tables and extract data
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
      const rows = table.querySelectorAll('tr');
      rows.forEach(row => {
        const cells = row.querySelectorAll('td, th');
        if (cells.length >= 2) {
          const key = cells[0].textContent.trim();
          const value = cells[1].textContent.trim();
          data.stats[key] = value;
        }
      });
    });

    return data;
  });
}

async function scrapeDecorations(page) {
  const lang = 'en';
  const listUrl = `${BASE}/data/decorations`;
  const items = await scrapeList(page, listUrl);

  const results = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    console.log(`  [${i+1}/${items.length}] ${item.name}`);
    const detail = await scrapeDetail(page, `${BASE}/data/decorations/${item.slug}`);
    results.push({ ...item, ...detail });
    await new Promise(r => setTimeout(r, 200));
  }
  return results;
}

async function scrapeSkills(page) {
  const listUrl = `${BASE}/data/skills`;
  const items = await scrapeList(page, listUrl);

  const results = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    console.log(`  [${i+1}/${items.length}] ${item.name}`);
    const detail = await scrapeDetail(page, `${BASE}/data/skills/${item.slug}`);
    results.push({ ...item, ...detail });
    await new Promise(r => setTimeout(r, 200));
  }
  return results;
}

async function scrapeWeapons(page) {
  const types = [
    'great-sword', 'long-sword', 'sword-and-shield', 'dual-blades', 'hammer',
    'hunting-horn', 'lance', 'gunlance', 'switch-axe', 'charge-blade',
    'insect-glaive', 'light-bowgun', 'heavy-bowgun', 'bow'
  ];

  const allWeapons = [];
  for (const type of types) {
    const listUrl = `${BASE}/data/weapons/${type}`;
    const items = await scrapeList(page, listUrl);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      console.log(`  [${type}] ${i+1}/${items.length} ${item.name}`);
      const detail = await scrapeDetail(page, `${BASE}/data/weapons/${item.slug}`);
      allWeapons.push({ ...item, type, ...detail });
      await new Promise(r => setTimeout(r, 150));
    }
  }
  return allWeapons;
}

async function scrapeArmor(page) {
  const allArmor = [];
  for (let rarity = 1; rarity <= 10; rarity++) {
    const listUrl = `${BASE}/data/armor?rarity=${rarity}`;
    const items = await scrapeList(page, listUrl);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      console.log(`  [Rarity ${rarity}] ${i+1}/${items.length} ${item.name}`);
      const detail = await scrapeDetail(page, `${BASE}/data/armor/${item.slug}`);
      allArmor.push({ ...item, rarity, ...detail });
      await new Promise(r => setTimeout(r, 150));
    }
  }
  return allArmor;
}

async function scrapeCharms(page) {
  const listUrl = `${BASE}/data/charms`;
  const items = await scrapeList(page, listUrl);

  const results = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    console.log(`  [${i+1}/${items.length}] ${item.name}`);
    const detail = await scrapeDetail(page, `${BASE}/data/charms/${item.slug}`);
    results.push({ ...item, ...detail });
    await new Promise(r => setTimeout(r, 200));
  }
  return results;
}

async function scrapeItems(page) {
  const views = ['material', 'consume', 'scrap', 'mystery', 'hub', 'village', 'decoration', 'ammo', 'coating', 'other'];
  const allItems = new Map();

  for (const view of views) {
    const listUrl = `${BASE}/data/items?view=${view}`;
    const items = await scrapeList(page, listUrl);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (allItems.has(item.slug)) continue;
      console.log(`  [${view}] ${i+1}/${items.length} ${item.name}`);
      const detail = await scrapeDetail(page, `${BASE}/data/items/${item.slug}`);
      allItems.set(item.slug, { ...item, ...detail, category: view });
      await new Promise(r => setTimeout(r, 100));
    }
  }
  return Array.from(allItems.values());
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Set user agent
  await page.setExtraHTTPHeaders({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  console.log('=== Scraping Decorations ===');
  const decorations = await scrapeDecorations(page);
  fs.writeFileSync(path.join(OUT_DIR, 'decorations_pw.json'), JSON.stringify(decorations, null, 2));
  console.log(`Saved ${decorations.length} decorations`);

  console.log('=== Scraping Skills ===');
  const skills = await scrapeSkills(page);
  fs.writeFileSync(path.join(OUT_DIR, 'skills_pw.json'), JSON.stringify(skills, null, 2));
  console.log(`Saved ${skills.length} skills`);

  console.log('=== Scraping Weapons ===');
  const weapons = await scrapeWeapons(page);
  fs.writeFileSync(path.join(OUT_DIR, 'weapons_pw.json'), JSON.stringify(weapons, null, 2));
  console.log(`Saved ${weapons.length} weapons`);

  console.log('=== Scraping Armor ===');
  const armor = await scrapeArmor(page);
  fs.writeFileSync(path.join(OUT_DIR, 'armor_pw.json'), JSON.stringify(armor, null, 2));
  console.log(`Saved ${armor.length} armor pieces`);

  console.log('=== Scraping Charms ===');
  const charms = await scrapeCharms(page);
  fs.writeFileSync(path.join(OUT_DIR, 'charms_pw.json'), JSON.stringify(charms, null, 2));
  console.log(`Saved ${charms.length} charms`);

  console.log('=== Scraping Items ===');
  const items = await scrapeItems(page);
  fs.writeFileSync(path.join(OUT_DIR, 'items_pw.json'), JSON.stringify(items, null, 2));
  console.log(`Saved ${items.length} items`);

  await browser.close();
  console.log('All done!');
}

main().catch(console.error);