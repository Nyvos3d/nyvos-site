// NYVOS — capas de destaques "Estúdio"
// Cada destaque é uma peça impressa de verdade, fotografada no estúdio da marca:
// filamento laranja, mineral e carbono (a paleta da NYVOS), camadas visíveis como
// cordões de FDM com luz e sombra, espessura real e a mesa de impressão embaixo.
// Onde há processo (Bastidores) a camada de cima ainda está quente.
const { SIMBOLO } = require("./art.js");

const T = { luz: "#FF8A4C", base: "#F26522", esc: "#B8410E", min: "#F3F2EE", carbono: "#1B1D21", grafite: "#252729" };
const FUNDO = { centro: "#2C2F35", meio: "#17181C", borda: "#0B0C0E" };
const P = 4;        // altura de camada (unidades do glifo, grade 96)
const MESA = 81;    // topo da mesa: as camadas nascem daqui para cima

// filamentos: face da frente e lateral (mais escura, de costas para a luz)
const MAT = {
  laranja: { frente: T.base, lado: "#9E3A0C" },
  mineral: { frente: "#ECEAE4", lado: "#9C998F" },
  carbono: { frente: "#33363C", lado: "#16171A" },
};

const fx = (n) => +n.toFixed(2);

// escala/desloca caminhos absolutos (M L H V C Z), mantendo a grade de camadas
function reposiciona(d, s, tx, ty) {
  return d.replace(/([MLHVCZ])([^MLHVCZ]*)/g, (_, c, args) => {
    const n = args.trim() ? args.trim().split(/[\s,]+/).map(Number) : [];
    if (c === "H") return "H" + fx(n[0] * s + tx);
    if (c === "V") return "V" + fx(n[0] * s + ty);
    if (c === "Z") return "Z";
    const out = [];
    for (let i = 0; i < n.length; i += 2) out.push(`${fx(n[i] * s + tx)} ${fx(n[i + 1] * s + ty)}`);
    return c + out.join(" ");
  });
}

function estrela(cx, cy, R, r, pontas = 5) {
  const pts = [];
  for (let i = 0; i < pontas * 2; i++) {
    const a = (-90 + (180 / pontas) * i) * Math.PI / 180, k = i % 2 ? r : R;
    pts.push(`${fx(cx + k * Math.cos(a))} ${fx(cy + k * Math.sin(a))}`);
  }
  return `M${pts.join("L")}Z`;
}
const circulo = (cx, cy, r) => `M${fx(cx - r)} ${cy}a${r} ${r} 0 1 0 ${fx(2 * r)} 0a${r} ${r} 0 1 0 ${fx(-2 * r)} 0Z`;

// ---------- peças impressas ----------
let seq = 0;
function forma(d, o, pintura, extra = "") {
  if (o.traco) return `<path d="${d}" fill="none" stroke="${pintura}" stroke-width="${o.traco}" stroke-linejoin="miter"${extra}/>`;
  return `<path d="${d}"${o.evenodd ? ' fill-rule="evenodd"' : ""} fill="${pintura}"${extra}/>`;
}

// peça extrudada (placa, etiqueta, balão, N): frente + espessura para a direita
function ext(d, mat, o = {}) {
  const prof = o.prof ?? 6, k = `m${seq++}`;
  const copias = (p) => { let s = ""; for (let i = prof; i > 0; i -= 0.5) s += forma(d, o, p, ` transform="translate(${i} 0)"`); return s; };
  return `<g>${copias(mat.lado)}</g>
    <mask id="${k}" maskUnits="userSpaceOnUse" x="-20" y="-20" width="136" height="136">${copias("#fff")}</mask>
    <rect x="-20" y="-20" width="136" height="136" fill="url(#rib)" mask="url(#${k})"/>
    ${forma(d, o, mat.frente)}${forma(d, o, "url(#vole)")}${forma(d, o, "url(#rib)")}`;
}

// peça de revolução (vaso, lâmpada): sombreado cilíndrico + camadas
const rev = (d, mat, o = {}) => forma(d, o, mat.frente) + forma(d, o, "url(#volr)") + forma(d, o, "url(#rib)");

