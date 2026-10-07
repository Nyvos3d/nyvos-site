// NYVOS — capas de destaques "Camadas"
// Tudo o que é peça impressa aparece fatiado em camadas (passo 8, fresta 2) e
// aquece de baixo para cima: laranja escuro na base, laranja claro na camada
// que acabou de sair do bico. Máquina e detalhes ficam sólidos; o mineral é a luz.
const { SIMBOLO } = require("./art.js");

const T = { luz: "#FF8A4C", base: "#F26522", esc: "#B8410E", min: "#F3F2EE" };
const FUNDO = { centro: "#1A1B1F", borda: "#08090B" };
const PASSO = 8, FRESTA = 2;

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mistura = (a, b, t) => "#" + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t).toString(16).padStart(2, "0")).join("");

// cor de cada camada: luz no topo, base no meio, escuro embaixo
function corCamada(k, n) {
  const t = k / (n - 1);
  return t < 0.5 ? mistura(T.luz, T.base, t * 2) : mistura(T.base, T.esc, (t - 0.5) * 2);
}

// elementos: F = peça fatiada, S = sólido, L = traço
const F = (d, o = {}) => ({ tipo: "F", d, ...o });
const S = (cor, d, o = {}) => ({ tipo: "S", cor, d, ...o });
const L = (cor, d, larg, o = {}) => ({ tipo: "L", cor, d, larg, ...o });

