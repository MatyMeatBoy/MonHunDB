// Local-only bridge shared by Rise, MHFU and Wilds.
(() => {
  const isLocal = location.hostname === "localhost" || location.hostname === "127.0.0.1";
  const url = `http://${location.hostname}:5055`;
  const bareKey = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
  const key = value => bareKey.test(value) ? value : JSON.stringify(value);
  function snippet(name, shape) {
    let out = `${key(name)}: {\n  viewBox: "${shape.viewBox}",\n`;
    if (shape.bgImage) out += `  bgImage: "${shape.bgImage}",\n`;
    out += "  parts: {\n";
    for (const [part, sets] of Object.entries(shape.parts)) out += `    ${key(part)}: [\n${sets.map(points => `      "${points}",`).join("\n")}\n    ],\n`;
    return out + "  },\n},";
  }
  function addButton(container, monster, shape, gameFolder) {
    if (!isLocal) return;
    const btn = document.createElement("button");
    btn.type = "button"; btn.className = "hz-edit-snippet-btn"; btn.textContent = "Editar snippet en VecMon";
    btn.addEventListener("click", async () => {
      const editor = window.open("about:blank", "_blank");
      btn.disabled = true; btn.textContent = "Abriendo VecMon...";
      try {
        const response = await fetch(`${url}/api/pending-load`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: monster.name, snippet: snippet(monster.name, shape), imagePath: monster.image ? `${gameFolder}/${monster.image}` : null }) });
        if (!response.ok) throw new Error(`VecMon respondió ${response.status}`);
        if (editor) editor.location.href = `${url}/?load=1`; else location.href = `${url}/?load=1`;
      } catch (error) {
        if (editor) editor.close();
        alert(`No se pudo conectar con VecMon en ${url}. Inicia run-local.bat y vuelve a intentar. (${error.message})`);
      } finally { btn.disabled = false; btn.textContent = "Editar snippet en VecMon"; }
    });
    container.appendChild(btn);
  }
  window.VecMonBridge = { addButton };
})();
