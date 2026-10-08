// NYVOS — capas de destaques, 3D minimalista
// Cada ícone é uma peça impressa em perspectiva isométrica, com faces chapadas (esquerda clara,
// topo intermediário, direita na sombra), as linhas de camada à mostra e um só elemento
// laranja: o topo do cubo, a moeda de cima, a estrela, a lâmpada, a peça, o filamento, o N.
const { SIMBOLO } = require("./art.js");
const { MAT, caixa, prisma, torno, cena } = require("./iso.js");

const T = { base: "#F26522", min: "#F3F2EE", carbono: "#1B1D21" };
const FUNDO = { centro: "#24272C", meio: "#1B1D21", borda: "#16171A" };
const S = 4.5;      // espessura do traço da versão A (grade 96)

const fx = (n) => +n.toFixed(2);

// traço e preenchimento planos (versão A de Impressões e o cubo B, desenhados à mão)
const linha = (d, cor = T.min, l = S) =>
  `<path d="${d}" fill="none" stroke="${cor}" stroke-width="${l}" stroke-linejoin="miter" stroke-miterlimit="4"/>`;
const cheio = (d, cor = T.min) => `<path d="${d}" fill="${cor}"/>`;

// ---------- os sete ícones (grade 96, centro 48,48) ----------

// Impressões: a peça impressa em 3D, um cubo isométrico com as camadas à mostra e a
// última camada (o topo) em laranja. Três versões: traço (A), volume chapado (B) e a
// impressora real do site em miniatura (C)
const ISO = (() => {
  const s = 26, c = fx(0.866 * s), y0 = 48 - s;          // aresta, meia largura, topo
  const p = { t: [48, y0], d: [48 + c, y0 + s / 2], f: [48, y0 + s], e: [48 - c, y0 + s / 2] };
  const pt = ([x, y], dy = 0) => `${fx(x)} ${fx(y + dy)}`;
  return {
    s, p, pt,
    topo: `M${pt(p.t)}L${pt(p.d)}L${pt(p.f)}L${pt(p.e)}Z`,
    esq: `M${pt(p.e)}L${pt(p.f)}L${pt(p.f, s)}L${pt(p.e, s)}Z`,
    dir: `M${pt(p.f)}L${pt(p.d)}L${pt(p.d, s)}L${pt(p.f, s)}Z`,
    contorno: `M${pt(p.t)}L${pt(p.d)}L${pt(p.d, s)}L${pt(p.f, s)}L${pt(p.e, s)}L${pt(p.e)}Z`,
    // camadas: linhas paralelas às arestas de baixo, nas duas faces laterais
    camadas: (n) => Array.from({ length: n - 1 }, (_, k) => {
      const dy = fx(s * (k + 1) / n);
      return `M${pt(p.e, dy)}L${pt(p.f, dy)}L${pt(p.d, dy)}`;
    }).join(""),
  };
})();

const cuboTraco = () =>
  cheio(ISO.topo, T.base) + linha(ISO.contorno) +
  linha(`M${ISO.pt(ISO.p.e)}L${ISO.pt(ISO.p.f)}L${ISO.pt(ISO.p.d)}M${ISO.pt(ISO.p.f)}L${ISO.pt(ISO.p.f, ISO.s)}`) +
  linha(ISO.camadas(3), T.min, 3.2);

// o N gravado no topo, de frente para quem olha: alinhado à diagonal horizontal do topo e
// achatado pela perspectiva isométrica (vertical × 0,577)
const N_TOPO = (() => {
  const w = 15, k = w / 96, cy = ISO.p.f[1] - ISO.s / 2;
  return `<path d="${SIMBOLO}" fill="#C94A12" transform="matrix(${fx(k)} 0 0 ${fx(k * 0.577)} ${fx(48 - w / 2)} ${fx(cy - w * 0.577 / 2)})"/>`;
})();

const cuboVolume = () =>
  cheio(ISO.esq, T.min) + cheio(ISO.dir, "#A9AAA6") + cheio(ISO.topo, T.base) + N_TOPO +
  `<path d="${ISO.camadas(5)}" fill="none" stroke="${T.carbono}" stroke-opacity=".34" stroke-width="1.3"/>` +
  `<path d="M${ISO.pt(ISO.p.e)}L${ISO.pt(ISO.p.f)}L${ISO.pt(ISO.p.d)}M${ISO.pt(ISO.p.f)}L${ISO.pt(ISO.p.f, ISO.s)}" fill="none" stroke="${T.carbono}" stroke-opacity=".35" stroke-width=".8"/>`;

