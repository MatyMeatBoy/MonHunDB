const fs = require('fs');

const URL = 'https://game8.co/games/Monster-Hunter-Wilds/archives/580835';
const piecesPath = __dirname + '/armor_pieces.json';

function decode(value) {
  return value.replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"').trim();
}

async function main() {
  const html = await fetch(URL, { headers: { 'user-agent': 'Mozilla/5.0' } }).then(r => {
    if (!r.ok) throw new Error(`Game8 returned ${r.status}`);
    return r.text();
  });
  const pieces = JSON.parse(fs.readFileSync(piecesPath, 'utf8'));
  const byName = new Map(pieces.map(piece => [piece.name, piece]));
  const rows = [...html.matchAll(/<tr>[\s\S]*?<\/tr>/g)].map(match => match[0]);
  const parsed = [];
  for (const row of rows) {
    const nameMatch = row.match(/<b class='a-bold'>([^<]*γ)<\/b>/);
    if (!nameMatch || !nameMatch[1].startsWith('Arkvulcan ')) continue;
    const skills = [...row.matchAll(/<a class='a-link'[^>]*>[\s\S]*?<\/a>\s*(\d+)/g)]
      .map(match => {
        const anchor = match[0].replace(/<img[^>]*>/g, '').replace(/<[^>]+>/g, ' ');
        const skill = decode(anchor.replace(/\s+\d+\s*$/, ''));
        return { name: skill, level: Number(match[1]) };
      }).filter(skill => skill.name);
    const targetName = nameMatch[1].replace(/^Arkvulcan /, 'Arkveld ');
    const target = byName.get(targetName);
    if (!target) throw new Error(`No local piece matched ${targetName}`);
    if (target.skills?.length) continue;
    target.skills = skills;
    parsed.push({ source: nameMatch[1], target: targetName, skills });
  }
  if (parsed.length !== 5) throw new Error(`Expected 5 Arkveld gamma pieces, parsed ${parsed.length}`);
  fs.writeFileSync(piecesPath, JSON.stringify(pieces, null, 2) + '\n');
  console.log(JSON.stringify({ source: URL, updated: parsed }, null, 2));
}

main().catch(error => { console.error(error); process.exit(1); });
