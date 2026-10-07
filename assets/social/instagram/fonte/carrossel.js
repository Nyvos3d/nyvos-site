// NYVOS — carrossel "Como pedir" (1080x1350, 4:5)
// Texto do site (seção "Como funciona"), fontes do site (Outfit, Instrument Sans, DM Mono)
// e as peças em camadas dos destaques. Uso: node carrossel.js <pasta-de-saída>
const { chromium } = require("/opt/node-tools/node_modules/playwright");
const fs = require("fs"), path = require("path");
const { SIMBOLO } = require("./art.js");
const { DESTAQUES, peca, impressora } = require("./glifos.js");

const OUT = process.argv[2];
const W = 1080, H = 1350;
const glifo = (id) => DESTAQUES.find((d) => d.id === id).svg;

// fontes embutidas: o render não depende de rede
const css = fs.readFileSync(path.join(__dirname, "fontes/fontes.css"), "utf8").replace(/url\(([^)]+\.woff2)\)/g, (_, f) =>
  `url(data:font/woff2;base64,${fs.readFileSync(path.join(__dirname, "fontes", f)).toString("base64")})`);

const LOGO = `<svg class="logo" viewBox="0 -2 575 100"><path fill="#F26522" d="${SIMBOLO}"/><g fill="#F3F2EE" transform="translate(128 0)">
  <path d="M0 0H20L60 62V0H80V96H60L20 34V96H0Z"/><path transform="translate(94 0)" d="M0 0H20L40 36L60 0H80L50 54V96H30V54Z"/>
  <path transform="translate(182 0)" d="M0 0H20L40 64L60 0H80L50 96H30Z"/>
  <path transform="translate(272 0)" fill-rule="evenodd" d="M48 -1.5A48 49.5 0 1 0 48.01 -1.5ZM48 19.5A27 28.5 0 1 1 47.99 19.5Z"/>
  <path transform="translate(378 -1) scale(1 1.0206)" d="M66.42 18.91A34.5 29.5 0 1 0 34 58.5A13.5 8.5 0 1 1 21.31 69.91L1.58 77.09A34.5 29.5 0 1 0 34 37.5A13.5 8.5 0 1 1 46.69 26.09Z"/></g></svg>`;
const ZAP = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.7-.1-.4-.1-.9-.3-1.6-.6-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8 0-1.3.7-2 .9-2.2.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.5-.3.4c-.1.1-.3.3-.1.5.1.3.7 1.1 1.5 1.8 1 .9 1.8 1.1 2 1.2.3.1.4.1.6-.1l.7-.9c.2-.3.4-.2.6-.1l1.9.9c.3.1.4.2.5.3.1.2.1.7-.1 1.3Z"/></svg>`;
const RAIO = `<svg viewBox="0 0 24 24"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>`;
const GEMA = `<svg viewBox="0 0 24 24"><path d="M6 3h12l4 6-10 12L2 9Z"/><path d="M2 9h20M10 3 8 9l4 12 4-12-2-6"/></svg>`;

