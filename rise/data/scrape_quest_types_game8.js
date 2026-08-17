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
const extraSources = {
  side: 318182,
  request: 324833,
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

function plain(value) {
  return String(value || '').replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/\*\*/g, '')
    .replace(/\s+/g, ' ').trim();
}

function scrapeExtras(markdowns) {
  const extras = [];
  const requestRows = /^\| - \[x\] \| \[([^\]]+)\]\(https?:\/\/game8\.co\/games\/Monster-Hunter-Rise\/archives\/(\d+)\) \| ([^|]+) \|$/gm;
  for (const match of markdowns.request.matchAll(requestRows)) {
    const details = plain(match[3]).replace(/\s*\*\s*/g, ' ');
    const client = details.match(/Client:\s*([^*]+?)(?=\s+Bring|\s+Capture|\s+Deliver|\s+Complete|\s+Get|\s+Forge|\s+Hire|\s+Photograph|\s+Raise|\s+Slay|\s+Take|\s+Discover|\s+Reward|$)/i)?.[1]?.trim() || '';
    const goal = details.replace(/^.*?Client:\s*/i, '').slice(client.length).split(/\s+Rewards?:/i)[0].trim();
    extras.push({id:`request-${match[2]}`,category:'request',nameEn:match[1].trim(),nameEs:match[1].trim(),client,goalCondition:goal,questType:'special',details,detailSource:`https://game8.co/games/Monster-Hunter-Rise/archives/${match[2]}`,mainMonsters:[],keyQuest:false,stars:null});
  }
  const sideSection = markdowns.side.split(/## List of Optional Subquests/i)[1] || '';
  const sideRows = /^\| ([^|]+) \| ([^|]+) \|$/gm;
  let index = 0;
  for (const match of sideSection.matchAll(sideRows)) {
    if (!match[1].trim() || /^-+$/.test(match[1].trim()) || match[1].trim() === 'Subquest') continue;
    index += 1;
    const name = plain(match[1]);
    const condition = plain(match[2]).replace(/\s*\*\s*/g, ' ');
    extras.push({id:`side-${index}`,category:'side',nameEn:name,nameEs:name,client:'Hinoa / Minoto',goalCondition:condition.split('・')[0].trim(),questType:'special',details:condition,detailSource:'https://game8.co/games/Monster-Hunter-Rise/archives/318182',mainMonsters:[],keyQuest:false,stars:null});
  }
  return extras;
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
  const extraMarkdowns = {};
  for (const [type, archive] of Object.entries(extraSources)) {
    const url = `https://r.jina.ai/http://game8.co/games/Monster-Hunter-Rise/archives/${archive}`;
    try { extraMarkdowns[type] = await fetchText(url); } catch (error) { console.warn(`Skipped ${type} extras: ${error.message}`); }
  }
  if (extraMarkdowns.side && extraMarkdowns.request) {
    const extras = scrapeExtras(extraMarkdowns);
    fs.writeFileSync(path.join(root, 'quest_extras.json'), JSON.stringify(extras, null, 2) + '\n', 'utf8');
    console.log(`Saved ${extras.length} side/request records`);
  }
  fs.writeFileSync(path.join(root, 'quest_types.json'), JSON.stringify(overrides, null, 2) + '\n', 'utf8');
  console.log(`Saved ${Object.keys(overrides).length} quest type overrides`);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
