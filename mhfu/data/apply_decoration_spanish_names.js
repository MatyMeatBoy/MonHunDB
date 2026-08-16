/* Derive existing MHFU decoration labels from their translated skill points. */
const fs = require("fs");
const path = require("path");
const dir = __dirname;
const skills = JSON.parse(fs.readFileSync(path.join(dir, "skills.json"), "utf8"));
const decorationsPath = path.join(dir, "decorations.json");
const itemsPath = path.join(dir, "items.json");
const decorations = JSON.parse(fs.readFileSync(decorationsPath, "utf8"));
const items = JSON.parse(fs.readFileSync(itemsPath, "utf8"));
const skillEs = new Map(skills.map(skill => [skill.name, skill.nameEs || skill.name]));
const labels = new Map();
for (const decoration of decorations) {
  const positive = (decoration.skills || []).find(skill => Number(skill.level) > 0);
  if (!positive) continue;
  const label = `${skillEs.get(positive.name) || positive.name} ${positive.level > 0 ? "+" : ""}${positive.level}`;
  decoration.nameEs = label;
  labels.set(decoration.name, label);
}
for (const item of items) {
  if (labels.has(item.name)) item.nameEs = labels.get(item.name);
}
fs.writeFileSync(decorationsPath, JSON.stringify(decorations, null, 2) + "\n");
fs.writeFileSync(itemsPath, JSON.stringify(items, null, 2) + "\n");
console.log(`Translated ${labels.size} existing MHFU decorations and matching item labels.`);
