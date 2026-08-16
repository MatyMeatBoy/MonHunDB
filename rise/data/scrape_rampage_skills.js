const fs = require("fs");
const path = require("path");
const clean = value => String(value || "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
async function fetchPage(language) {
  const response = await fetch(`https://mhrise.kiranico.com/${language}/data/rampage-skills`);
  return response.text();
}
function parse(html) {
  const result = [];
  for (const row of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...row[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(match => clean(match[1]));
    if (cells.length < 2 || !cells[0] || /^nombre|^skill$/i.test(cells[0])) continue;
    result.push({ name: cells[0], effect: cells[1] });
  }
  return result;
}
(async () => {
  const [es, en] = await Promise.all([fetchPage("es"), fetchPage("")]);
  const spanish = parse(es), english = parse(en);
  const skills = spanish.map((entry, index) => ({
    id: `rampage-${index + 1}`,
    nameEs: entry.name,
    effectEs: entry.effect,
    name: english[index]?.name || entry.name,
    effect: english[index]?.effect || entry.effect,
  }));
  fs.writeFileSync(path.join(__dirname, "rampage_skills.json"), JSON.stringify(skills, null, 2) + "\n");
  console.log(`Saved ${skills.length} Rise Rampage skills.`);
})();
