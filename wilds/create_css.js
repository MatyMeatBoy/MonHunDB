const fs = require('fs');
const path = require('path');

const RISE_CSS = fs.readFileSync(path.join(__dirname, '..', '..', 'mhrise-bestiario', 'style.css'), 'utf-8');
const OUT_DIR = __dirname;

const wildsCSS = RISE_CSS
  .replace(/--accent: #d9832a;/g, '--accent: #e86c00;')
  .replace(/--accent-2: #b23a3a;/g, '--accent-2: #c0392b;')
  .replace(/--star-on: #e8b23a;/g, '--star-on: #f39c12;')
  .replace(/--immune: #6d9e6d;/g, '--immune: #27ae60;')
  .replace(/\.monster-render \{[\s\S]*?background: radial-gradient\(circle, rgba\(217, 131, 42, 0.12\) 0%, transparent 72%\);[\s\S]*?\}/g, 
    `.monster-render { width: 190px; height: 190px; object-fit: contain; flex-shrink: 0; background: radial-gradient(circle, rgba(232, 108, 0, 0.12) 0%, transparent 72%); border-radius: var(--radius); }`);

fs.writeFileSync(path.join(OUT_DIR, 'style.css'), wildsCSS);
console.log('Created wilds/style.css');