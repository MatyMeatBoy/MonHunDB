// Builds data/small_monsters.json (same shape as data/monsters.json) from the
// raw Kiranico scrape (data/small_monsters_raw.json). Each small monster has a
// single body part ("Body"). Weaknesses/resistances are derived from the body
// hitzone (Kiranico doesn't list them explicitly for small monsters).
//
// Usage:
//   node data/build_small_monsters.js
const fs = require("fs");
const path = require("path");

const RAW = JSON.parse(fs.readFileSync(path.join(__dirname, "small_monsters_raw.json"), "utf8"));

// EN species per small monster (Kiranico pages don't expose it; mapped by hand).
const SPECIES = {
  Altaroth: "Neopteron", Anteka: "Herbivore", Baggi: "Bird Wyvern", Bnahabra: "Neopteron",
  Boggi: "Bird Wyvern", Bombadgy: "Amphibian", Bullfango: "Fanged Beast", Gowngoat: "Fanged Beast",
  Ceanataur: "Carapaceon", Delex: "Piscine Wyvern", Felyne: "Lynian", Gajau: "Fish",
  Gargwa: "Bird Wyvern", Hermitaur: "Carapaceon", Hornetaur: "Neopteron", Izuchi: "Bird Wyvern",
  Jaggi: "Bird Wyvern", Jaggia: "Bird Wyvern", Jagras: "Fanged Wyvern", Kelbi: "Herbivore",
  Kestodon: "Fanged Beast", Ludroth: "Leviathan", Melynx: "Lynian", Popo: "Herbivore",
  Pyrantula: "Temnoceran", Rachnoid: "Temnoceran", Remobra: "Snake Wyvern", Rhenoplos: "Herbivore",
  Slagtoth: "Herbivore", Uroktor: "Amphibian", Velociprey: "Bird Wyvern", Vespoid: "Neopteron",
  Wroggi: "Bird Wyvern", Zamite: "Amphibian",
};

const ELEM = ["Fire", "Water", "Thunder", "Ice", "Dragon"];

function stars(hz) { return hz >= 80 ? 3 : hz >= 55 ? 2 : 1; }

function hitzones(row) {
  // row: [part, state, sever, blunt, projectile, fire, water, ice, thunder, dragon, stun]
  return [{
    part: "Body", sever: +row[2] || 0, blunt: +row[3] || 0, projectile: +row[4] || 0,
    fire: +row[5] || 0, water: +row[6] || 0, ice: +row[7] || 0, thunder: +row[8] || 0,
    dragon: +row[9] || 0, stun: +row[10] || 0,
  }];
}

function deriveWeakRes(hzRow) {
  const vals = { fire: +hzRow[5] || 0, water: +hzRow[6] || 0, ice: +hzRow[7] || 0, thunder: +hzRow[8] || 0, dragon: +hzRow[9] || 0 };
  const weak = [], res = [];
  for (const el of ELEM) {
    const v = vals[el.toLowerCase()];
    if (v >= 40) weak.push({ element: el, stars: stars(v) });
    else if (v === 0) res.push({ element: el, immune: true });
    else if (v <= 15) res.push({ element: el });
  }
  weak.sort((a, b) => b.stars - a.stars);
  res.sort((a, b) => (b.immune ? 1 : 0) - (a.immune ? 1 : 0));
  return { weaknesses: weak, resistances: res };
}

function ailments(list) {
  return (list || []).map(a => {
    const m = a.buildup.match(/(\d+)\s*\+\s*(\d+)\s*→\s*(\d+)/);
    const initial = m ? +m[1] : 0, increment = m ? +m[2] : 0, max = m ? +m[3] : 0;
    const damage = a.damage && a.damage !== "0" ? +a.damage : 0;
    return {
      key: a.ailment.toLowerCase().replace(/\s+/g, ""),
      label: a.ailment, stars: 1,
      buildup: [
        { label: "Initial Resistance", value: initial, max: Math.max(initial, max) || 1 },
        { label: "Maximum Resistance", value: max, max: Math.max(initial, max) || 1 },
        ...(damage ? [{ label: "Total Damage", value: damage, max: damage || 1 }] : []),
      ],
    };
  });
}

function materials(rows) {
  if (!rows || !rows.length) return {};
  // group by rank then material, collecting methods
  const byRank = {};
  for (const r of rows) {
    if (!r[0] || !r[1]) continue;
    const rank = r[1]; // "Low Rank", "High Rank", "Master Rank"
    const method = r[2] || "";
    const amount = r[4] || "";
    const rate = r[5] || "";
    if (!byRank[rank]) byRank[rank] = new Map();
    const mat = r[0];
    if (!byRank[rank].has(mat)) byRank[rank].set(mat, { targetReward: [], carves: [], dropped: [], palico: [] });
    const e = byRank[rank].get(mat);
    const entry = `${rate}${amount && !amount.startsWith("x") ? " " : ""}${amount}`.trim();
    if (/Target Reward/.test(method)) e.targetReward.push(entry);
    else if (/Carve/.test(method)) e.carves.push(entry);
    else if (/Dropped/.test(method)) e.dropped.push(entry);
    else if (/Palico/.test(method)) e.palico.push(entry);
  }
  const out = {};
  for (const rank of Object.keys(byRank)) {
    out[rank] = [...byRank[rank].entries()].map(([material, e]) => {
      const dropped = [...e.dropped, ...(e.palico.length ? e.palico.map(p => `Palico ${p}`) : [])].join(", ");
      return {
        material,
        rarity: null,
        targetReward: e.targetReward.join(", "),
        capture: "",
        breakParts: "",
        carves: e.carves.join(", "),
        dropped,
      };
    });
  }
  return out;
}

const out = RAW.map(r => {
  const hz = r.hitzoneRow && r.hitzoneRow.length > 10 ? r.hitzoneRow : null;
  const { weaknesses, resistances } = hz ? deriveWeakRes(hz) : { weaknesses: [], resistances: [] };
  return {
    name: r.name,
    species: SPECIES[r.name] || "",
    locations: [],
    weaknesses,
    resistances,
    ailmentSusceptibility: [],
    inflicts: [],
    materials: materials(r.materialRows),
    hitzones: hz ? hitzones(hz) : [],
    ailmentBuildup: ailments(r.ailments),
    image: "",
    attackElements: [],
    isSmall: true,
  };
});

fs.writeFileSync(path.join(__dirname, "small_monsters.json"), JSON.stringify(out, null, 1));
console.log("Wrote data/small_monsters.json, count", out.length);
console.log("with hitzones:", out.filter(x => x.hitzones.length).length);
console.log("materials ranks sample:", out.map(x => Object.keys(x.materials).join('+')).join(', ').slice(0, 200));
