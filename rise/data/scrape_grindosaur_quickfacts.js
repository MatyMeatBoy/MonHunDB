// Adds the "Element" (and cross-checks "Abnormal Status(es)") quick-fact
// from grindosaur.com — the attack element(s) a monster itself deals,
// which was missed in the first scraping pass (only Physiology + Ailment
// Effectiveness were captured then).
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const DATA_DIR = __dirname;

function curlText(url) {
  return execFileSync("curl", ["-sL", "-A", UA, url], { maxBuffer: 1024 * 1024 * 50 }).toString("utf8");
}

const links = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "grindosaur_links_raw.json"), "utf8"));

function parseQuickFacts(html) {
  const idx = html.indexOf("Quick Facts");
  if (idx === -1) return null;
  const tableEnd = html.indexOf("</table>", idx);
  const chunk = html.slice(idx, tableEnd);
  const rows = [...chunk.matchAll(/<th[^>]*>([^<]+)<\/th><td[^>]*>([\s\S]*?)<\/td>/g)];
  const facts = {};
  for (const r of rows) {
    const key = r[1].trim();
    const val = r[2].replace(/<br\s*\/?>/g, ", ").replace(/<[^>]+>/g, "").trim();
    facts[key] = val;
  }
  return facts;
}

async function main() {
  const results = [];
  let i = 0;
  for (const link of links) {
    i++;
    try {
      const html = curlText(link.url);
      const facts = parseQuickFacts(html);
      if (!facts) {
        console.log(`[${i}/${links.length}] MISS ${link.text} (no quick facts)`);
        results.push({ name: link.text, ok: false });
        continue;
      }
      const element = facts["Element"] || "";
      const abnormalStatus = facts["Abnormal Status(es)"] || "";
      results.push({
        name: link.text,
        ok: true,
        element: element && element !== "-" && element !== "None" ? element.split(",").map(s => s.trim()).filter(Boolean) : [],
        abnormalStatus: abnormalStatus ? abnormalStatus.split(",").map(s => s.trim()).filter(Boolean) : [],
      });
      console.log(`[${i}/${links.length}] OK ${link.text} — element: ${element || "(none)"}`);
    } catch (e) {
      console.log(`[${i}/${links.length}] ERROR ${link.text}: ${e}`);
      results.push({ name: link.text, ok: false, error: String(e) });
    }
    await new Promise(r => setTimeout(r, 200));
  }
  fs.writeFileSync(path.join(DATA_DIR, "grindosaur_quickfacts.json"), JSON.stringify(results, null, 2));
  console.log(`\nDone. ${results.filter(r => r.ok).length}/${results.length} OK.`);
}

main();
