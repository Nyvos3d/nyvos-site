// NYVOS — capas de destaques "Estrato"
// Glifos sólidos, geometria reta como a do N, sombreados com os três laranjas
// da marca + mineral como segunda cor, sobre fundo quase preto.
const { SIMBOLO } = require("./art.js");

const T = { luz: "#FF8A4C", base: "#F26522", esc: "#C94A12", min: "#F3F2EE" };
const FUNDO = { centro: "#18191C", borda: "#0A0B0D" };

const p = (cor, d, extra = "") => `<path fill="${cor}" ${extra} d="${d}"/>`;

// estrela de 5 pontas centrada em (cx, cy)
function estrela(cx, cy, R, r) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = (-90 + 36 * i) * Math.PI / 180, k = i % 2 ? r : R;
    pts.push(`${(cx + k * Math.cos(a)).toFixed(2)} ${(cy + k * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
}

// cubo isométrico: vértices visíveis e arestas
const V = { topo: [48, 8], dirS: [84, 28], dirI: [84, 68], base: [48, 88], esqI: [12, 68], esqS: [12, 28], frente: [48, 48] };
const ARESTAS = [["topo", "dirS"], ["dirS", "dirI"], ["dirI", "base"], ["base", "esqI"], ["esqI", "esqS"], ["esqS", "topo"],
  ["esqS", "frente"], ["dirS", "frente"], ["frente", "base"]];

const GLIFOS = {
  // a marca
  "01-sobre": `<g transform="translate(6 6) scale(.875)">${p(T.base, SIMBOLO)}</g>`,

  // moldura de foto com montanha em degraus (os degraus do N) e sol
  "02-portfolio":
    p(T.base, "M6 14H90V82H6Z M14 22V74H82V22Z", 'fill-rule="evenodd"') +
    p(T.luz, "M14 74V60H30V48H46V36H60V52H70V62H82V74Z") +
    p(T.min, "M66 28H76V38H66Z"),

  // hotend (aletas, bloco, bico), fio saindo e peça sendo impressa
  "03-impressao":
    p(T.esc, "M30 6H66V11H30Z M30 15H66V20H30Z M30 24H66V29H30Z") +
    p(T.base, "M24 33H72V49H24Z") +
    p(T.luz, "M40 49H56L52 58H44Z") +
    p(T.min, "M12 62H52V70H12Z") +
    p(T.base, "M12 74H84V82H12Z") +
    p(T.esc, "M12 86H84V94H12Z"),

  // lápis + brilho: sua arte, feita pra você
  "04-personalizados":
    `<g transform="translate(57 53) rotate(45) scale(1.12)">` +
      p(T.esc, "M-10 -45H10V-35H-10Z") +
      p(T.luz, "M-10 -32H0V15H-10Z") + p(T.base, "M0 -32H10V15H0Z") +
      p(T.min, "M-10 15H10L0 37Z") +
      p(T.esc, "M-3.6 29L0 37L3.6 29Z") +
    `</g>` +
    p(T.min, "M22 6L25.5 18.5L38 22L25.5 25.5L22 38L18.5 25.5L6 22L18.5 18.5Z"),

  // leque de amostras de cor
  "05-cores":
    [[-6, T.esc], [24, T.base], [54, T.min]]
      .map(([ang, cor]) => `<g transform="rotate(${ang} 26 82)">${p(cor, "M14 6H38V82H14Z")}</g>`).join("") +
    `<circle cx="26" cy="76" r="5" fill="${FUNDO.borda}"/>`,

  // cubo em wireframe com vértices, como num software 3D
  "06-modelagem":
    p(T.base, "M48 8L84 28L48 48L12 28Z", 'opacity=".22"') +
    ARESTAS.map(([a, b]) => `<line x1="${V[a][0]}" y1="${V[a][1]}" x2="${V[b][0]}" y2="${V[b][1]}" stroke="${T.base}" stroke-width="5"/>`).join("") +
    Object.entries(V).map(([k, [x, y]]) => k === "frente"
      ? `<rect x="${x - 8}" y="${y - 8}" width="16" height="16" fill="${T.min}"/>`
      : `<rect x="${x - 6}" y="${y - 6}" width="12" height="12" fill="${T.luz}"/>`).join(""),

  // cota técnica sobre peça escalonada
  "07-sob-medida":
    p(T.min, "M6 6H13V40H6Z M83 6H90V40H83Z M13 20H83V26H13Z M13 23L31 10V36Z M83 23L65 10V36Z") +
    p(T.base, "M6 92V52H56V68H90V92Z"),

  // calculadora: visor mineral, teclas vazadas, "=" em destaque
  "08-orcamento":
    p(T.base, "M14 4H82V92H14Z" +
      " M25 42H38V53H25Z M41.5 42H54.5V53H41.5Z M58 42H71V53H58Z" +
      " M25 59H38V70H25Z M41.5 59H54.5V70H41.5Z M58 59H71V70H58Z" +
      " M25 76H38V87H25Z M41.5 76H54.5V87H41.5Z", 'fill-rule="evenodd"') +
    p(T.min, "M24 13H72V32H24Z") +
    p(T.luz, "M58 76H71V87H58Z"),

  // caminhão com baú e cabine
  "09-entregas":
    p(T.base, "M4 18H58V70H4Z") +
    p(T.esc, "M60 32H76L90 48V70H60Z M66 38V48H82L75 38Z", 'fill-rule="evenodd"') +
    [22, 74].map((cx) => `<circle cx="${cx}" cy="74" r="11" fill="${T.min}"/><circle cx="${cx}" cy="74" r="4" fill="${FUNDO.borda}"/>`).join(""),

  // balão de fala com estrela de avaliação
  "10-feedbacks":
    p(T.base, "M6 10H90V70H42L24 88V70H6Z") +
    p(T.min, estrela(48, 41, 21, 8.6)),
};

// capa: fundo quase preto com luz central, brilho laranja discreto e glifo centralizado
function capaEstrato(id, { w = 1080, h = 1920, tam = 440, anel = true } = {}) {
  const cx = w / 2, cy = h / 2, x = cx - tam / 2, y = cy - tam / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
  <defs>
    <radialGradient id="f" cx="${cx}" cy="${cy}" r="${w * 0.62}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${FUNDO.centro}"/><stop offset="1" stop-color="${FUNDO.borda}"/>
    </radialGradient>
    <radialGradient id="g" cx="${cx}" cy="${cy}" r="${tam * 0.95}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${T.base}" stop-opacity=".16"/><stop offset="1" stop-color="${T.base}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#f)"/>
  <circle cx="${cx}" cy="${cy}" r="${tam * 0.95}" fill="url(#g)"/>
  ${anel ? `<circle cx="${cx}" cy="${cy}" r="${w * 0.4}" fill="none" stroke="${T.base}" stroke-opacity=".28" stroke-width="2"/>` : ""}
  <g transform="translate(${x} ${y}) scale(${tam / 96})">${GLIFOS[id]}</g>
</svg>`;
}

module.exports = { T, FUNDO, GLIFOS, capaEstrato };
