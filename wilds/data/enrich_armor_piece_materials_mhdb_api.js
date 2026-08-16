/* Fill missing Wilds armor-piece crafting materials from the public MHDB API.
 * The API exposes one crafting.materials array per armor piece. Existing local
 * values are preserved; matching is by the game's exact displayed piece name.
 */
const fs = require("fs");
const path = require("path");
const DATA = __dirname;
const URL = "https://wilds.mhdb.io/en/armor";
const out = path.join(DATA, "armor_pieces.json");
const pieces = JSON.parse(fs.readFileSync(out, "utf8"));
function norm(s) { return String(s || "").normalize("NFKC").replace(/[αΑ]/g, "α").replace(/[βΒ]/g, "β").replace(/[γΓ]/g, "γ").replace(/\s+/g, " ").trim().toLowerCase(); }
function sourceNames(name) {
  const out = [name];
  // Local base Uth Duna pieces use the short in-game names; the API calls
  // those same five entries Duna Wild* (without a rank suffix).
  const duna = String(name).match(/^Duna (Helm|Mail|Vambraces|Coil|Greaves)$/i);
  if (duna) out.push(`Duna Wild${duna[1].replace(/^Helm$/i, "helm").replace(/^Mail$/i, "mail").replace(/^Vambraces$/i, "braces").replace(/^Coil$/i, "coil").replace(/^Greaves$/i, "greaves")}`);
  return out;
}
(async () => {
  const res = await fetch(URL, { headers: { "user-agent": "MonHunDB-data-research/1.0", accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const api = await res.json();
  const byName = new Map(api.map(x => [norm(x.name), x]));
  let matched = 0, updated = 0;
  for (const piece of pieces) {
    const source = sourceNames(piece.name).map(norm).map(n => byName.get(n)).find(Boolean);
    if (!source) continue;
    matched++;
    const rows = (source.crafting?.materials || []).map(row => ({ material: row.item?.name, qty: row.quantity })).filter(x => x.material && x.qty);
    if (rows.length && !piece.materials?.length) {
      piece.materials = rows;
      piece.materialsSource = `${URL}#${source.id}`;
      updated++;
    }
  }
  fs.writeFileSync(out, JSON.stringify(pieces, null, 1) + "\n");
  const report = { source: URL, apiPieces: api.length, localPieces: pieces.length, exactMatches: matched, updated, remainingWithoutMaterials: pieces.filter(x => !x.materials?.length).length, generatedAt: new Date().toISOString() };
  fs.writeFileSync(path.join(DATA, "armor_piece_materials_mhdb_api_report.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(`MHDB API armor scrape: ${matched} exact matches, ${updated} updates, ${report.remainingWithoutMaterials} still empty.`);
})();