const ESTILO = `${css}
*{box-sizing:border-box}body{margin:0;background:#0B0C0E}
.s{width:${W}px;height:${H}px;position:relative;overflow:hidden;color:#F3F2EE;font-family:'Instrument Sans',sans-serif;
  background:radial-gradient(ellipse 1000px 900px at 540px 430px,#2C2F35,#17181C 58%,#0B0C0E)}
.malha{position:absolute;inset:0;opacity:.9;
  background:repeating-linear-gradient(0deg,rgba(154,159,166,.05) 0 1.5px,transparent 1.5px 54px),
             repeating-linear-gradient(90deg,rgba(154,159,166,.05) 0 1.5px,transparent 1.5px 54px);
  -webkit-mask:radial-gradient(ellipse 80% 70% at 50% 38%,#000 30%,transparent 85%)}
.topo,.pe{position:absolute;left:88px;right:88px;display:flex;align-items:center;justify-content:space-between}
.topo{top:72px}.pe{bottom:70px}
.logo{height:30px}
.mono{font-family:'DM Mono',monospace;font-weight:500;font-size:22px;letter-spacing:.26em;text-transform:uppercase;color:#9A9FA6}
.mono b{color:#F26522;font-weight:500}
.pontos{display:flex;gap:10px;align-items:center}.pontos i{width:10px;height:10px;border-radius:5px;background:rgba(243,242,238,.18)}
.pontos i.on{width:34px;background:#F26522}
.et{display:flex;align-items:center;gap:16px;font-family:'DM Mono',monospace;font-weight:500;font-size:24px;letter-spacing:.26em;
  text-transform:uppercase;color:#B9BAB6}
.et::before{content:"";width:30px;height:2px;background:#F26522}
h1,h2{margin:0;font-family:'Outfit',sans-serif;font-weight:600;letter-spacing:-.03em;color:#F3F2EE;text-wrap:balance}
h1 b,h2 b{font-weight:800;background:linear-gradient(#F26522,#F26522) 0 100%/100% .09em no-repeat;padding-bottom:.06em;
  -webkit-box-decoration-break:clone;box-decoration-break:clone}
p{margin:0;font-size:36px;line-height:1.45;color:#B9BAB6}
.palco{position:absolute;left:50%;transform:translateX(-50%)}
.palco::before{content:"";position:absolute;inset:-12%;border-radius:50%;
  background:radial-gradient(closest-side,rgba(242,101,34,.16),rgba(242,101,34,0))}
.palco svg{position:relative;width:100%;height:100%;display:block}
.txt{position:absolute;left:88px;right:88px}
.passo{display:flex;align-items:center;gap:22px;margin-bottom:34px}
.passo .n{width:76px;height:76px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  border:1.5px solid rgba(242,101,34,.55);background:rgba(242,101,34,.09);box-shadow:0 0 40px -10px rgba(242,101,34,.7);
  font-family:'DM Mono',monospace;font-weight:500;font-size:28px;color:#F26522}
.passo .trilho{flex:1;height:2px;background:linear-gradient(90deg,rgba(242,101,34,.6),rgba(154,159,166,.1))}
.cards{display:grid;grid-template-columns:1fr 1fr;gap:24px}
.card{padding:34px 32px 36px;border-radius:28px;border:1.5px solid rgba(154,159,166,.16);
  background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.012))}
.card .mono{font-size:19px;color:#F26522}
.card h3{margin:16px 0 10px;font-family:'Outfit',sans-serif;font-weight:600;font-size:40px;letter-spacing:-.01em}
.card p{font-size:27px;line-height:1.45}
.zap{display:flex;align-items:center;justify-content:center;gap:20px;height:124px;border-radius:100px;
  font-family:'Outfit',sans-serif;font-weight:600;font-size:44px;color:#F3F2EE;
  background:rgba(43,217,107,.14);border:2px solid rgba(43,217,107,.38);
  box-shadow:inset 0 2px 0 rgba(255,255,255,.14),0 24px 60px -30px rgba(43,217,107,.6),0 0 0 14px rgba(43,217,107,.05)}
.zap svg{width:48px;height:48px;color:#3ff08a}
.selos{display:flex;justify-content:center;gap:44px;margin-top:40px}
.selos span{display:flex;align-items:center;gap:12px;font-size:28px;color:#B9BAB6}
.selos svg{width:30px;height:30px;fill:none;stroke:#F26522;stroke-width:1.8;stroke-linejoin:round}`;

const TOTAL = 6;
const moldura = (i, corpo, rotulo = "Como pedir") => `<div class="s"><div class="malha"></div>
  <div class="topo">${LOGO}<span class="mono">${rotulo} · <b>${String(i).padStart(2, "0")}</b>/${String(TOTAL).padStart(2, "0")}</span></div>
  ${corpo}
  <div class="pe"><span class="mono">@nyvos.3d</span>
    ${i < TOTAL ? `<span class="pontos">${Array.from({ length: TOTAL }, (_, k) => `<i${k + 1 === i ? ' class="on"' : ""}></i>`).join("")}</span>` : ""}</div></div>`;

const palco = (svg, id, tam, topo) => `<div class="palco" style="top:${topo}px;width:${tam}px;height:${tam}px">${peca(svg, id)}</div>`;