// metal (bico, bloco aquecedor, dissipador): sem camadas
const metal = (d) => `<path d="${d}" fill="url(#metal)"/><path d="${d}" fill="url(#vole)"/>`;

// cordão recém-extrudado, ainda quente, com a ponta incandescente
function quente(x1, x2, y, ponta = true) {
  const cordao = `<rect x="${x1}" y="${y}" width="${x2 - x1}" height="${P}" rx="${P / 2}"`;
  return `${cordao} fill="${T.base}" filter="url(#brilho)" opacity=".9"/>${cordao} fill="url(#quente)"/>${cordao} fill="url(#rib)"/>` +
    (ponta ? `<circle cx="${x2 - 1}" cy="${y + P / 2}" r="4.5" fill="${T.luz}" filter="url(#brilho)"/><circle cx="${x2 - 1}" cy="${y + P / 2}" r="1.5" fill="#FFE2CC"/>` : "");
}

// mesa de impressão vista de frente, levemente de cima; a peça projeta luz laranja nela
function mesa(x1 = 6, x2 = 90) {
  const linhas = [];
  for (let x = x1 + 8; x < x2 - 2; x += 8) linhas.push(`M${fx(48 + (x - 48) * 0.93)} ${MESA - 3}L${x} ${MESA + 1}`);
  return `<ellipse cx="48" cy="${MESA + 4}" rx="${(x2 - x1) / 2 + 4}" ry="4" fill="#000" opacity=".55" filter="url(#sombra)"/>
    <path d="M${x1 + 4} ${MESA - 3}H${x2 - 4}L${x2} ${MESA + 1}H${x1}Z" fill="url(#tampo)"/>
    <path d="${linhas.join(" ")} M${x1 + 2} ${MESA - 1}H${x2 - 2}" stroke="#F3F2EE" stroke-opacity=".06" stroke-width=".3" fill="none"/>
    <ellipse cx="48" cy="${MESA - 1}" rx="${(x2 - x1) / 2 - 10}" ry="2.2" fill="${T.base}" opacity=".35" filter="url(#sombra)"/>
    <rect x="${x1}" y="${MESA + 1}" width="${x2 - x1}" height="5" fill="${T.grafite}"/>
    <rect x="${x1}" y="${MESA + 1}" width="${x2 - x1}" height=".5" fill="#F3F2EE" opacity=".18"/>`;
}

// ---------- os sete destaques ----------
const VASO = "M34 81H62C62 76 74 67 74 53C74 39 60 32 58 25V17H62V10H34V17H38V25C36 32 22 39 22 53C22 67 34 76 34 81Z";
const N_PLACA = reposiciona(SIMBOLO, 0.68, 12.4, MESA - 96 * 0.68);
const N_LAMPADA = reposiciona(SIMBOLO, 0.17, 39.8, 25);