// a impressora 3D do site (quadro de quadros.js com a peça pronta), sem fundo
const IMP_SITE = `data:image/webp;base64,${require("fs").readFileSync(require("path").join(__dirname, "impressora/impressora-100.webp")).toString("base64")}`;
const impressoraSite = () => {
  const h = 62, w = fx(h * 2045 / 2160);
  return `<image href="${IMP_SITE}" x="${fx(48 - w / 2)}" y="${48 - h / 2}" width="${w}" height="${h}"/>`;
};

// ---------- os outros seis, no mesmo 3D minimalista do cubo (motor em iso.js) ----------
const CAMADA = { L: 5.2 };                       // altura de camada: a mesma do cubo (26 / 5)

// contorno do N a partir do SIMBOLO (só M, H, V, Z), com v para cima
const N_CONTORNO = (() => {
  const pts = []; let x = 0, y = 0;
  for (const [, c, a] of SIMBOLO.matchAll(/([MHVZ])([^MHVZ]*)/g)) {
    const n = a.trim() ? a.trim().split(/[\s,]+/).map(Number) : [];
    if (c === "M") [x, y] = n; else if (c === "H") x = n[0]; else if (c === "V") y = n[0]; else continue;
    pts.push([x, 96 - y]);
  }
  return pts;
})();

// Orçamento: a pilha de moedas; a de cima, laranja, com o cifrão gravado
const CIFRAO = "M5 -4.2C4.2 -6 2.5 -6.6 0 -6.6C-3 -6.6 -5 -5.2 -5 -3.2C-5 -1 -2.8 -.4 0 0C2.8 .4 5 1.2 5 3.4C5 5.4 3 6.6 0 6.6C-2.6 6.6 -4.4 5.8 -5.2 4M0 -9V9";
const orcamento = () => {
  const r = 16, h = CAMADA.L, desloc = [[0, 0], [.9, -.7], [-.6, .5], [.4, -.3]];
  const moedas = desloc.map(([ox, oz], i) => ({
    faces: torno([[r, 0], [r, h]], { c: [ox, i * h, oz], m: i === 3 ? MAT.laranja : MAT.mineral, camada: { L: h, base: .7 } }),
  }));
  const [ox, oz] = desloc[3];
  moedas[3].extra = (proj) => {
    const [cx, cy] = proj([ox, 4 * h, oz]), k = 1.2;
    return `<path d="${CIFRAO}" fill="none" stroke="#C94A12" stroke-width="2.3" transform="matrix(${k} 0 0 ${fx(k * 0.577)} ${fx(cx)} ${fx(cy)})"/>`;
  };
  return cena(moedas, { tam: 48 });
};

// Clientes: o balão do depoimento com a estrela em relevo, virado para quem olha
const clientes = () => {
  const balao = [[-16, 0], [-10, 0], [-13, -7], [-4, 0], [16, 0], [16, 22], [-16, 22]];
  const est = Array.from({ length: 10 }, (_, i) => {
    const a = Math.PI / 2 + i * Math.PI / 5, k = i % 2 ? 3.8 : 9;
    return [k * Math.cos(a), 11 + k * Math.sin(a)];
  });
  const cam = { L: CAMADA.L, base: -7 }, giro = { giro: 30 };
  return cena([
    { faces: prisma(balao, -3.5, 3.5, MAT.mineral, cam, giro) },
    { faces: prisma(est, 3.5, 6.3, MAT.laranja, cam, giro) },
  ], { tam: 50 });
};

// Sua ideia: a lâmpada acesa; a rosca da base é feita das próprias camadas
const ideia = () => cena([
  { faces: torno([[2.8, 0], [2.8, 2.6]], { m: MAT.carbono }) },
  { faces: torno([[6.2, 2.6], [6.2, 13], [7.2, 13], [7.2, 15.6]], { m: MAT.mineral, camada: { L: 2.6 } }) },
  { faces: torno([[6.6, 15.6], [8.4, 19], [11.6, 23], [14, 27.5], [15, 32], [14.5, 36.5], [12.8, 40.5], [10, 43.6], [6, 45.8], [0, 46.6]],
    { m: MAT.laranja, camada: { L: CAMADA.L, base: 15.6 } }) },
], { tam: 55 });

