const { chromium } = require("/opt/node-tools/node_modules/playwright");
const fs = require("fs"), path = require("path");
const { perfil, PERFIS } = require("./art.js");
const { GLIFOS, capaEstrato } = require("./glifos.js");

const OUT = process.argv[2];
const LABELS = {
  "01-sobre": "Sobre", "02-portfolio": "Portfólio", "03-impressao": "Impressão",
  "04-personalizados": "Personaliz.", "05-cores": "Cores", "06-modelagem": "Modelagem",
  "07-sob-medida": "Sob medida", "08-orcamento": "Orçamento", "09-entregas": "Entregas",
  "10-feedbacks": "Feedbacks",
};

async function shot(page, svg, w, h, file) {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<html><body style="margin:0">${svg.replace("<svg ", `<svg width="${w}" height="${h}" `)}</body></html>`);
  await page.screenshot({ path: file, clip: { x: 0, y: 0, width: w, height: h } });
}

(async () => {
  const b = await chromium.launch();
  const page = await b.newPage();
  const page2 = await b.newPage({ deviceScaleFactor: 2.5 });
  for (const d of ["perfil", "perfil/svg", "destaques", "destaques/svg"]) fs.mkdirSync(path.join(OUT, d), { recursive: true });

  for (const [nome, cfg] of Object.entries(PERFIS)) {
    const svg = perfil(cfg);
    fs.writeFileSync(path.join(OUT, "perfil/svg", `nyvos-${nome}.svg`), svg);
    for (const px of [1080, 2048]) await shot(page, svg, px, px, path.join(OUT, "perfil", `nyvos-${nome}-${px}.png`));
  }
  for (const id of Object.keys(GLIFOS)) {
    const svg = capaEstrato(id);
    fs.writeFileSync(path.join(OUT, "destaques/svg", `nyvos-destaque-${id}.svg`), svg);
    await shot(page, svg, 1080, 1920, path.join(OUT, "destaques", `nyvos-destaque-${id}.png`));
  }

  // prévia do perfil (mock) — só para conferência
  const av = (cfg) => perfil(cfg).replace("<svg ", '<svg width="100%" height="100%" ');
  const hl = Object.keys(GLIFOS).map((id) => `
    <div class="h"><div class="ring"><div class="c">${capaEstrato(id, { w: 1080, h: 1080 }).replace("<svg ", '<svg width="100%" height="100%" ')}</div></div><span>${LABELS[id]}</span></div>`).join("");
  const mock = (cfg) => `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;600;700&display=swap" rel="stylesheet">
<style>
body{margin:0;background:#000;color:#F5F5F5;font-family:'Instrument Sans',system-ui,sans-serif;width:430px}
.top{display:flex;align-items:center;gap:28px;padding:22px 16px 12px}
.av{width:86px;height:86px;border-radius:50%;overflow:hidden;flex:none}
.n{display:flex;gap:26px;text-align:center;font-size:13px}.n b{display:block;font-size:16px}
.bio{padding:0 16px;font-size:13px;line-height:1.4}.bio b{font-size:14px}.bio span{color:#A8A8A8}
.hs{display:flex;gap:14px;padding:18px 16px 22px;flex-wrap:wrap}
.h{width:66px;text-align:center;font-size:11.5px}
.ring{width:64px;height:64px;border-radius:50%;border:1px solid #3a3a3a;padding:3px;box-sizing:border-box;margin:0 auto 6px}
.c{width:100%;height:100%;border-radius:50%;overflow:hidden}
</style></head><body>
<div class="top"><div class="av">${av(cfg)}</div>
<div class="n"><div><b>48</b>posts</div><div><b>1.2K</b>seguidores</div><div><b>210</b>seguindo</div></div></div>
<div class="bio"><b>NYVOS</b><br><span>Design &amp; Fabricação Digital</span><br>Peças em 3D criadas do zero, feitas só pra você.<br>Uberlândia · MG</div>
<div class="hs">${hl}</div></body></html>`;
  for (const [nome, cfg] of Object.entries(PERFIS)) {
    await page2.setViewportSize({ width: 430, height: 520 });
    await page2.setContent(mock(cfg), { waitUntil: "networkidle" });
    await page2.screenshot({ path: path.join(OUT, `previa-${nome}.png`), fullPage: true, scale: "device" });
  }
  await b.close();
})();