function cubo() {
  // isométrico: metade de baixo já impressa (paredes + preenchimento), metade de cima é o modelo
  const B = [48, 81], E = [22, 66], D = [74, 66], h = 16;
  const up = ([x, y], k) => `${x} ${y - k}`;
  const esq = `M${E[0]} ${E[1]}L${B[0]} ${B[1]}L${up(B, h)}L${up(E, h)}Z`;
  const dir = `M${B[0]} ${B[1]}L${D[0]} ${D[1]}L${up(D, h)}L${up(B, h)}Z`;
  const topo = `M${up(E, h)}L${up(B, h)}L${up(D, h)}L48 ${51 - h + 0}Z`; // 48,35
  const parede = "M27.2 50L48 62L68.8 50L48 38Z";
  const infill = [];
  for (let k = -30; k <= 30; k += 3.5) {
    infill.push(`M${48 + k * 0.866 - 26} ${50 + k * 0.5 - 15}l52 30`, `M${48 + k * 0.866 - 26} ${50 - k * 0.5 + 15}l52 -30`);
  }
  const fantasma = "M22 50V36L48 21L74 36V50 M22 36L48 51L74 36 M48 51V65";
  return `<path d="M48 92L4 66.6L48 41.2L92 66.6Z" fill="#000" opacity=".5" filter="url(#sombra)" transform="translate(0 3)"/>
    <path d="M48 89L8 66L48 43L88 66Z" fill="url(#tampo)"/>
    <path d="M8 66L48 89V93L8 70Z" fill="#1A1C1F"/><path d="M48 89L88 66V70L48 93Z" fill="${T.grafite}"/>
    <path d="M48 87L14 67.3L48 47.6L82 67.3Z" fill="${T.base}" opacity=".18" filter="url(#sombra)"/>
    <path d="${esq}" fill="${MAT.laranja.frente}"/><path d="${esq}" fill="url(#ribe)"/>
    <path d="${dir}" fill="${MAT.laranja.lado}"/><path d="${dir}" fill="url(#ribd)"/>
    <path d="${topo}" fill="#C9500F"/>
    <clipPath id="tp"><path d="${parede}"/></clipPath>
    <path d="${infill.join(" ")}" stroke="${T.luz}" stroke-width=".7" opacity=".7" clip-path="url(#tp)"/>
    <path d="${parede}" fill="none" stroke="${T.luz}" stroke-width="1.6"/>
    <path d="${topo}" fill="none" stroke="#FFB085" stroke-width=".8" opacity=".8"/>
    <path d="${fantasma} M48 35V21" fill="none" stroke="${T.min}" stroke-width="1.1" stroke-dasharray="2.4 1.8" opacity=".7"/>
    ${[[48, 21], [22, 36], [74, 36], [48, 51]].map(([x, y]) => `<rect x="${x - 2.6}" y="${y - 2.6}" width="5.2" height="5.2" fill="${T.min}"/>`).join("")}
    <circle cx="68.8" cy="50" r="5" fill="${T.luz}" filter="url(#brilho)"/><circle cx="68.8" cy="50" r="1.6" fill="#FFE2CC"/>`;
}

function hotend() {
  const aletas = [0, 1, 2, 3, 4].map((i) => metal(`M32 ${6 + i * 4.4}H60V${8.8 + i * 4.4}H32Z`)).join("");
  return `${metal("M44 6H52V31H44Z")}${aletas}
    ${metal("M30 31H62V45H30Z")}
    <circle cx="35" cy="38" r="1.6" fill="#55585E"/><circle cx="57" cy="38" r="1.6" fill="#55585E"/>
    ${metal("M40 45H56V49H40Z")}${metal("M42 49H54L50.2 56.2H45.8Z")}`;
}

// a impressora do site (hero 3D) reduzida ao essencial e impressa como as outras peças:
// quadro em camadas laranja (base, colunas, travessa), mesa e pórtico em carbono,
// cabeçote mineral com a ventoinha de anel laranja, como no modelo 3D.
function impressora() {
  const quadro = "M14 81H82V67L80 65H76V17H78V9H18V17H20V65H16L14 67Z M26 65V17H70V65Z";
  return mesa(6, 90) +
    ext(quadro, MAT.laranja, { evenodd: true, prof: 5 }) +
    ext("M26 61H67V65H26Z", MAT.carbono, { prof: 3 }) +
    ext("M26 29H68V33H26Z", MAT.carbono, { prof: 2 }) +
    ext("M38 22H58V42H38Z", MAT.mineral, { prof: 3 }) +
    `<circle cx="48" cy="31" r="5.4" fill="${T.carbono}"/>
    <circle cx="48" cy="31" r="5.4" fill="none" stroke="${T.base}" stroke-width="1.4"/>
    <circle cx="48" cy="31" r="1.7" fill="${MAT.mineral.frente}"/>
    ${metal("M44 42H52V45H44Z")}${metal("M45.5 45H50.5L48.8 49H47.2Z")}
    <circle cx="48" cy="49.4" r="2.2" fill="${T.luz}" filter="url(#brilho)"/><circle cx="48" cy="49.4" r=".8" fill="#FFE2CC"/>`;
}

