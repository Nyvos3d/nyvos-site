// NYVOS — carrossel "Como pedir" (5 telas, 1080x1350)
// A impressora do site imprime o N enquanto a pessoa arrasta: 3% → 33% → 67% → 100%.
// A máquina fica inteira e no mesmo lugar em todas as telas (efeito de quadro a quadro);
// só o texto e a peça mudam. Laranja só no que conduz o olhar; a última tela vira o jogo
// de cor (CTA). Quadros: node quadros.js · Telas: node carrossel.js <pasta-de-saída>
const { chromium } = require("/opt/node-tools/node_modules/playwright");
const fs = require("fs"), path = require("path"), zlib = require("zlib");
const { SIMBOLO } = require("./art.js");

const OUT = process.argv[2];
const W = 1080, H = 1350;
const GRADE = { lado: 96, topo: 88, base: 92, respiro: 48 };   // margens e o vão mínimo texto → máquina
const QUADRO = { w: 2045, h: 2160 };                           // recorte de quadros.js

const b64 = (f) => fs.readFileSync(path.join(__dirname, f)).toString("base64");
const css = fs.readFileSync(path.join(__dirname, "fontes/fontes.css"), "utf8")
  .replace(/url\(([^)]+\.woff2)\)/g, (_, f) => `url(data:font/woff2;base64,${b64("fontes/" + f)})`);
const quadro = (n) => `data:image/webp;base64,${b64(`impressora/impressora-${n}.webp`)}`;

const N = (cor) => `<svg viewBox="0 0 96 96"><path fill="${cor}" d="${SIMBOLO}"/></svg>`;
const ZAP = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.7-.1-.4-.1-.9-.3-1.6-.6-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8 0-1.3.7-2 .9-2.2.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.5-.3.4c-.1.1-.3.3-.1.5.1.3.7 1.1 1.5 1.8 1 .9 1.8 1.1 2 1.2.3.1.4.1.6-.1l.7-.9c.2-.3.4-.2.6-.1l1.9.9c.3.1.4.2.5.3.1.2.1.7-.1 1.3Z"/></svg>`;
const SETA = `<svg viewBox="0 0 24 24" fill="none" stroke="#F26522" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h16M14 6l6 6-6 6"/></svg>`;

// a impressora: medida depois que os textos são diagramados (ver `posiciona`)
const estilo = (I) => `${css}
*{box-sizing:border-box}body{margin:0}
.s{width:${W}px;height:${H}px;position:relative;overflow:hidden;color:#F3F2EE;
  font-family:'Instrument Sans',sans-serif;font-kerning:normal;-webkit-font-smoothing:antialiased;
  background:radial-gradient(120% 95% at 50% 42%,transparent 58%,rgba(0,0,0,.24)),#1B1D21}
/* estúdio do site: foco frio atrás da máquina, piso iluminado, sombra de contato e o calor da peça */
.estudio{position:absolute;left:${I.x - I.w * .14}px;top:${I.y - I.h * .1}px;width:${I.w * 1.28}px;height:${I.h * 1.16}px;
  background:radial-gradient(42% 39% at 54% 45%,rgba(196,201,209,.15),rgba(196,201,209,.055) 48%,transparent 76%),
             radial-gradient(36% 8.5% at 50% 83%,rgba(214,218,224,.13),rgba(214,218,224,.04) 55%,transparent 76%)}
.contato-sombra{position:absolute;left:${I.x + I.w * .1}px;top:${I.y + I.h * .93}px;width:${I.w * .86}px;height:${I.h * .085}px;
  background:radial-gradient(closest-side,rgba(0,0,0,.6),rgba(0,0,0,.25) 60%,transparent);filter:blur(10px);transform:rotate(2.4deg)}
.calor{position:absolute;left:${I.x + I.w * .22}px;top:${I.y + I.h * .5}px;width:${I.w * .56}px;height:${I.h * .3}px;
  background:radial-gradient(closest-side,#F26522,transparent 72%);filter:blur(26px)}
.imp{position:absolute;left:${I.x}px;top:${I.y}px;width:${I.w}px;height:${I.h}px}
.txt{position:absolute;left:${GRADE.lado}px;right:${GRADE.lado}px;top:${GRADE.topo}px}
.topo{display:flex;align-items:center;justify-content:space-between;height:32px;margin-bottom:52px;
  font-size:24px;font-weight:500;letter-spacing:.005em;color:#8A8F96}
.topo .marca{width:26px;height:26px}
.passo{display:flex;align-items:center;gap:16px;font-family:'DM Mono',monospace;font-size:24px;font-weight:500;color:#6E727A}
.passo b{color:#F26522;font-weight:500}.passo i{width:44px;height:1.5px;background:#45484E}
h1,h2{margin:0;font-family:'Outfit',sans-serif;font-weight:600;font-size:84px;line-height:.98;letter-spacing:-.035em;
  font-variant-ligatures:common-ligatures}
h1 em,h2 em{font-style:normal;color:#F26522}
p{margin:28px 0 0;font-size:31px;line-height:1.4;color:#9A9FA6;max-width:31ch;text-wrap:balance}
.seta{display:flex;align-items:center;gap:14px;color:#F3F2EE}
.seta svg{width:34px;height:34px;flex:none}
/* CTA: a única tela laranja do carrossel, com o N da foto de perfil */
.cta{background:#F26522;color:#1B1D21}
.cta .topo{color:rgba(27,29,33,.62)}
.cta h2{font-size:92px}.cta p{color:rgba(27,29,33,.74)}
.cta .n{position:absolute;right:${GRADE.lado}px;bottom:${GRADE.base}px;width:400px;height:400px}
.contato{position:absolute;left:${GRADE.lado}px;bottom:${GRADE.base}px}
.contato .num{display:flex;align-items:center;gap:16px;font-family:'Outfit',sans-serif;font-weight:600;font-size:52px;
  line-height:1;letter-spacing:-.02em}
.contato .num svg{width:46px;height:46px}
.contato span{display:block;margin-top:14px;font-size:26px;font-weight:500;line-height:1;color:rgba(27,29,33,.66)}`;

