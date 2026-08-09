const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, 'wilds_raw');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const BASE = 'https://mhwilds.kiranico.com';

async function safeGoto(page, url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      return true;
    } catch (e) {
      console.log(`    Retry ${i+1}/${retries} for ${url}: ${e.message}`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  return false;
}

async function scrapeList(page, url, selectors = ['table tbody tr', 'table tr', '[data-testid="table"] tr']) {
  const ok = await safeGoto(page, url);
  if (!ok) return [];

  for (const selector of selectors) {
    try {
      await page.waitForSelector(selector, { timeout: 15000 });
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
    } catch (e) {
      // try next selector
    }
  }
  console.log(`    WARNING: No table found for ${url}`);
  return [];
}

async function scrapeDetail(page, url) {
  const ok = await safeGoto(page, url);
  if (!ok) return { error: 'Failed to load page' };

  try {
    await page.waitForSelector('h2', { timeout: 15000 });
  } catch (e) {
    // continue anyway
  }

  return await page.evaluate(() => {
    const data = { name: '', description: '', stats: {} };

    const h2 = document.querySelector('h2');
    if (h2) data.name = h2.textContent.trim();

    const blockquote = document.querySelector('blockquote');
    if (blockquote) data.description = blockquote.textContent.trim();

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

async function scrapeCategory(page, name, listUrl, detailBaseUrl, delay = 200) {
  const fileName = `${name.toLowerCase()}_pw.json`;
  const filePath = path.join(OUT_DIR, fileName);

  let results = [];
  if (fs.existsSync(filePath)) {
    results = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    console.log(`Loaded ${results.length} existing ${name.toLowerCase()}`);
  }

  const alreadyScraped = new Set(results.map(r => r.slug));

  console.log(`=== Scraping ${name} ===`);
  const items = await scrapeList(page, listUrl);
  console.log(`Found ${items.length} ${name.toLowerCase()}`);

  const toScrape = items.filter(item => !alreadyScraped.has(item.slug));
  console.log(`Scraping ${toScrape.length} new ${name.toLowerCase()}...`);

  for (let i = 0; i < toScrape.length; i++) {
    const item = toScrape[i];
    console.log(`  [${i+1}/${toScrape.length}] ${item.name}`);
    try {
      const detail = await scrapeDetail(page, `${detailBaseUrl}/${item.slug}`);
      results.push({ ...item, ...detail });
    } catch (e) {
      console.log(`    ERROR: ${e.message}`);
      results.push({ ...item, error: e.message });
    }
    if ((i + 1) % 10 === 0 || i === toScrape.length - 1) {
      fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
    }
    await new Promise(r => setTimeout(r, delay));
  }

  fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
  console.log(`Total ${name}: ${results.length}`);
  return results;
}

async function scrapeWeapons(page) {
  const fileName = 'weapons_pw.json';
  const filePath = path.join(OUT_DIR, fileName);

  let allWeapons = [];
  if (fs.existsSync(filePath)) {
    allWeapons = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    console.log(`Loaded ${allWeapons.length} existing weapons`);
  }

  const alreadyScraped = new Set(allWeapons.map(w => w.slug));
  const types = [
    'great-sword', 'long-sword', 'sword-and-shield', 'dual-blades', 'hammer',
    'hunting-horn', 'lance', 'gunlance', 'switch-axe', 'charge-blade',
    'insect-glaive', 'light-bowgun', 'heavy-bowgun', 'bow'
  ];

  for (const type of types) {
    const listUrl = `${BASE}/data/weapons/${type}`;
    const items = await scrapeList(page, listUrl, ['table tbody tr', 'table tr']);
    const toScrape = items.filter(item => !alreadyScraped.has(item.slug));

    console.log(`  [${type}] ${toScrape.length} new weapons`);

    for (let i = 0; i < toScrape.length; i++) {
      const item = toScrape[i];
      console.log(`    [${i+1}/${toScrape.length}] ${item.name}`);
      try {
        const detail = await scrapeDetail(page, `${BASE}/data/weapons/${item.slug}`);
        allWeapons.push({ ...item, type, ...detail });
        alreadyScraped.add(item.slug);
      } catch (e) {
        console.log(`      ERROR: ${e.message}`);
        allWeapons.push({ ...item, type, error: e.message });
      }
      if ((i + 1) % 20 === 0 || i === toScrape.length - 1) {
        fs.writeFileSync(filePath, JSON.stringify(allWeapons, null, 2));
      }
      await new Promise(r => setTimeout(r, 150));
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(allWeapons, null, 2));
  console.log(`Total weapons: ${allWeapons.length}`);
  return allWeapons;
}

async function scrapeArmor(page) {
  const fileName = 'armor_pw.json';
  const filePath = path.join(OUT_DIR, fileName);

  let allArmor = [];
  if (fs.existsSync(filePath)) {
    allArmor = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    console.log(`Loaded ${allArmor.length} existing armor pieces`);
  }

  const alreadyScraped = new Set(allArmor.map(a => a.slug));

  for (let rarity = 1; rarity <= 10; rarity++) {
    const listUrl = `${BASE}/data/armor?rarity=${rarity}`;
    const items = await scrapeList(page, listUrl, ['table tbody tr', 'table tr']);
    const toScrape = items.filter(item => !alreadyScraped.has(item.slug));

    console.log(`  [Rarity ${rarity}] ${toScrape.length} new pieces`);

    for (let i = 0; i < toScrape.length; i++) {
      const item = toScrape[i];
      console.log(`    [${i+1}/${toScrape.length}] ${item.name}`);
      try {
        const detail = await scrapeDetail(page, `${BASE}/data/armor/${item.slug}`);
        allArmor.push({ ...item, rarity, ...detail });
        alreadyScraped.add(item.slug);
      } catch (e) {
        console.log(`      ERROR: ${e.message}`);
        allArmor.push({ ...item, rarity, error: e.message });
      }
      if ((i + 1) % 20 === 0 || i === toScrape.length - 1) {
        fs.writeFileSync(filePath, JSON.stringify(allArmor, null, 2));
      }
      await new Promise(r => setTimeout(r, 150));
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(allArmor, null, 2));
  console.log(`Total armor pieces: ${allArmor.length}`);
  return allArmor;
}

async function scrapeItems(page) {
  const fileName = 'items_pw.json';
  const filePath = path.join(OUT_DIR, fileName);

  let allItems = new Map();
  if (fs.existsSync(filePath)) {
    const existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    existing.forEach(item => allItems.set(item.slug, item));
    console.log(`Loaded ${allItems.size} existing items`);
  }

  const views = ['material', 'consume', 'scrap', 'mystery', 'hub', 'village', 'decoration', 'ammo', 'coating', 'other'];

  for (const view of views) {
    const listUrl = `${BASE}/data/items?view=${view}`;
    const items = await scrapeList(page, listUrl, ['table tbody tr', 'table tr']);
    const toScrape = items.filter(item => !allItems.has(item.slug));

    console.log(`  [${view}] ${toScrape.length} new items`);

    for (let i = 0; i < toScrape.length; i++) {
      const item = toScrape[i];
      console.log(`    [${i+1}/${toScrape.length}] ${item.name}`);
      try {
        const detail = await scrapeDetail(page, `${BASE}/data/items/${item.slug}`);
        allItems.set(item.slug, { ...item, ...detail, category: view });
      } catch (e) {
        console.log(`      ERROR: ${e.message}`);
        allItems.set(item.slug, { ...item, category: view, error: e.message });
      }
      if ((i + 1) % 20 === 0 || i === toScrape.length - 1) {
        fs.writeFileSync(filePath, JSON.stringify(Array.from(allItems.values()), null, 2));
      }
      await new Promise(r => setTimeout(r, 100));
    }
  }

  const results = Array.from(allItems.values());
  fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
  console.log(`Total items: ${results.length}`);
  return results;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.setExtraHTTPHeaders({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  // Decorations (full)
  await scrapeCategory(page, 'Decorations', `${BASE}/data/decorations`, `${BASE}/data/decorations`, 150);

  // Skills (full)
  await scrapeCategory(page, 'Skills', `${BASE}/data/skills`, `${BASE}/data/skills`, 200);

  // Weapons
  await scrapeWeapons(page);

  // Armor
  await scrapeArmor(page);

  // Charms
  await scrapeCategory(page, 'Charms', `${BASE}/data/charms`, `${BASE}/data/charms`, 200);

  // Items
  await scrapeItems(page);

  await browser.close();
  console.log('All done!');
}

main().catch(console.error);