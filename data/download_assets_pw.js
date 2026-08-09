const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, '..', 'data', 'images');
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

async function downloadFile(page, fileUrl, outPath) {
  if (fs.existsSync(outPath)) {
    return { skipped: true };
  }

  try {
    await page.goto(fileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const imgUrl = await page.evaluate(() => {
      const img = document.querySelector('#file img, .fullImageLink a img, .fullMedia a img, a.internal img');
      if (img) return img.src;
      const link = document.querySelector('.fullImageLink a, .fullMedia a, a.internal');
      if (link) return link.href;
      return null;
    });

    if (!imgUrl) {
      return { error: 'No image URL found' };
    }

    const response = await page.request.get(imgUrl);
    if (!response.ok()) {
      return { error: `HTTP ${response.status()}` };
    }

    const buffer = await response.body();
    fs.writeFileSync(outPath, buffer);
    return { success: true, size: buffer.length };
  } catch (e) {
    return { error: e.message };
  }
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function downloadRenders(page) {
  console.log('=== Downloading Renders ===');
  const urls = [
    'Ajarakan', 'Arkveld', 'Balahara', 'Baunos', 'Blango', 'Blangonga', 'Bulaqchi', 'Ceratonoth',
    'Chatacabra', 'Comaqchi', 'Conga', 'Congalala', 'Dalthydon', 'Doshaguma', 'Gajios', 'Gelidron',
    'Gogmazios', 'Gore_Magala', 'Gravios', 'Guardian_Arkveld', 'Guardian_Doshaguma',
    'Guardian_Ebony_Odogaron', 'Guardian_Fulgur_Anjanath', 'Guardian_Rathalos', 'Guardian_Seikret',
    'Gypceros', 'Harpios', 'Hirabami', 'Jin_Dahaad', 'Kranodath', 'Lagiacrus', 'Lala_Barina',
    'Mizutsune', 'Nerscylla', 'Nerscylla_Clone', 'Nerscylla_Hatchling', 'Nu_Udra',
    'Omega_Micros', 'Omega_Planetes', 'Piragill', 'Porkeplume', 'Quematrice', 'Rafma',
    'Rathalos', 'Rathian', 'Rey_Dau', 'Rompopolo', 'Seikret', 'Seregios', 'Talioth',
    'Uth_Duna', 'Vespoid', 'Wudwud', 'Xu_Wu', 'Yian_Kut-Ku', 'Zoh_Shia'
  ];

  for (const name of urls) {
    const fileName = `MHWA-${name}_Render_001.webp`;
    const fileUrl = `https://monsterhunterwiki.org/wiki/File:${fileName}`;
    const slug = slugify(name.replace(/_/g, ' '));
    const outPath = path.join(IMAGES_DIR, `${slug}.webp`);

    const result = await downloadFile(page, fileUrl, outPath);
    if (result.success) {
      console.log(`  Downloaded ${slug}.webp (${result.size} bytes)`);
    } else if (result.skipped) {
      console.log(`  Skipped ${slug}.webp (exists)`);
    } else {
      console.log(`  Failed ${slug}.webp: ${result.error}`);
    }
    await new Promise(r => setTimeout(r, 300));
  }
}

async function downloadMonsterIcons(page) {
  console.log('=== Downloading Monster Icons ===');
  const urls = [
    'Ajarakan', 'Alpha_Doshaguma', 'Arkveld', 'Balahara', 'Baunos', 'Blango', 'Blangonga',
    'Bulaqchi', 'Ceratonoth', 'Ceratonoth_Female', 'Chatacabra', 'Comaqchi', 'Conga',
    'Congalala', 'Dalthydon', 'Doshaguma', 'Gajios', 'Gelidron', 'Gogmazios', 'Gore_Magala',
    'Gravios', 'Guardian_Arkveld', 'Guardian_Doshaguma', 'Guardian_Ebony_Odogaron',
    'Guardian_Fulgur_Anjanath', 'Guardian_Rathalos', 'Guardian_Seikret', 'Gypceros',
    'Harpios', 'Hirabami', 'Jin_Dahaad', 'Kranodath', 'Lagiacrus', 'Lala_Barina', 'Mizutsune',
    'Nerscylla', 'Nerscylla_Hatchling', 'Nu_Udra', 'Omega_Micros', 'Omega_Planetes',
    'Piragill', 'Porkeplume', 'Quematrice', 'Question_Mark', 'Rafma', 'Rathalos', 'Rathian',
    'Rey_Dau', 'Rompopolo', 'Seregios', 'Talioth', 'Uth_Duna', 'Vespoid', 'Xu_Wu',
    'Yian_Kut-Ku', 'Zoh_Shia'
  ];

  for (const name of urls) {
    const ext = name === 'Ceratonoth_Female' || name === 'Question_Mark' ? 'png' : 'webp';
    const fileName = `MHWA-${name}_Icon.${ext}`;
    const fileUrl = `https://monsterhunterwiki.org/wiki/File:${fileName}`;
    const slug = slugify(name.replace(/_/g, ' '));
    const outPath = path.join(IMAGES_DIR, `icon-${slug}.${ext}`);

    const result = await downloadFile(page, fileUrl, outPath);
    if (result.success) {
      console.log(`  Downloaded icon-${slug}.${ext} (${result.size} bytes)`);
    } else if (result.skipped) {
      console.log(`  Skipped icon-${slug}.${ext} (exists)`);
    } else {
      console.log(`  Failed icon-${slug}.${ext}: ${result.error}`);
    }
    await new Promise(r => setTimeout(r, 200));
  }
}

async function downloadItemIcons(page) {
  console.log('=== Downloading Item Icons (sample) ===');
  // Download a representative sample of item icons
  const categories = [
    'Armor_Sphere', 'Bait', 'Ball', 'Ball-Guild', 'Ball-Special', 'Barrel', 'Berry',
    'Bomb', 'Bone', 'Bug', 'Canteen', 'Coin', 'Crystal', 'Deco', 'Dung', 'Egg',
    'Essence', 'Feather', 'Fish', 'Flower', 'Fruit', 'Gem', 'Herb', 'Honey',
    'Insect', 'Jewel', 'Meat', 'Medicine', 'Metal', 'Mushroom', 'Nut', 'Ore',
    'Pelt', 'Potion', 'Powder', 'Scale', 'Seed', 'Shell', 'Slinger', 'Stone',
    'Tooth', 'Whetstone'
  ];

  for (const cat of categories) {
    const fileName = `MHWilds-${cat}_Icon_Base.webp`;
    const fileUrl = `https://monsterhunterwiki.org/wiki/File:${fileName}`;
    const slug = slugify(cat.replace(/_/g, ' '));
    const outPath = path.join(IMAGES_DIR, `item-${slug}.webp`);

    const result = await downloadFile(page, fileUrl, outPath);
    if (result.success) {
      console.log(`  Downloaded item-${slug}.webp (${result.size} bytes)`);
    } else if (result.skipped) {
      console.log(`  Skipped item-${slug}.webp (exists)`);
    } else {
      // Try .png
      const pngFileName = `MHWilds-${cat}_Icon_Base.png`;
      const pngFileUrl = `https://monsterhunterwiki.org/wiki/File:${pngFileName}`;
      const pngOutPath = path.join(IMAGES_DIR, `item-${slug}.png`);
      const pngResult = await downloadFile(page, pngFileUrl, pngOutPath);
      if (pngResult.success) {
        console.log(`  Downloaded item-${slug}.png (${pngResult.size} bytes)`);
      } else if (pngResult.skipped) {
        console.log(`  Skipped item-${slug}.png (exists)`);
      } else {
        console.log(`  Failed item-${slug}: ${result.error}`);
      }
    }
    await new Promise(r => setTimeout(r, 200));
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.setExtraHTTPHeaders({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  });

  await downloadRenders(page);
  await downloadMonsterIcons(page);
  await downloadItemIcons(page);

  await browser.close();
  console.log('All downloads complete!');
}

main().catch(console.error);