function carretel(cx, cy, r, mat, id) {
  return `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="1.7" gradientUnits="userSpaceOnUse" spreadMethod="repeat">
      <stop offset="0" stop-color="#000" stop-opacity=".38"/><stop offset=".35" stop-color="#fff" stop-opacity=".22"/>
      <stop offset=".6" stop-color="#fff" stop-opacity=".04"/><stop offset="1" stop-color="#000" stop-opacity=".38"/></radialGradient>
    <circle cx="${cx + 3}" cy="${cy}" r="${r}" fill="${MAT.carbono.lado}"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#3A3D43"/>
    <circle cx="${cx}" cy="${cy}" r="${r - 1.6}" fill="${mat.frente}"/>
    <circle cx="${cx}" cy="${cy}" r="${r - 1.6}" fill="url(#${id})"/>
    <circle cx="${cx}" cy="${cy}" r="${r - 1.6}" fill="url(#volc)"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.42}" fill="${T.carbono}"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.42}" fill="none" stroke="#4A4D54" stroke-width="1"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.17}" fill="#08090A"/>`;
}

const DESTAQUES = [
  {
    id: "01-impressoes", nome: "Impressões", sobre: "Peças saindo da impressora: do modelo 3D à peça pronta",
    svg: impressora,
  },
  {
    id: "02-orcamento", nome: "Orçamento", sobre: "Como pedir, prazos, formas de pagamento",
    svg: () => mesa(16, 84) +
      ext(`M24 81V32L46 10L68 32V81Z ${circulo(46, 27, 4.5)}`, MAT.laranja, { evenodd: true }) +
      ext("M57 41H35V53H57V65H35 M46 35V71", MAT.mineral, { traco: 5.5, prof: 1.6 }),
  },
  {
    id: "03-clientes", nome: "Clientes", sobre: "Depoimentos, prints de conversa, cliente com a peça",
    svg: () => mesa(6, 90) + ext("M10 12H80V62H46L30 81V62H10Z", MAT.laranja) +
      ext(estrela(45, 37, 19, 7.8), MAT.mineral, { prof: 1.6 }),
  },
  {
    id: "04-sua-ideia", nome: "Sua ideia", sobre: "Personalizados: o que o cliente pediu → o que entregamos",
    svg: () => mesa(18, 78) +
      `<circle cx="48" cy="32" r="30" fill="${T.base}" opacity=".35" filter="url(#brilho)"/>` +
      rev("M38 53.8A24 24 0 1 1 58 53.8V62H38Z", MAT.laranja) +
      `<circle cx="44" cy="29" r="18" fill="url(#acesa)"/>` +
      rev("M38.5 62H57.5V76H38.5Z", MAT.mineral) + rev("M42 76H54V81H42Z", MAT.carbono) +
      ext(N_LAMPADA, MAT.mineral, { prof: 1.2 }),
  },
  {
    id: "05-bastidores", nome: "Bastidores", sobre: "A impressora trabalhando, time-lapses, processo",
    svg: () => mesa(6, 90) + ext("M12 81V61H80V81Z", MAT.laranja) + quente(12, 49, 57) + hotend() +
      `<circle cx="48" cy="56.4" r="2.4" fill="${T.luz}" filter="url(#brilho)"/>`,
  },
  {
    id: "06-cores", nome: "Cores", sobre: "Filamentos e cores disponíveis",
    svg: () => mesa(8, 88) + carretel(30, 64.5, 16.5, MAT.carbono, "fa") + carretel(66, 64.5, 16.5, MAT.mineral, "fb") +
      carretel(48, 32.5, 16.5, MAT.laranja, "fc") +
      `<path d="M63.5 28C72 30 80 40 82 54" fill="none" stroke="${T.base}" stroke-width="1.6" stroke-linecap="round"/>`,
  },
  {
    id: "07-a-nyvos", nome: "A NYVOS", sobre: "Quem está por trás, missão, contatos",
    svg: () => mesa(6, 90) + ext(N_PLACA, MAT.laranja, { prof: 7 }),
  },
];

