const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'vectores');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const IMAGES_DIR = path.join(__dirname, '..', 'data', 'images');
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

async function fetchBuffer(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.arrayBuffer();
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function downloadMonsterRenders() {
  console.log('Fetching Monster Hunter Wiki category page for renders...');
  const url = 'https://monsterhunterwiki.org/wiki/Category:MHWilds_Monster_Renders';
  const html = await (await fetch(url, { headers })).text();

  const fileRegex = /<a href="\/wiki\/File:([^"]+)">([^<]+)<\/a>/g;
  let match;
  const files = [];
  while ((match = fileRegex.exec(html)) !== null) {
    const fileName = match[1].replace(/_/g, ' ');
    if (fileName.includes('Render')) {
      files.push(fileName);
    }
  }

  console.log(`Found ${files.length} render files`);

  for (const fileName of files) {
    const cleanName = fileName.replace('MHWA-', '').replace(' Render 001', '').replace('.webp', '');
    const slug = slugify(cleanName);
    const outPath = path.join(IMAGES_DIR, `${slug}.webp`);

    if (fs.existsSync(outPath)) {
      console.log(`  Skip ${slug} (exists)`);
      continue;
    }

    try {
      const fileUrl = `https://monsterhunterwiki.org/wiki/File:${encodeURIComponent(fileName)}`;
      const fileHtml = await (await fetch(fileUrl, { headers })).text();

      const imgMatch = fileHtml.match(/<a href="([^"]+)" class="internal"[^>]*>.*?<img/);
      let imgUrl = null;
      if (imgMatch) {
        imgUrl = imgMatch[1];
      } else {
        const directMatch = fileHtml.match(/href="([^"]+\.webp)"/);
        if (directMatch) imgUrl = directMatch[1];
      }

      if (!imgUrl) {
        console.log(`  Could not find image URL for ${fileName}`);
        continue;
      }

      if (!imgUrl.startsWith('http')) {
        imgUrl = 'https://monsterhunterwiki.org' + imgUrl;
      }

      const buffer = await fetchBuffer(imgUrl);
      fs.writeFileSync(outPath, Buffer.from(buffer));
      console.log(`  Downloaded ${slug}.webp (${buffer.byteLength} bytes)`);
      await new Promise(r => setTimeout(r, 300));
    } catch (e) {
      console.error(`  ERROR downloading ${fileName}: ${e.message}`);
    }
  }
}

async function downloadMonsterIcons() {
  console.log('Fetching Monster Hunter Wiki category page for icons...');
  const url = 'https://monsterhunterwiki.org/wiki/Category:MHWilds_Monster_Icons';
  const html = await (await fetch(url, { headers })).text();

  const fileRegex = /<a href="\/wiki\/File:([^"]+)">([^<]+)<\/a>/g;
  let match;
  const files = [];
  while ((match = fileRegex.exec(html)) !== null) {
    const fileName = match[1].replace(/_/g, ' ');
    if (fileName.includes('Icon')) {
      files.push(fileName);
    }
  }

  console.log(`Found ${files.length} icon files`);

  for (const fileName of files) {
    const cleanName = fileName.replace('MHWA-', '').replace(' Icon', '').replace('.png', '');
    const slug = slugify(cleanName);
    const outPath = path.join(IMAGES_DIR, `icon-${slug}.png`);

    if (fs.existsSync(outPath)) {
      console.log(`  Skip icon-${slug} (exists)`);
      continue;
    }

    try {
      const fileUrl = `https://monsterhunterwiki.org/wiki/File:${encodeURIComponent(fileName)}`;
      const fileHtml = await (await fetch(fileUrl, { headers })).text();

      let imgUrl = null;
      const imgMatch = fileHtml.match(/<a href="([^"]+)" class="internal"[^>]*>.*?<img/);
      if (imgMatch) {
        imgUrl = imgMatch[1];
      } else {
        const directMatch = fileHtml.match(/href="([^"]+\.png)"/);
        if (directMatch) imgUrl = directMatch[1];
      }

      if (!imgUrl) {
        console.log(`  Could not find image URL for ${fileName}`);
        continue;
      }

      if (!imgUrl.startsWith('http')) {
        imgUrl = 'https://monsterhunterwiki.org' + imgUrl;
      }

      const buffer = await fetchBuffer(imgUrl);
      fs.writeFileSync(outPath, Buffer.from(buffer));
      console.log(`  Downloaded icon-${slug}.png (${buffer.byteLength} bytes)`);
      await new Promise(r => setTimeout(r, 300));
    } catch (e) {
      console.error(`  ERROR downloading ${fileName}: ${e.message}`);
    }
  }
}

async function downloadItemIcons() {
  console.log('Fetching Monster Hunter Wiki category page for item icons...');
  const url = 'https://monsterhunterwiki.org/wiki/Category:MHWilds_Item_Icons';
  const html = await (await fetch(url, { headers })).text();

  const fileRegex = /<a href="\/wiki\/File:([^"]+)">([^<]+)<\/a>/g;
  let match;
  const files = [];
  while ((match = fileRegex.exec(html)) !== null) {
    const fileName = match[1].replace(/_/g, ' ');
    files.push(fileName);
  }

  console.log(`Found ${files.length} item icon files`);

  for (const fileName of files) {
    const cleanName = fileName.replace('MHWA-', '').replace(' Item Icon', '').replace('.png', '');
    const slug = slugify(cleanName);
    const outPath = path.join(IMAGES_DIR, `item-${slug}.png`);

    if (fs.existsSync(outPath)) {
      console.log(`  Skip item-${slug} (exists)`);
      continue;
    }

    try {
      const fileUrl = `https://monsterhunterwiki.org/wiki/File:${encodeURIComponent(fileName)}`;
      const fileHtml = await (await fetch(fileUrl, { headers })).text();

      let imgUrl = null;
      const imgMatch = fileHtml.match(/<a href="([^"]+)" class="internal"[^>]*>.*?<img/);
      if (imgMatch) {
        imgUrl = imgMatch[1];
      } else {
        const directMatch = fileHtml.match(/href="([^"]+\.png)"/);
        if (directMatch) imgUrl = directMatch[1];
      }

      if (!imgUrl) {
        console.log(`  Could not find image URL for ${fileName}`);
        continue;
      }

      if (!imgUrl.startsWith('http')) {
        imgUrl = 'https://monsterhunterwiki.org' + imgUrl;
      }

      const buffer = await fetchBuffer(imgUrl);
      fs.writeFileSync(outPath, Buffer.from(buffer));
      console.log(`  Downloaded item-${slug}.png (${buffer.byteLength} bytes)`);
      await new Promise(r => setTimeout(r, 200));
    } catch (e) {
      console.error(`  ERROR downloading ${fileName}: ${e.message}`);
    }
  }
}

async function main() {
  await downloadMonsterRenders();
  await downloadMonsterIcons();
  await downloadItemIcons();
  console.log('All downloads complete!');
}

main().catch(console.error);