// Bastidores: o bico depositando a camada em andamento sobre a peça
const bastidores = () => cena([
  { faces: caixa([-14, 0, -8], [28, 10.4, 16], MAT.laranja, CAMADA) },
  { faces: caixa([-14, 10.4, -8], [15, 5.2, 16], MAT.laranja, CAMADA) },
  { faces: torno([[1.3, 0], [5, 7.5]], { c: [1, 16.1, 0], m: MAT.mineral }) },
  { faces: caixa([-5, 23.6, -6], [12, 7, 12], MAT.mineral) },
  { faces: torno([[2.2, 0], [2.2, 14]], { c: [1, 30.6, 0], m: MAT.carbono }) },
  ...[0, 1, 2].map((k) => ({ faces: caixa([-7, 33.6 + k * 4.6, -7], [16, 1.5, 14], MAT.mineral) })),
], { tam: 55 });

// Cores: o carretel deitado, com o filamento laranja enrolado entre as abas
const cores = () => cena([
  { faces: torno([[17, -9], [17, -6.6]], { eixo: "z", m: MAT.mineral }) },
  { faces: torno([[12, -6.6], [12, 6.6]], { eixo: "z", m: MAT.laranja, camada: { L: 2.2, base: -6.6, eixo: 2 } }) },
  { faces: torno([[17, 6.6], [17, 9]], { eixo: "z", m: MAT.mineral }) },
  { faces: torno([[4.6, 9], [4.6, 9.4]], { eixo: "z", m: MAT.carbono }) },
], { tam: 50 });

// A NYVOS: o N impresso em pé
const nyvos = () => {
  const k = 30 / 96;
  return cena([{ faces: prisma(N_CONTORNO.map(([x, y]) => [x * k - 15, y * k]), -4.5, 4.5, MAT.laranja, { L: 7.5 }, { giro: 30 }) }], { tam: 50 });
};

const DESTAQUES = [
  { id: "01-impressoes", nome: "Impressões", sobre: "Peças saindo da impressora: do modelo 3D à peça pronta", svg: cuboVolume },
  { id: "02-orcamento", nome: "Orçamento", sobre: "Como pedir, prazos, formas de pagamento", svg: orcamento },
  { id: "03-clientes", nome: "Clientes", sobre: "Depoimentos, prints de conversa, cliente com a peça", svg: clientes },
  { id: "04-sua-ideia", nome: "Sua ideia", sobre: "Personalizados: o que o cliente pediu → o que entregamos", svg: ideia },
  { id: "05-bastidores", nome: "Bastidores", sobre: "A impressora trabalhando, time-lapses, processo", svg: bastidores },
  { id: "06-cores", nome: "Cores", sobre: "Filamentos e cores disponíveis", svg: cores },
  { id: "07-a-nyvos", nome: "A NYVOS", sobre: "Quem está por trás, missão, contatos", svg: nyvos },
];

// ---------- capa ----------
// capa 1080x1920; o Instagram mostra o círculo central (diâmetro = largura).
// O ícone ocupa ~45% do círculo: respiro de marca grande, legível em ~64 pt.
function capa(dest, { w = 1080, h = 1920, tam = 900 } = {}) {
  const cx = w / 2, cy = h / 2, x = cx - tam / 2, y = cy - tam / 2, f = `f-${dest.id}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
  <defs><radialGradient id="${f}" cx="${cx}" cy="${cy}" r="${Math.max(w, h) * 0.62}" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="${FUNDO.centro}"/><stop offset=".45" stop-color="${FUNDO.meio}"/><stop offset="1" stop-color="${FUNDO.borda}"/>
  </radialGradient></defs>
  <rect width="${w}" height="${h}" fill="url(#${f})"/>
  <g transform="translate(${x} ${y}) scale(${tam / 96})">${dest.svg()}</g>
</svg>`;
}

// as outras versões de Impressões, para trocar se preferir
const ALTERNATIVAS = [
  { id: "01-impressoes-a-traco", nome: "Impressões", svg: cuboTraco },
  { id: "01-impressoes-b-volume", nome: "Impressões", svg: cuboVolume },
  { id: "01-impressoes-c-impressora", nome: "Impressões", svg: impressoraSite },
];

module.exports = { T, FUNDO, DESTAQUES, ALTERNATIVAS, capa };
