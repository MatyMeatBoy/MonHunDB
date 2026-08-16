const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'quests.json');
const quests = JSON.parse(fs.readFileSync(file, 'utf8'));
const strip = s => s.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#039;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
function field(html, label) {
  const re = new RegExp(`<dt[^>]*>\\s*${label}\\s*</dt>[\\s\\S]*?<dd[^>]*>([\\s\\S]*?)</dd>`, 'i');
  const m = html.match(re); return m ? strip(m[1]) : '';
}
async function enrich(q) {
  const html = await (await fetch(`https://mhrise.kiranico.com/es/data/quests/${q.id}`)).text();
  const h = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const goal = field(html, 'Objetivo principal');
  const fail = field(html, 'Condiciones fracaso');
  const title = h ? strip(h[1]) : q.nameEs;
  const beforeGoal = goal ? html.slice(0, html.indexOf('Objetivo principal')) : '';
  const ps = [...beforeGoal.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map(m => strip(m[1])).filter(Boolean);
  return {...q, titleEs:title, client:ps.at(-1) || '', goalCondition:goal, failureConditions:fail, detailSource:`https://mhrise.kiranico.com/es/data/quests/${q.id}`};
}
async function main(){let done=0; for(let i=0;i<quests.length;i+=8){const batch=quests.slice(i,i+8); const out=await Promise.all(batch.map(q=>enrich(q).catch(e=>({...q,detailError:e.message})))); quests.splice(i, batch.length, ...out); done+=out.length; if(done%80===0) console.log(`Enriched ${done}/${quests.length}`);} fs.writeFileSync(file,JSON.stringify(quests,null,2)+'\n','utf8'); console.log(`Enriched ${quests.length} Rise quests`)}
main().catch(e=>{console.error(e);process.exitCode=1});