const palco = (n, calor) => `<div class="estudio"></div><div class="contato-sombra"></div>
  <div class="calor" style="opacity:${calor}"></div><img class="imp" src="${quadro(n)}">`;
const topo = (esq, dir = `<span class="marca">${N("#F26522")}</span>`) =>
  `<div class="topo"><span data-otico>${esq}</span>${dir}</div>`;
const passo = (i) => `<span class="passo"><b>0${i}</b><i></i>03</span>`;
const tela = (n, calor, texto) => `<div class="s">${palco(n, calor)}<div class="txt">${texto}</div></div>`;

const SLIDES = [
  tela("03", .1, `${topo("Como pedir sua peça")}
    <h1 data-otico>Do rascunho<br>à peça pronta<em>.</em></h1>
    <p class="seta" data-otico>Arraste e acompanhe a impressão ${SETA}</p>`),
  tela("33", .16, `${topo(passo(1))}
    <h2 data-otico>Envie sua ideia<em>.</em></h2>
    <p data-otico>Uma foto, um desenho ou um rascunho. Já é o bastante.</p>`),
  tela("67", .2, `${topo(passo(2))}
    <h2 data-otico>Receba o orçamento<em>.</em></h2>
    <p data-otico>Avaliamos tamanho, material e acabamento e enviamos tudo detalhado.</p>`),
  tela("100", .12, `${topo(passo(3))}
    <h2 data-otico>Aprovou<em>?</em> Imprimimos.</h2>
    <p data-otico>Modelamos em 3D, produzimos camada por camada e revisamos cada detalhe.</p>`),
  `<div class="s cta"><div class="n">${N("#1B1D21")}</div>
    <div class="txt">${topo("Próximo passo", "<span>@nyvos.3d</span>")}
    <h2 data-otico>Sua peça começa<br>com uma mensagem<em style="color:inherit">.</em></h2>
    <p data-otico>Na sua cor, com seu nome, do jeito que você imaginou.</p></div>
    <div class="contato"><div class="num">${ZAP}(34) 98894-1661</div><span data-otico>WhatsApp · link na bio</span></div></div>`,
];

const pagina = (I, corpo) => `<!doctype html><html><head><meta charset="utf-8"><style>${estilo(I)}</style></head><body>${corpo}</body></html>`;

// alinhamento ótico: a tinta da primeira letra encosta na margem (não a caixa da fonte)
function otico() {
  const g = document.createElement("canvas").getContext("2d");
  for (const el of document.querySelectorAll("[data-otico]")) {
    const alvo = el.querySelector(".passo") || el;
    const cs = getComputedStyle(alvo);
    g.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    el.style.marginLeft = `${g.measureText(alvo.textContent.trim()[0]).actualBoundingBoxLeft}px`;
  }
}

