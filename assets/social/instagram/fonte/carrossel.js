// NYVOS — carrossel "Como pedir" (5 telas, 1080x1350)
// A impressora do site imprime o N enquanto a pessoa arrasta: 3% → 33% → 67% → 100%.
// A máquina fica no mesmo lugar em todas as telas (efeito de quadro a quadro); só o texto
// e a peça mudam. Laranja só no que conduz o olhar; a última tela vira o jogo de cor (CTA).
// Quadros: node quadros.js · Telas: node carrossel.js <pasta-de-saída>
const { chromium } = require("/opt/node-tools/node_modules/playwright");
const fs = require("fs"), path = require("path");
const { SIMBOLO } = require("./art.js");

const OUT = process.argv[2];
const W = 1080, H = 1350;
const b64 = (f) => fs.readFileSync(path.join(__dirname, f)).toString("base64");
const css = fs.readFileSync(path.join(__dirname, "fontes/fontes.css"), "utf8")
  .replace(/url\(([^)]+\.woff2)\)/g, (_, f) => `url(data:font/woff2;base64,${b64("fontes/" + f)})`);
const quadro = (n) => `data:image/webp;base64,${b64(`impressora/impressora-${n}.webp`)}`;

// impressora: 860 px de largura, centrada, a base sangra levemente na borda de baixo
const IMP = { w: 860, x: 104, y: 482 };
IMP.h = Math.round(IMP.w * 2160 / 2045);

const ZAP = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.7-.1-.4-.1-.9-.3-1.6-.6-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8 0-1.3.7-2 .9-2.2.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.5-.3.4c-.1.1-.3.3-.1.5.1.3.7 1.1 1.5 1.8 1 .9 1.8 1.1 2 1.2.3.1.4.1.6-.1l.7-.9c.2-.3.4-.2.6-.1l1.9.9c.3.1.4.2.5.3.1.2.1.7-.1 1.3Z"/></svg>`;

const ESTILO = `${css}
*{box-sizing:border-box}body{margin:0}
.s{width:${W}px;height:${H}px;position:relative;overflow:hidden;background:#1B1D21;color:#F3F2EE;
  font-family:'Instrument Sans',sans-serif;-webkit-font-smoothing:antialiased}
/* estúdio do site: foco frio atrás da máquina, piso iluminado e o calor da peça na mesa */
.estudio{position:absolute;left:${IMP.x - IMP.w * .14}px;top:${IMP.y - IMP.h * .1}px;width:${IMP.w * 1.28}px;height:${IMP.h * 1.16}px;
  background:radial-gradient(42% 39% at 54% 45%,rgba(196,201,209,.15),rgba(196,201,209,.055) 48%,transparent 76%),
             radial-gradient(36% 8.5% at 50% 83%,rgba(214,218,224,.13),rgba(214,218,224,.04) 55%,transparent 76%)}
.calor{position:absolute;left:${IMP.x + IMP.w * .22}px;top:${IMP.y + IMP.h * .5}px;width:${IMP.w * .56}px;height:${IMP.h * .3}px;
  background:radial-gradient(closest-side,rgba(242,101,34,1),transparent 72%);filter:blur(26px)}
.imp{position:absolute;left:${IMP.x}px;top:${IMP.y}px;width:${IMP.w}px;height:${IMP.h}px}
.txt{position:absolute;left:96px;right:96px;top:104px}
.topo{display:flex;align-items:center;justify-content:space-between;height:30px;margin-bottom:46px;
  font-size:24px;font-weight:500;color:#8A8F96}
.passo{display:flex;align-items:center;gap:16px;font-family:'DM Mono',monospace;font-size:24px;font-weight:500;color:#6E727A}
.passo b{color:#F26522;font-weight:500}.passo i{width:44px;height:1.5px;background:#4A4D53}
h1,h2{margin:0;font-family:'Outfit',sans-serif;font-weight:600;font-size:86px;line-height:.98;letter-spacing:-.04em}
h1 em,h2 em{font-style:normal;color:#F26522}
p{margin:24px 0 0;font-size:31px;line-height:1.4;color:#9A9FA6;max-width:31ch;text-wrap:balance}
.seta{display:inline-flex;align-items:center;gap:14px;color:#F3F2EE}
.seta svg{width:34px;height:34px}
/* CTA: a única tela laranja do carrossel */
.cta{background:#F26522;color:#1B1D21}
.cta .topo{color:rgba(27,29,33,.6)}
.cta h2{font-size:96px}.cta p{color:rgba(27,29,33,.72)}
.cta .n{position:absolute;right:96px;bottom:104px;width:400px;height:400px}
.contato{position:absolute;left:96px;bottom:104px}
.contato .num{display:flex;align-items:center;gap:16px;font-family:'Outfit',sans-serif;font-weight:600;font-size:52px;letter-spacing:-.02em}
.contato .num svg{width:46px;height:46px}
.contato span{display:block;margin-top:10px;font-size:26px;font-weight:500;color:rgba(27,29,33,.66)}`;

