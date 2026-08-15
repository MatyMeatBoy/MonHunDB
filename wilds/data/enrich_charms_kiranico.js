// Enrich the Wilds charm catalog with the skill, level and effect shown on
// each Kiranico detail page. The existing charm names/materials are preserved.
const fs = require("fs");
const path = require("path");
const DATA = __dirname;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36";

function decode(s) {
  return s.replace(/\\"/g, '"').replace(/\\\\/g, "\\").replace(/&amp;/g, "&").replace(/&#39;/g, "'");
}

function parseSkill(html, locale) {
  const t = decode(html);
  const href = t.match(/"en":"\/data\/skills\/([^"\\]+)"/);
  if (!href) return null;
  const marker = `"en":"/data/skills/${href[1]}"`;
  const start = t.indexOf(marker);
  const chunk = t.slice(start + marker.length, start + 5000);
  const level = chunk.match(/"children":"Lv(\d+)"/);
  if (!level) return null;
  const field = locale === "es-419" ? "es-419" : "en";
  const name = chunk.match(new RegExp(`"${field}":"([^"\\\\]+)"`));
  const afterLevel = chunk.slice(level.index);
  const effect = afterLevel.match(new RegExp(`"${field}":"([^"\\\\]+)"`));
  if (!name || !effect) return null;
  return { slug: href[1], name: name[1], level: Number(level[1]), effect: effect[1] };
}

async function fetchOne(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (res.ok) return await res.text();
    } catch {}
    await new Promise(r => setTimeout(r, 300 * (attempt + 1)));
  }
  return "";
}

async function main() {
  const charms = JSON.parse(fs.readFileSync(path.join(DATA, "charms.json"), "utf8"));
  const skills = JSON.parse(fs.readFileSync(path.join(DATA, "skills.json"), "utf8"));
  const skillByName = new Map(skills.map(s => [s.name, s]));
  let done = 0;
  for (let i = 0; i < charms.length; i += 8) {
    const batch = charms.slice(i, i + 8);
    await Promise.all(batch.map(async charm => {
      const enHtml = await fetchOne(`https://mhwilds.kiranico.com/data/charms/${charm.id}`);
      const esHtml = await fetchOne(`https://mhwilds.kiranico.com/es-419/data/charms/${charm.id}`);
      const en = parseSkill(enHtml, "en");
      const es = parseSkill(esHtml, "es-419");
      if (en) {
        const skill = skillByName.get(en.name);
        const levelData = skill?.levels?.find(l => l.level === en.level);
        charm.skills = [{
          name: en.name,
          nameEs: skill?.nameEs || es?.name || en.name,
          level: en.level,
          effect: en.effect,
          effectEs: levelData?.descEs || es?.effect || en.effect,
        }];
        done++;
      }
    }));
    console.log(`Enriched ${Math.min(i + 8, charms.length)}/${charms.length}`);
  }
  fs.writeFileSync(path.join(DATA, "charms.json"), JSON.stringify(charms, null, 2));
  console.log(`Enriched ${done}/${charms.length} charms.`);
}

main().catch(err => { console.error(err); process.exitCode = 1; });