const passo = (i, n, titulo, texto, svg, id) => moldura(i, `${palco(svg, id, 500, 150)}
  <div class="txt" style="top:715px">
    <div class="passo"><span class="n">${n}</span><span class="mono">Passo ${n} de 03</span><span class="trilho"></span></div>
    <h2 style="font-size:80px;line-height:1.04;margin-bottom:26px">${titulo}</h2>
    <p style="max-width:30ch">${texto}</p></div>`);

const SLIDES = [
  moldura(1, `<div class="txt" style="top:196px"><div class="et">Como funciona</div>
      <h1 style="font-size:118px;line-height:1.02;margin-top:34px">Do rascunho à <b>peça pronta.</b></h1>
      <p style="margin-top:30px">Como pedir a sua peça em 3 passos.</p></div>
    ${palco(impressora, "capa", 560, 650)}
    <div class="mono" style="position:absolute;right:88px;bottom:118px;color:#F3F2EE">Arrasta <b>→</b></div>`),
  passo(2, "01", "Envie sua <b>ideia</b>", "Foto, desenho ou referência. Um rascunho já basta para começarmos.", glifo("04-sua-ideia"), "p1"),
  passo(3, "02", "Análise e <b>orçamento</b>", "Avaliamos tamanho, material e acabamento da peça e enviamos um orçamento detalhado.", glifo("02-orcamento"), "p2"),
  passo(4, "03", "Modelagem, impressão e <b>entrega</b>", "Orçamento aprovado: modelamos em 3D, imprimimos camada por camada e revisamos cada detalhe antes da entrega.", glifo("05-bastidores"), "p3"),
  moldura(5, `<div class="txt" style="top:190px"><div class="et">Feito do seu jeito</div>
      <h2 style="font-size:84px;line-height:1.04;margin:30px 0 56px">Se você imagina, <b>nós imprimimos.</b></h2>
      <div class="cards">
        <div class="card"><span class="mono">Cor</span><h3>Na sua cor</h3><p>Uma cor, duas ou a combinação que você escolher, impressa direto no filamento.</p></div>
        <div class="card"><span class="mono">Arte</span><h3>Seu nome & sua arte</h3><p>Nome gravado, logo, escudo do time ou a sua estampa em relevo na peça.</p></div>
        <div class="card"><span class="mono">Modelo</span><h3>Modelagem do zero</h3><p>Um modelo que não existe em lugar nenhum? Desenhamos em 3D e imprimimos para você.</p></div>
        <div class="card"><span class="mono">Medida</span><h3>Sob medida</h3><p>Medidas, encaixes e detalhes exatos, do brinde corporativo à peça de reposição.</p></div>
      </div></div>`),
  moldura(6, `${palco(glifo("07-a-nyvos"), "fim", 330, 170)}
    <div class="txt" style="top:560px;text-align:center">
      <h2 style="font-size:92px;line-height:1.04">Sua peça começa com <b>uma mensagem.</b></h2>
      <p style="margin:30px auto 52px;max-width:24ch">Conte sua ideia e receba o orçamento pelo WhatsApp.</p>
      <div class="zap">${ZAP}Chamar no WhatsApp</div>
      <div class="mono" style="margin-top:34px;color:#F3F2EE">(34) 98894-1661 · <b>link na bio</b></div>
      <div class="selos"><span>${RAIO}Entrega rápida</span><span>${GEMA}Acabamento premium</span></div></div>`),
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
  // prévia: as 6 telas lado a lado (só para conferência)
  const imgs = arqs.map((f) => `<img src="data:image/png;base64,${fs.readFileSync(f).toString("base64")}">`).join("");
  await page.setViewportSize({ width: 6 * 360 + 7 * 16, height: 450 + 32 });
  await page.setContent(`<body style="margin:0;background:#000;display:flex;gap:16px;padding:16px">${imgs.replace(/<img /g, '<img style="width:360px;height:450px;border-radius:6px" ')}</body>`);
  await page.screenshot({ path: path.join(OUT, "previa-carrossel.png") });
  await b.close();
})();