// ---------- capa ----------
function defs() {
  const c = (MESA % P).toFixed(3);
  const t30 = Math.tan(Math.PI / 6);
  const ce = ((81 - 48 * t30) % P).toFixed(3), cd = ((81 + 48 * t30) % P).toFixed(3);
  const rib = (id, y, tr = "") => `<pattern id="${id}" patternUnits="userSpaceOnUse" x="-40" y="${y}" width="200" height="${P}"${tr}><rect width="200" height="${P}" fill="url(#ribg)"/></pattern>`;
  return `<linearGradient id="ribg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".34"/><stop offset=".2" stop-color="#fff" stop-opacity=".1"/>
      <stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset=".78" stop-color="#000" stop-opacity=".14"/>
      <stop offset="1" stop-color="#000" stop-opacity=".5"/></linearGradient>
    ${rib("rib", c)}${rib("ribe", ce, ' patternTransform="skewY(30)"')}${rib("ribd", cd, ' patternTransform="skewY(-30)"')}
    <linearGradient id="volr" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#000" stop-opacity=".5"/><stop offset=".2" stop-color="#000" stop-opacity=".06"/>
      <stop offset=".36" stop-color="#fff" stop-opacity=".24"/><stop offset=".52" stop-color="#fff" stop-opacity="0"/>
      <stop offset=".84" stop-color="#000" stop-opacity=".26"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></linearGradient>
    <linearGradient id="vole" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".14"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient>
    <radialGradient id="volc" cx=".38" cy=".3" r=".8">
      <stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".4"/></radialGradient>
    <linearGradient id="metal" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#5E6167"/><stop offset=".3" stop-color="#E4E3DF"/>
      <stop offset=".55" stop-color="#A3A5A9"/><stop offset="1" stop-color="#4B4E54"/></linearGradient>
    
    <linearGradient id="quente" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${T.base}"/><stop offset=".7" stop-color="${T.luz}"/><stop offset="1" stop-color="#FFC9A6"/></linearGradient>
    <radialGradient id="acesa"><stop offset="0" stop-color="#FFE6D4" stop-opacity=".55"/><stop offset=".6" stop-color="${T.luz}" stop-opacity=".15"/>
      <stop offset="1" stop-color="${T.luz}" stop-opacity="0"/></radialGradient>
    <linearGradient id="tampo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#202226"/><stop offset="1" stop-color="#3A3D44"/></linearGradient>
    <filter id="brilho" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="2.4"/></filter>
    <filter id="sombra" x="-30%" y="-200%" width="160%" height="500%"><feGaussianBlur stdDeviation="1.6"/></filter>`;
}

// capa 1080x1920; o Instagram mostra o círculo central
function capa(dest, opcoes) {
  return capaBruta(dest, opcoes).replace(/id="([a-z0-9]+)"/g, `id="$1-${dest.id}"`).replace(/url\(#([a-z0-9]+)\)/g, `url(#$1-${dest.id})`);
}

function capaBruta(dest, { w = 1080, h = 1920, tam = 780 } = {}) {
  const cx = w / 2, cy = h / 2, x = cx - tam / 2, y = cy - tam / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
  <defs>
    <radialGradient id="f" cx="${cx}" cy="${cy - tam * 0.32}" r="${w * 0.78}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${FUNDO.centro}"/><stop offset=".55" stop-color="${FUNDO.meio}"/><stop offset="1" stop-color="${FUNDO.borda}"/>
    </radialGradient>
    <radialGradient id="g" cx="${cx}" cy="${cy + tam * 0.1}" r="${tam * 0.62}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${T.base}" stop-opacity=".12"/><stop offset="1" stop-color="${T.base}" stop-opacity="0"/>
    </radialGradient>
    ${defs()}
  </defs>
  <rect width="${w}" height="${h}" fill="url(#f)"/>
  <circle cx="${cx}" cy="${cy}" r="${w * 0.5}" fill="url(#g)"/>
  <g transform="translate(${x} ${y}) scale(${tam / 96})">${dest.svg()}</g>
</svg>`;
}

// a peça sozinha, sem fundo, para compor posts (carrossel etc.)
function peca(svg, id) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" overflow="visible"><defs>${defs()}</defs>${svg()}</svg>`
    .replace(/id="([a-z0-9]+)"/g, `id="$1-${id}"`).replace(/url\(#([a-z0-9]+)\)/g, `url(#$1-${id})`);
}

module.exports = { T, FUNDO, DESTAQUES, capa, peca, impressora, hotend };
