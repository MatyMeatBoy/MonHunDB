// Adds the fields the in-site quest UI needs: English identifiers, target
// monsters, quest type, location and verified key-quest flags.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const root = __dirname;
const questFile = path.join(root, 'quests.json');
const views = ['event','mystery','follower','hub_master','hub_high','hub_low','village','arena','training'];
const keySources = [
  'https://game8.co/games/Monster-Hunter-Rise/archives/317139',
  'https://game8.co/games/Monster-Hunter-Rise/archives/401477',
  'https://game8.co/games/Monster-Hunter-Rise/archives/317081',
];
const decode = s => s.replace(/&amp;/g, '&').replace(/&#039;|&#x27;/g, "'").replace(/&quot;/g, '"').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
async function fetchText(url) { const r = await fetch(url); if (!r.ok) throw new Error(`${r.status}: ${url}`); return r.text(); }
async function englishNames() {
  const names = new Map();
  for (const view of views) {
    const html = await fetchText(`https://mhrise.kiranico.com/data/quests?view=${view}`);
    for (const m of html.matchAll(/href="https:\/\/mhrise\.kiranico\.com\/data\/quests\/(\d+)"[^>]*>([\s\S]*?)<\/a>/gi)) names.set(m[1], decode(m[2]).replace(/^\d+★\s*/, ''));
  }
  return names;
}
async function keyNames() {
  const keys = new Set();
  for (const source of keySources) {
    const html = await fetchText(source);
    for (const m of html.matchAll(/<a[^>]*class=['"]a-link['"][^>]*>([^<]+)<\/a>\s*(?:M)?★[\s\S]{0,260}?\(Key Quest\)/gi)) keys.add(norm(decode(m[1])));
  }
  return keys;
}
function loadI18n() { const sandbox = {}; vm.runInNewContext(fs.readFileSync(path.join(root, 'i18n.js'), 'utf8'), sandbox); return sandbox.I18N || {}; }
function typeFor(goal) {
  const text = norm(goal);
  if (/\bcaptura\b|\bcapture\b/.test(text)) return 'capture';
  if (/\bentrega\b|\brecolecta\b|\brecoge\b|\bpesca\b|\bminera\b|\bgather\b|\bdeliver\b|\bcollect\b/.test(text)) return 'gather';
  if (/\babat|\bcaza\b|\brechaza\b|\bderrota\b|\bhunt\b|\bslay\b|\bdefeat\b|\brepel\b/.test(text)) return 'hunt';
  return 'special';
}
async function main() {
  const quests = JSON.parse(fs.readFileSync(questFile, 'utf8'));
  const [en, keys] = await Promise.all([englishNames(), keyNames()]);
  const i18n = loadI18n();
  const monsters = JSON.parse(fs.readFileSync(path.join(root, 'monsters.json'), 'utf8')).concat(JSON.parse(fs.readFileSync(path.join(root, 'small_monsters.json'), 'utf8')));
  const names = monsters.map(m => ({ name:m.name, labels:[m.name, i18n.monsterNames?.[m.name]].filter(Boolean).map(norm) })).sort((a,b)=>Math.max(...b.labels.map(x=>x.length))-Math.max(...a.labels.map(x=>x.length)));
  for (const q of quests) {
    q.nameEn = en.get(q.id) || q.nameEn || '';
    q.location = q.details?.[0] || '';
    q.questType = typeFor(q.goalCondition);
    // Target icons must reflect the stated objective only. Client flavour text
    // often mentions unrelated Felynes/small monsters and caused false icons.
    const source = norm(q.goalCondition || '');
    q.mainMonsters = names.filter(m => m.labels.some(label => label && new RegExp(`(^| )${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}( |$)`).test(source))).map(m=>m.name);
    // Key progression applies to the village and Hub rank boards, never to
    // event/arena/follower/anomaly lists that can reuse a quest title.
    q.keyQuest = ['village', 'hub_low', 'hub_high', 'hub_master'].includes(q.category) && keys.has(norm(q.nameEn));
  }
  fs.writeFileSync(questFile, JSON.stringify(quests, null, 2) + '\n', 'utf8');
  console.log(`Quest metadata: ${quests.length} quests, ${quests.filter(q=>q.keyQuest).length} key quests, ${quests.filter(q=>q.mainMonsters.length).length} with targets.`);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
