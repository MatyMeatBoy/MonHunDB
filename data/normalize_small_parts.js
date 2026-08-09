const fs = require("fs");

const MAP = {
  "Cuerpo": "Body",
  "Cabeza": "Head",
  "Torso": "Torso",
  "Cola": "Tail",
  "Ala": "Wing",
  "Espalda": "Back",
  "Cuerno": "Horn",
  "A:肉質_頭": "Head",
  "B:肉質_胴": "Body",
  "B : 糸": "Thread",
  "Group0‗頭": "Head",
  "Group1_全身": "Body",
  "Group1_糸": "Thread",
  "全身アタリ": "Body",
  "ダメージアタリ_頭_部位": "Head",
  "ダメージアタリ_胴_部位": "Body",
  "ダメージアタリ_尻尾_部位": "Tail",
  "タル": "Barrel",
};

const EN_OK = /^[A-Za-z][A-Za-z0-9 ().:+-]*$/;

for (const file of process.argv.slice(2)) {
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const arr = Array.isArray(data) ? data : data.monsters;
  let n = 0;
  const issues = [];

  for (const mon of arr || []) {
    const isPartsSchema = !!mon.parts || !!mon.partBreaks;
    if (isPartsSchema && !mon.hitzones) {
      for (const p of mon.parts || []) if (p.part && MAP[p.part] !== undefined) { p.part = MAP[p.part]; n++; }
      for (const p of mon.partBreaks || []) if (p.part && MAP[p.part] !== undefined) { p.part = MAP[p.part]; n++; }
      for (const v of [...(mon.parts || []).map(p => p.part), ...(mon.partBreaks || []).map(p => p.part)])
        if (v && !EN_OK.test(v)) issues.push(`${mon.name}:${v}`);
    } else {
      for (const h of mon.hitzones || []) if (h.part && MAP[h.part] !== undefined) { h.part = MAP[h.part]; n++; }
      for (const p of mon.partBreaks || []) {
        if (typeof p === "string") {
          if (MAP[p] !== undefined) { mon.partBreaks[mon.partBreaks.indexOf(p)] = MAP[p]; n++; }
        } else if (p.part && MAP[p.part] !== undefined) { p.part = MAP[p.part]; n++; }
      }
      for (const v of [...(mon.hitzones || []).map(h => h.part), ...(mon.partBreaks || []).map(p => (typeof p === "string" ? p : p.part))])
        if (v && !EN_OK.test(v)) issues.push(`${mon.name}:${v}`);
    }
  }

  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
  console.log(file, "-> normalized:", n, "| remaining issues:", issues.length ? issues.join(", ") : "none");
}