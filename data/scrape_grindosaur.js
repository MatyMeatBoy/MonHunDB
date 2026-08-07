// One-off deterministic scraper for grindosaur.com hitzone (Physiology) and
// ailment-buildup (Ailment Effectiveness) data. No LLM involved — pure HTML parsing.
const fs = require("fs");
const path = require("path");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const DATA_DIR = __dirname;
const monsterList = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "monster_list.json"), "utf8"));
const grindLinks = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "grindosaur_links_raw.json"), "utf8"));

const urlByName = new Map(grindLinks.map(x => [x.text, x.url]));

function stripTags(s) {
  return s.replace(/<[^>]+>/g, "").trim();
}

function extractBetween(html, startMarker, endMarker, fromIndex = 0) {
  const start = html.indexOf(startMarker, fromIndex);
  if (start === -1) return null;
  const end = html.indexOf(endMarker, start);
  if (end === -1) return null;
  return { text: html.slice(start, end), start, end };
}

function parsePhysiology(html) {
  const anchorIdx = html.indexOf('id="physiology"');
  if (anchorIdx === -1) return null;
  const tableStart = html.indexOf("<table", anchorIdx);
  const tableEnd = html.indexOf("</table>", tableStart);
  if (tableStart === -1 || tableEnd === -1) return null;
  const tableHtml = html.slice(tableStart, tableEnd + "</table>".length);

  const theadMatch = tableHtml.match(/<thead>([\s\S]*?)<\/thead>/);
  const headers = theadMatch
    ? [...theadMatch[1].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map(m => stripTags(m[1]))
    : [];

  const tbodyMatch = tableHtml.match(/<tbody>([\s\S]*?)<\/tbody>/);
  const rows = [];
  if (tbodyMatch) {
    const rowMatches = [...tbodyMatch[1].matchAll(/<tr>([\s\S]*?)<\/tr>/g)];
    for (const rm of rowMatches) {
      const cells = [...rm[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(m => stripTags(m[1]));
      if (cells.length) rows.push(cells);
    }
  }
  return { headers, rows };
}

function parseAilmentEffectiveness(html) {
  const anchorIdx = html.indexOf('id="ailment-effectiveness"');
  if (anchorIdx === -1) return [];
  const sectionEnd = html.indexOf('id="quests"', anchorIdx);
  const section = html.slice(anchorIdx, sectionEnd === -1 ? anchorIdx + 20000 : sectionEnd);

  const tabButtons = [...section.matchAll(/onclick="tabToggle\('([a-z]+)'\)">([A-Za-z ]+) \((\d)<i/g)]
    .map(m => ({ key: m[1], label: m[2].trim(), stars: Number(m[3]) }));

  const wrapperIndices = [...section.matchAll(/<div class="tab__target__wrapper[^"]*" id="([a-z]+)">/g)]
    .map(m => ({ key: m[1], idx: m.index }));

  const metricsByKey = {};
  for (let i = 0; i < wrapperIndices.length; i++) {
    const { key, idx } = wrapperIndices[i];
    const nextIdx = i + 1 < wrapperIndices.length ? wrapperIndices[i + 1].idx : section.length;
    const block = section.slice(idx, nextIdx);
    const rows = [...block.matchAll(/<label[^>]*>([^<]+)<\/label>[\s\S]*?aria-valuenow="(\d+)" aria-valuemin="0" aria-valuemax="(\d+)"/g)];
    metricsByKey[key] = rows.map(r => ({
      label: r[1].trim(),
      value: Number(r[2]),
      max: Number(r[3]),
    }));
  }

  return tabButtons.map(b => ({ ...b, buildup: metricsByKey[b.key] || [] }));
}

async function scrapeOne(name, url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${name}`);
  const html = await res.text();
  const physiology = parsePhysiology(html);
  const ailmentEffectiveness = parseAilmentEffectiveness(html);
  return { name, url, physiology, ailmentEffectiveness };
}

async function main() {
  const results = [];
  const errors = [];
  let i = 0;
  for (const m of monsterList) {
    i++;
    const url = urlByName.get(m.name);
    if (!url) {
      errors.push({ name: m.name, error: "no grindosaur URL found" });
      continue;
    }
    try {
      const r = await scrapeOne(m.name, url);
      if (!r.physiology || !r.physiology.rows.length) {
        errors.push({ name: m.name, error: "no physiology table parsed" });
      }
      results.push(r);
      console.log(`[${i}/${monsterList.length}] OK ${m.name} (${r.physiology ? r.physiology.rows.length : 0} parts, ${r.ailmentEffectiveness.length} ailments)`);
    } catch (e) {
      errors.push({ name: m.name, error: String(e) });
      console.log(`[${i}/${monsterList.length}] FAIL ${m.name}: ${e}`);
    }
    await new Promise(r => setTimeout(r, 250));
  }
  fs.writeFileSync(path.join(DATA_DIR, "grindosaur_raw.json"), JSON.stringify(results, null, 2));
  fs.writeFileSync(path.join(DATA_DIR, "grindosaur_errors.json"), JSON.stringify(errors, null, 2));
  console.log(`\nDone. ${results.length} scraped, ${errors.length} errors.`);
}

main();
