const fs = require('fs');
const path = require('path');

const views = ['event','mystery','follower','hub_master','hub_high','hub_low','village','arena','training'];
const strip = s => s.replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&#039;|&apos;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();
async function get(url) { const r = await fetch(url); if (!r.ok) throw new Error(`${r.status} ${url}`); return r.text(); }
async function main() {
  const out = new Map();
  for (const view of views) {
    const url = `https://mhrise.kiranico.com/es/data/quests?view=${view}`;
    let html; try { html = await get(url); } catch (e) { console.warn(e.message); continue; }
    for (const row of html.matchAll(/<tr[\s\S]*?<\/tr>/gi)) {
      const raw = row[0];
      const link = raw.match(/href="https:\/\/mhrise\.kiranico\.com\/es\/data\/quests\/(\d+)"[^>]*>([\s\S]*?)<\/a>/i);
      if (!link) continue;
      const id = link[1];
      const cells = [...raw.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(m=>strip(m[1]));
      const nameEs = strip(link[2]);
      const stars = (nameEs.match(/^(\d+)★/) || [])[1] || null;
      const name = nameEs.replace(/^\d+★\s*/, '');
      const old = out.get(id);
      out.set(id, { id, category:view, stars:stars?Number(stars):null, name, nameEs, details: cells });
    }
  }
  const data = [...out.values()].sort((a,b)=>(a.category+b.nameEs).localeCompare(b.category+a.nameEs));
  fs.writeFileSync(path.join(__dirname,'quests.json'), JSON.stringify(data,null,2)+'\n','utf8');
  console.log(`Saved ${data.length} Rise quests`);
}
main().catch(e=>{ console.error(e); process.exitCode=1; });