// reduz o render 2x para 1x (média de 2x2: antisserrilhado 4x) e aplica dither TPDF de ±1 nível,
// para os degradês escuros não formarem faixas na compressão; ruído com semente fixa (saída estável)
async function finaliza(page, png2x) {
  return page.evaluate(async ([src, W, H]) => {
    const img = new Image(); img.src = src; await img.decode();
    const c = document.createElement("canvas"); c.width = W * 2; c.height = H * 2;
    const g = c.getContext("2d", { willReadFrequently: true }); g.drawImage(img, 0, 0);
    const a = g.getImageData(0, 0, W * 2, H * 2).data;
    const o = new ImageData(W, H), d = o.data;
    let s = 0x9E3779B9;
    const rnd = () => ((s ^= s << 13, s ^= s >>> 17, s ^= s << 5) >>> 0) / 4294967296;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * 2 * W * 2 + x * 2) * 4, j = i + W * 2 * 4, k = (y * W + x) * 4;
      for (let ch = 0; ch < 3; ch++) {
        const m = (a[i + ch] + a[i + 4 + ch] + a[j + ch] + a[j + 4 + ch]) / 4;
        d[k + ch] = Math.max(0, Math.min(255, Math.round(m + rnd() - rnd())));
      }
      d[k + 3] = 255;
    }
    const rgb = new Uint8Array(W * H * 3);
    for (let k = 0, n = 0; k < d.length; k += 4) { rgb[n++] = d[k]; rgb[n++] = d[k + 1]; rgb[n++] = d[k + 2]; }
    let bin = "";
    for (let k = 0; k < rgb.length; k += 0x8000) bin += String.fromCharCode.apply(null, rgb.subarray(k, k + 0x8000));
    return btoa(bin);
  }, [`data:image/png;base64,${png2x.toString("base64")}`, W, H]);
}

// PNG RGB 8 bits (sem canal alfa) marcado como sRGB, para a cor ser lida igual em qualquer aparelho
function png(rgb, w, h) {
  const linha = w * 3, cru = Buffer.alloc((linha + 1) * h);
  for (let y = 0; y < h; y++) {
    const o = y * (linha + 1), l = y * linha;
    cru[o] = 4;                                                  // filtro Paeth
    for (let x = 0; x < linha; x++) {
      const a = x >= 3 ? rgb[l + x - 3] : 0, b = y ? rgb[l - linha + x] : 0, c = x >= 3 && y ? rgb[l - linha + x - 3] : 0;
      const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      cru[o + 1 + x] = (rgb[l + x] - (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255;
    }
  }
  const bloco = (tipo, dados) => {
    const t = Buffer.from(tipo, "latin1"), n = Buffer.alloc(4), crc = Buffer.alloc(4);
    n.writeUInt32BE(dados.length); crc.writeUInt32BE(zlib.crc32(Buffer.concat([t, dados])));
    return Buffer.concat([n, t, dados, crc]);
  };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const gama = Buffer.alloc(4); gama.writeUInt32BE(45455);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), bloco("IHDR", ihdr), bloco("sRGB", Buffer.from([0])),
    bloco("gAMA", gama), bloco("IDAT", zlib.deflateSync(cru, { level: 9 })), bloco("IEND", Buffer.alloc(0))]);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });

  // 1ª passada: mede o bloco de texto mais alto das telas com a máquina e encaixa a impressora
  // inteira no espaço que sobra, centrada, com a base apoiada na margem de baixo
  let fundoTexto = 0;
  const provisoria = { x: 0, y: 0, w: 10, h: 10 };
  for (const corpo of SLIDES.slice(0, 4)) {
    await page.setContent(pagina(provisoria, corpo));
    await page.evaluate(() => document.fonts.ready);
    fundoTexto = Math.max(fundoTexto, await page.evaluate(() => Math.max(...[...document.querySelectorAll(".txt > *")].map((e) => e.getBoundingClientRect().bottom))));
  }
  const y = Math.ceil(fundoTexto + GRADE.respiro), h = H - GRADE.base - y, w = Math.round(h * QUADRO.w / QUADRO.h);
  const I = { x: Math.round((W - w) / 2), y, w, h };
  console.log(`texto até ${Math.round(fundoTexto)} px · impressora ${w}x${h} em (${I.x}, ${y}) · margens ${I.x}/${W - I.x - w} · base ${H - y - h}`);

  // 2ª passada: telas finais
  const arqs = [];
  for (const [k, corpo] of SLIDES.entries()) {
    await page.setContent(pagina(I, corpo));
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(otico);
    const png2x = await page.screenshot({ clip: { x: 0, y: 0, width: W, height: H } });
    const f = path.join(OUT, `nyvos-como-pedir-${String(k + 1).padStart(2, "0")}.png`);
    fs.writeFileSync(f, png(Buffer.from(await finaliza(page, png2x), "base64"), W, H));
    arqs.push(f);
  }

  // prévia: as telas lado a lado (só para conferência)
  const prev = await b.newPage({ viewport: { width: arqs.length * 376 + 16, height: 482 } });
  const imgs = arqs.map((f) => `<img style="width:360px;height:450px;border-radius:6px" src="data:image/png;base64,${fs.readFileSync(f).toString("base64")}">`).join("");
  await prev.setContent(`<body style="margin:0;background:#000;display:flex;gap:16px;padding:16px">${imgs}</body>`);
  await prev.screenshot({ path: path.join(OUT, "previa-carrossel.png") });
  await b.close();
})();
