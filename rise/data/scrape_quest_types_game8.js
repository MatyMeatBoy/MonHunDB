const fs = require('fs');
const path = require('path');

// Game8's overview pages are fetched through Jina's read-only text mirror so
// the scraper remains resumable and does not depend on the site's JS shell.
const sources = {
  urgent: 324794,
  collaboration: 318322,
  challenge: 333682,
  anomaly: 381480,
  follower: 377082,
  support: 382188,
  event: 329514,
};
const root = __dirname;
const quests = JSON.parse(fs.readFileSync(path.join(root, 'quests.json'), 'utf8'));
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9 ]/gi, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
const byName = new Map(quests.map(q => [normalize(q.nameEn), q]));
const cleanTitle = value => String(value || '')
  .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
  .replace(/\s+Guide\s*$/i, '')
  .trim();

function sourceScope(type, markdown) {
  const headings = {
    urgent: /## List of (?:Sunbreak|Base Game) Urgent Quests[\s\S]*?(?=\n## |$)/gi,
    event: /## List of Event Quests[\s\S]*?(?=\n## |$)/gi,
    anomaly: /## List of Anomaly Quests[\s\S]*?(?=\n## |$)/gi,
  };
  const matcher = headings[type];
  if (!matcher) return markdown;
  return [...markdown.matchAll(matcher)].map(match => match[0]).join('\n');
}
const overrides = {};

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.text();
}

async function main() {
  for (const [type, archive] of Object.entries(sources)) {
    const url = `https://r.jina.ai/http://game8.co/games/Monster-Hunter-Rise/archives/${archive}`;
    let markdown;
    try { markdown = await fetchText(url); } catch (error) {
      console.warn(`Skipped ${type}: ${error.message}`);
      continue;
    }
    const scopedMarkdown = sourceScope(type, markdown);
    const links = scopedMarkdown.matchAll(/\[([^\]]+)\]\(https?:\/\/game8\.co\/games\/Monster-Hunter-Rise\/archives\/\d+\)/g);
    let matched = 0;
    for (const match of links) {
      const quest = byName.get(normalize(cleanTitle(match[1])));
      if (!quest) continue;
      // More specific systems must win over their broader source page.
      const priority = {event: 1, follower: 2, challenge: 3, anomaly: 4, urgent: 5, collaboration: 6, support: 7};
      const current = overrides[quest.id];
      if (!current || priority[type] > priority[current]) {
        overrides[quest.id] = type;
        matched++;
      }
    }
    console.log(`${type}: ${matched} mapped quests`);
  }
  fs.writeFileSync(path.join(root, 'quest_types.json'), JSON.stringify(overrides, null, 2) + '\n', 'utf8');
  console.log(`Saved ${Object.keys(overrides).length} quest type overrides`);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
