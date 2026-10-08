// NYVOS — capas de destaques, linha minimalista
// Mesma linguagem do carrossel: fundo grafite, desenho em traço único claro com cantos
// retos (como o N) e um só detalhe laranja por ícone, sempre no que importa: a peça
// impressa, o total do orçamento, a estrela, a luz, as camadas, o filamento, o N.
const { SIMBOLO } = require("./art.js");

const T = { base: "#F26522", min: "#F3F2EE", carbono: "#1B1D21" };
const FUNDO = { centro: "#24272C", meio: "#1B1D21", borda: "#16171A" };
const S = 4.5;      // espessura do traço (grade 96): ~2,5 pt no círculo do destaque no celular

const fx = (n) => +n.toFixed(2);

// escala/desloca caminhos absolutos (M L H V Z)
function reposiciona(d, s, tx, ty) {
  return d.replace(/([MLHVZ])([^MLHVZ]*)/g, (_, c, args) => {
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

// `esc`: escala do ícone em curso; o traço é compensado para ficar igual em todos
let esc = 1;
const linha = (d, cor = T.min, l = S) =>
  `<path d="${d}" fill="none" stroke="${cor}" stroke-width="${fx(l / esc)}" stroke-linejoin="miter" stroke-miterlimit="4"/>`;
const cheio = (d, cor = T.min) => `<path d="${d}" fill="${cor}"/>`;
const anel = (r, cor = T.min, l = S) => `<circle cx="48" cy="48" r="${r}" fill="none" stroke="${cor}" stroke-width="${fx(l / esc)}"/>`;
const centra = (dx, dy, conteudo) => `<g transform="translate(${dx} ${dy})">${conteudo}</g>`;
// iguala o tamanho ótico dos ícones: escala em torno do centro sem engrossar ou afinar o traço
function escala(k, desenho) {
  esc = k;
  const s = desenho();
  esc = 1;
  return `<g transform="translate(48 48) scale(${k}) translate(-48 -48)">${s}</g>`;
}

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

// a nota do orçamento: dois itens e o total em laranja
const orcamento = () =>
  linha("M31 23H65V71L59.33 67L53.67 71L48 67L42.33 71L36.67 67L31 71Z") +
  linha("M38.5 35H57.5") + linha("M38.5 44H51") + linha("M38.5 56H57.5", T.base);

// o depoimento: balão com a estrela
const clientes = () => escala(0.93, () =>
  linha("M23 25H73V63H45L33 73V63H23Z") + cheio(estrela(48, 44, 11.5, 4.8), T.base));

// a ideia: a lâmpada acesa
const BULBO = "M40 58V55C40 50 31 47.5 31 38.5A17 17 0 0 1 65 38.5C65 47.5 56 50 56 55V58Z";
const ideia = () => centra(0, 2.5, cheio(BULBO, T.base) + linha(BULBO) + linha("M41 65H55") + linha("M44 71.5H52"));

// o processo: o bico depositando as camadas
const bastidores = () => centra(0, 4.25,
  linha("M36 22H60") + linha("M36 28.5H60") + linha("M36 35H60") + linha("M48 22V40") +
  cheio("M37 38H59V49H37Z") + cheio("M43.5 49H52.5L48 56Z") +
  linha("M24 65.5H72", T.base) + linha("M24 59H48", T.base));

// as cores: o carretel com o filamento enrolado e a ponta saindo
const cores = () => centra(-2, 0, anel(23) + anel(14.5, T.base, 7.5) + anel(6.5) + linha("M48 62.5H76", T.base));

// a marca
const nyvos = () => cheio(reposiciona(SIMBOLO, 40 / 96, 28, 28), T.base);

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
