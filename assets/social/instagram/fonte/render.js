const { chromium } = require("/opt/node-tools/node_modules/playwright");
const fs = require("fs"), path = require("path");
const { perfil, PERFIS } = require("./art.js");
const { DESTAQUES, ALTERNATIVAS, capa } = require("./glifos.js");

const OUT = process.argv[2];

async function shot(page, svg, w, h, file) {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<html><body style="margin:0">${svg.replace("<svg ", `<svg width="${w}" height="${h}" `)}</body></html>`);
  await page.screenshot({ path: file, clip: { x: 0, y: 0, width: w, height: h } });
}

const nomeArq = (d) => `nyvos-destaque-${d.id}`;
const circ = (d) => capa(d, { w: 1080, h: 1080 }).replace("<svg ", '<svg width="100%" height="100%" ');

(async () => {
  const b = await chromium.launch();
  const page = await b.newPage();
  const page2 = await b.newPage({ deviceScaleFactor: 2.5 });
  for (const d of ["perfil", "perfil/svg", "destaques", "destaques/svg", "destaques/alternativas"]) fs.mkdirSync(path.join(OUT, d), { recursive: true });

  for (const [nome, cfg] of Object.entries(PERFIS)) {
    const svg = perfil(cfg);
    fs.writeFileSync(path.join(OUT, "perfil/svg", `nyvos-${nome}.svg`), svg);
    for (const px of [1080, 2048]) await shot(page, svg, px, px, path.join(OUT, "perfil", `nyvos-${nome}-${px}.png`));
  }
  for (const d of DESTAQUES) {
    const svg = capa(d);
    fs.writeFileSync(path.join(OUT, "destaques/svg", `${nomeArq(d)}.svg`), svg);
    await shot(page, svg, 1080, 1920, path.join(OUT, "destaques", `${nomeArq(d)}.png`));
  }
  // versões alternativas de uma capa, para trocar se preferir
  for (const d of ALTERNATIVAS) await shot(page, capa(d), 1080, 1920, path.join(OUT, "destaques/alternativas", `${nomeArq(d)}.png`));

  // prévia realista: fileira rolável como no app (só para conferência)
  const av = perfil(PERFIS["perfil-invertido"]).replace("<svg ", '<svg width="100%" height="100%" ');
  const hl = DESTAQUES.map((d) => `<div class="h"><div class="ring"><div class="c">${circ(d)}</div></div><span>${d.nome}</span></div>`).join("");
  const css = `body{margin:0;background:#000;color:#F5F5F5;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif}
.h{width:72px;flex:none;text-align:center;font-size:12px}.h span{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ring{width:66px;height:66px;border-radius:50%;border:1px solid #363636;padding:3px;box-sizing:border-box;margin:0 auto 6px}
.c{width:100%;height:100%;border-radius:50%;overflow:hidden}`;
  const mock = `<!doctype html><html><head><meta charset="utf-8"><style>${css}
body{width:430px}.top{display:flex;align-items:center;gap:28px;padding:22px 16px 12px}
.av{width:86px;height:86px;border-radius:50%;overflow:hidden;flex:none}
.n{display:flex;gap:26px;text-align:center;font-size:13px}.n b{display:block;font-size:16px}
.bio{padding:0 16px;font-size:13px;line-height:1.4}.bio b{font-size:14px}.bio span{color:#A8A8A8}
.hs{display:flex;gap:10px;padding:18px 16px 22px;overflow:hidden}</style></head><body>
<div class="top"><div class="av">${av}</div>
<div class="n"><div><b>48</b>posts</div><div><b>1.2K</b>seguidores</div><div><b>210</b>seguindo</div></div></div>
<div class="bio"><b>NYVOS</b><br><span>Design &amp; Fabricação Digital</span><br>Peças em 3D criadas do zero, feitas só pra você.<br>Uberlândia · MG</div>
<div class="hs">${hl}</div></body></html>`;
  await page2.setViewportSize({ width: 430, height: 300 });
  await page2.setContent(mock);
  await page2.screenshot({ path: path.join(OUT, "previa-perfil.png"), fullPage: true, scale: "device" });

  // grade com todas as capas em tamanho de leitura
  const grade = `<!doctype html><html><head><meta charset="utf-8"><style>${css}
body{width:880px;padding:36px 28px}.g{display:grid;grid-template-columns:repeat(4,1fr);gap:34px 18px}
.h{width:auto;font-size:17px}.ring{width:168px;height:168px;padding:6px;margin-bottom:12px}</style></head><body>
<div class="g">${hl}</div></body></html>`;
  await page2.setViewportSize({ width: 936, height: 300 });
  await page2.setContent(grade);
  await page2.screenshot({ path: path.join(OUT, "previa-destaques.png"), fullPage: true, scale: "device" });
  await b.close();
})();