function estrela(cx, cy, R, r, pontas = 5) {
  const pts = [];
  for (let i = 0; i < pontas * 2; i++) {
    const a = (-90 + (180 / pontas) * i) * Math.PI / 180, k = i % 2 ? r : R;
    pts.push(`${(cx + k * Math.cos(a)).toFixed(2)} ${(cy + k * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
}
const circulo = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;

// carretel visto de frente: disco, janelas e cubo vazados
const carretel = (cx, cy, r) => [circulo(cx, cy, r), circulo(cx, cy, r * 0.34),
  ...[0, 120, 240].map((a) => {
    const t = (a - 90) * Math.PI / 180, d = r * 0.66;
    return circulo(+(cx + d * Math.cos(t)).toFixed(2), +(cy + d * Math.sin(t)).toFixed(2), r * 0.17);
  })].join(" ");

const DESTAQUES = [
  {
    id: "01-pecas", nome: "Peças", sobre: "Portfólio: as peças prontas, bem fotografadas",
    // vaso em camadas sobre pedestal, com um brilho de peça acabada
    el: [
      S(T.esc, "M14 80H82V96H14Z"),
      F("M30 8H66V16H60C60 24 76 32 76 48C76 64 66 72 60 72H36C30 72 20 64 20 48C20 32 36 24 36 16H30Z"),
      S(T.min, estrela(84, 12, 10, 2.6, 4)),
    ],
  },
  {
    id: "02-orcamento", nome: "Orçamento", sobre: "Como pedir, prazos, formas de pagamento",
    // etiqueta de preço com cifrão desenhado na geometria em degraus do N
    el: [
      F("M22 28L48 2L74 28V88H22Z " + circulo(48, 24, 6), { evenodd: true }),
      L(T.min, "M60 42H36V58H60V74H36 M48 34V82", 6),
    ],
  },
  {
    id: "03-clientes", nome: "Clientes", sobre: "Depoimentos, prints de conversa, cliente com a peça",
    el: [
      F("M8 8H88V64H44L24 86V64H8Z"),
      S(T.min, estrela(48, 36, 21, 8.6)),
    ],
  },
  {
    id: "04-sua-ideia", nome: "Sua ideia", sobre: "Personalizados: o que o cliente pediu → o que entregamos",
    // lâmpada cuja rosca nasce das próprias camadas; o filamento é o N
    el: [
      F("M36 61.3A28 28 0 1 1 60 61.3V88H36Z M42 88H54V96H42Z"),
      S(T.min, SIMBOLO, { t: "translate(37 25) scale(.23)" }),
    ],
  },
  {
    id: "05-do-zero", nome: "Do zero", sobre: "Modelagem 3D: do desenho na tela à peça",
    // cubo isométrico meio impresso: camadas seguem as faces, o resto é o modelo
    iso: true,
    el: [
      F("M12 48L48 68V88L12 68Z", { cor: T.base }),
      F("M48 68L84 48V68L48 88Z", { cor: T.esc }),
      S(T.luz, "M48 28L84 48L48 68L12 48Z"),
      L(T.min, "M48 8L84 28L48 48L12 28Z M12 28V48 M84 28V48 M48 48V68", 1.6, { opacidade: 0.6, tracejado: "3 2.4" }),
      ...[[48, 8], [84, 28], [48, 48], [12, 28]].map(([x, y]) => S(T.min, `M${x - 3.5} ${y - 3.5}h7v7h-7Z`)),
    ],
  },
  {
    id: "06-bastidores", nome: "Bastidores", sobre: "A impressora trabalhando, time-lapses, processo",
    // impressora de frente com a peça a meio caminho; máquina sólida, só a peça tem camadas
    el: [
      S(T.esc, "M6 6H90V14H82V96H74V14H22V96H14V14H6Z"),
      S(T.esc, "M22 38H74V44H22Z"),
      S(T.min, "M38 30H58V50H38Z"),
      S(T.luz, "M43 50H53L50 57H46Z"),
      F("M30 72H66V88H30Z M30 64H50V70H30Z"),
      S(T.base, "M22 88H74V96H22Z"),
    ],
  },
  {
    id: "07-cores", nome: "Cores", sobre: "Filamentos e cores disponíveis",
    // três carretéis de filamento, cada um de uma cor (material: sólido, sem camadas)
    el: [
      S(T.luz, carretel(48, 26, 22), { evenodd: true }),
      S(T.esc, carretel(26, 68, 22), { evenodd: true }),
      S(T.min, carretel(70, 68, 22), { evenodd: true }),
    ],
  },
  {
    id: "08-a-nyvos", nome: "A NYVOS", sobre: "Quem está por trás, missão, contatos",
    el: [F(SIMBOLO, { t: "translate(6 6) scale(.875)" })],
  },
];

// frestas das camadas: horizontais (peças de frente) ou seguindo as faces do cubo
function mascara(iso) {
  if (!iso) {
    const faixas = Array.from({ length: 13 }, (_, k) => `<rect x="-20" y="${k * PASSO}" width="136" height="${PASSO - FRESTA}" fill="#fff"/>`).join("");
    return `<mask id="camadas" maskUnits="userSpaceOnUse" x="-20" y="-20" width="136" height="136">${faixas}</mask>`;
  }
  const linhas = [5, 10, 15].map((h) => `<path d="M12 ${68 - h}L48 ${88 - h}L84 ${68 - h}" stroke="#000" stroke-width="1.5" fill="none"/>`).join("");
  return `<mask id="camadas" maskUnits="userSpaceOnUse" x="-20" y="-20" width="136" height="136"><rect x="-20" y="-20" width="136" height="136" fill="#fff"/>${linhas}</mask>`;
}

function gradiente() {
  const n = 12, stops = [];
  for (let k = 0; k < n; k++) {
    const c = corCamada(k, n), a = (k * PASSO / 96).toFixed(4), b = (((k + 1) * PASSO) / 96).toFixed(4);
    stops.push(`<stop offset="${a}" stop-color="${c}"/><stop offset="${b}" stop-color="${c}"/>`);
  }
  return `<linearGradient id="calor" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="96">${stops.join("")}</linearGradient>`;
}

function desenha(e, brilho = false) {
  const tr = e.t ? ` transform="${e.t}"` : "";
  const regra = e.evenodd ? ' fill-rule="evenodd"' : "";
  if (e.tipo === "L") {
    if (brilho) return "";
    return `<path${tr} d="${e.d}" fill="none" stroke="${e.cor}" stroke-width="${e.larg}" stroke-linecap="butt" stroke-linejoin="miter"${e.tracejado ? ` stroke-dasharray="${e.tracejado}"` : ""}${e.opacidade ? ` opacity="${e.opacidade}"` : ""}/>`;
  }
  if (brilho) return e.tipo === "F" || e.cor !== T.min ? `<path${tr}${regra} fill="${T.base}" d="${e.d}"/>` : "";
  if (e.tipo === "F") return `<path${tr}${regra} fill="${e.cor || "url(#calor)"}" mask="url(#camadas)" d="${e.d}"/>`;
  return `<path${tr}${regra} fill="${e.cor}" d="${e.d}"/>`;
}

function glifo(dest) {
  return `<g filter="url(#halo)" opacity=".55">${dest.el.map((e) => desenha(e, true)).join("")}</g>` +
    dest.el.map((e) => desenha(e)).join("");
}

// capa 1080x1920; o Instagram mostra o círculo central
function capa(dest, opcoes) {
  return capaBruta(dest, opcoes).replace(/id="([a-z]+)"/g, `id="$1-${dest.id}"`).replace(/url\(#([a-z]+)\)/g, `url(#$1-${dest.id})`);
}

function capaBruta(dest, { w = 1080, h = 1920, tam = 640 } = {}) {
  const cx = w / 2, cy = h / 2, x = cx - tam / 2, y = cy - tam / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
  <defs>
    <radialGradient id="f" cx="${cx}" cy="${cy}" r="${w * 0.6}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${FUNDO.centro}"/><stop offset="1" stop-color="${FUNDO.borda}"/>
    </radialGradient>
    <radialGradient id="g" cx="${cx}" cy="${cy + tam * 0.12}" r="${tam * 0.85}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${T.base}" stop-opacity=".13"/><stop offset="1" stop-color="${T.base}" stop-opacity="0"/>
    </radialGradient>
    <filter id="halo" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="5"/></filter>
    ${gradiente()}
    ${mascara(dest.iso)}
  </defs>
  <rect width="${w}" height="${h}" fill="url(#f)"/>
  <circle cx="${cx}" cy="${cy}" r="${w * 0.47}" fill="url(#g)"/>
  <circle cx="${cx}" cy="${cy}" r="${w * 0.462}" fill="none" stroke="${T.base}" stroke-opacity=".22" stroke-width="2"/>
  <g transform="translate(${x} ${y}) scale(${tam / 96})">${glifo(dest)}</g>
</svg>`;
}

module.exports = { T, FUNDO, DESTAQUES, capa };
