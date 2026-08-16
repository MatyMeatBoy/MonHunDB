const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'missions.json');
const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
const decode = s => s.replace(/&#x27;|&#039;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const byId = new Map(rows.map(x => [x.id, x]));
async function text(url){const r=await fetch(url);if(!r.ok)throw new Error(r.status);return r.text();}
async function main(){
  const [missionsHtml, questsHtml] = await Promise.all([text('https://mhwilds.kiranico.com/data/missions'),text('https://mhwilds.kiranico.com/data/quests')]);
  // Main missions are explicitly grouped under Chapter headings.
  for(const section of missionsHtml.split(/<h4[^>]*>/i).slice(1)){
    const [headingRaw, body=''] = section.split(/<\/h4>/i);
    const group = decode(headingRaw);
    for(const m of body.matchAll(/href="\/data\/missions\/([^"]+)">([\s\S]*?)<\/a>/gi)){
      const row=byId.get(`missions-${m[1]}`);if(row){row.boardGroup=group;row.questType='story';row.mainMonsters=[];}
    }
  }
  // The quest list exposes its own category/rank in the title and its target
  // monsters as links in the same table row.
  for(const rowHtml of questsHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)){
    const row=rowHtml[1];const link=row.match(/href="\/data\/quests\/([^"]+)">([\s\S]*?)<\/a>/i);if(!link)continue;
    const q=byId.get(`quests-${link[1]}`);if(!q)continue;
    const title=decode(link[2]);const bracket=title.match(/^\[([^\]]+)\]\s*(.*)$/);
    q.boardGroup=bracket?bracket[1]:'Quests';q.title=bracket?bracket[2]:title;q.name=q.title;q.nameEs=q.title;
    q.questType=/event/i.test(q.boardGroup)?'event':/assignment/i.test(q.boardGroup)?'assignment':'optional';
    q.mainMonsters=[...row.matchAll(/href="\/data\/monsters\/[^"]+">([\s\S]*?)<\/a>/gi)].map(m=>decode(m[1])).filter((x,i,a)=>x&&a.indexOf(x)===i);
  }
  fs.writeFileSync(file,JSON.stringify(rows,null,2)+'\n','utf8');
  console.log(`Enriched ${rows.filter(x=>x.boardGroup).length}/${rows.length}; quest targets ${rows.filter(x=>x.model==='quests'&&x.mainMonsters?.length).length}`);
}
main().catch(e=>{console.error(e);process.exitCode=1});
