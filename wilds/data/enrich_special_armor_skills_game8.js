const fs = require('fs');

const SOURCES = [
  ['Sororal', 'https://game8.co/games/Monster-Hunter-Wilds/archives/580909', ['Sororal']],
  ['Azure Age', 'https://game8.co/games/Monster-Hunter-Wilds/archives/584418', ['Azure Age']],
  ['Gala Suit', 'https://game8.co/games/Monster-Hunter-Wilds/archives/583632', ['Gala Suit']],
  ['Duna', 'https://game8.co/games/Monster-Hunter-Wilds/archives/501377', ['Duna']]
];
const path = __dirname + '/armor_pieces.json';
const pieces = JSON.parse(fs.readFileSync(path, 'utf8'));
const byName = new Map(pieces.map(piece => [piece.name, piece]));
const clean = value => value.replace(/&#39;/g, "'").replace(/&amp;/g, '&').trim();

async function main() {
  const updated = [];
  for (const [label, url, prefixes] of SOURCES) {
    const html = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } }).then(r => r.text());
    for (const rowMatch of html.matchAll(/<tr>[\s\S]*?<\/tr>/g)) {
      const row = rowMatch[0];
      const nameMatch = row.match(/<b class='a-bold'>([^<]+(?:α|β|γ)?)<\/b>/);
      if (!nameMatch || !prefixes.some(prefix => nameMatch[1].startsWith(prefix))) continue;
      const name = clean(nameMatch[1]);
      const target = byName.get(name);
      if (!target || target.skills?.length) continue;
      const skills = [...row.matchAll(/<a class='a-link'[^>]*>[\s\S]*?<\/a>\s*(\d+)/g)].map(match => {
        const text = match[0].replace(/<img[^>]*>/g, '').replace(/<[^>]+>/g, ' ');
        return { name: clean(text.replace(/\s+\d+\s*$/, '')), level: Number(match[1]) };
      }).filter(skill => skill.name);
      if (skills.length) { target.skills = skills; updated.push({ source: label, name, skills }); }
    }
  }
  const remaining = pieces.filter(piece => !piece.skills?.length).map(piece => piece.name);
  fs.writeFileSync(path, JSON.stringify(pieces, null, 2) + '\n');
  console.log(JSON.stringify({ updated, remaining }, null, 2));
}
main().catch(error => { console.error(error); process.exit(1); });