const palco = (n, calor) => `<div class="estudio"></div><div class="calor" style="opacity:${calor}"></div><img class="imp" src="${quadro(n)}">`;
const topo = (esq) => `<div class="topo"><span>${esq}</span><span>@nyvos.3d</span></div>`;
const marca = (i) => `<span class="passo"><b>0${i}</b><i></i>03</span>`;

const SLIDES = [
  `<div class="s">${palco("03", .1)}<div class="txt">${topo("Como pedir sua peça")}
    <h1>Do rascunho<br>à peça pronta<em>.</em></h1>
    <p class="seta">Arraste e acompanhe a impressão
      <svg viewBox="0 0 24 24" fill="none" stroke="#F26522" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h16M14 6l6 6-6 6"/></svg></p></div></div>`,
  `<div class="s">${palco("33", .16)}<div class="txt">${topo(marca(1))}
    <h2>Envie sua ideia<em>.</em></h2>
    <p>Uma foto, um desenho ou um rascunho. Já é o bastante.</p></div></div>`,
  `<div class="s">${palco("67", .2)}<div class="txt">${topo(marca(2))}
    <h2>Receba o orçamento<em>.</em></h2>
    <p>Avaliamos tamanho, material e acabamento e enviamos tudo detalhado.</p></div></div>`,
  `<div class="s">${palco("100", .12)}<div class="txt">${topo(marca(3))}
    <h2>Aprovou<em>?</em> Imprimimos.</h2>
    <p>Modelamos, imprimimos camada por camada e revisamos cada detalhe.</p></div></div>`,
  `<div class="s cta"><svg class="n" viewBox="0 0 96 96"><path fill="#1B1D21" d="${SIMBOLO}"/></svg>
    <div class="txt">${topo("Peça a sua")}
    <h2>Sua peça começa<br>com uma mensagem.</h2>
    <p>Na sua cor, com seu nome, do jeito que você imaginou.</p></div>
    <div class="contato"><div class="num">${ZAP}(34) 98894-1661</div><span>WhatsApp · link na bio</span></div></div>`,
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: W, height: H } });
  const arqs = [];
  for (const [k, corpo] of SLIDES.entries()) {
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${ESTILO}</style></head><body>${corpo}</body></html>`);
    await page.evaluate(() => document.fonts.ready);
    const f = path.join(OUT, `nyvos-como-pedir-${String(k + 1).padStart(2, "0")}.png`);
    await page.screenshot({ path: f, clip: { x: 0, y: 0, width: W, height: H } });
    arqs.push(f);
  }
  // prévia: as telas lado a lado (só para conferência)
  const imgs = arqs.map((f) => `<img style="width:360px;height:450px;border-radius:6px" src="data:image/png;base64,${fs.readFileSync(f).toString("base64")}">`).join("");
  await page.setViewportSize({ width: arqs.length * 376 + 16, height: 482 });
  await page.setContent(`<body style="margin:0;background:#000;display:flex;gap:16px;padding:16px">${imgs}</body>`);
  await page.screenshot({ path: path.join(OUT, "previa-carrossel.png") });
  await b.close();
})();
