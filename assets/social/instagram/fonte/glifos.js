// NYVOS — capas de destaques "Estrato"
// Glifos sólidos construídos como o N: só blocos, degraus e cortes retos,
// sombreados com a família de laranjas da marca sobre fundo quase preto.
const { SIMBOLO } = require("./art.js");

const T = { luz: "#FF8A4C", base: "#F26522", esc: "#C94A12" };
const FUNDO = { centro: "#18191C", borda: "#0A0B0D" };

const p = (cor, d, extra = "") => `<path fill="${cor}" ${extra} d="${d}"/>`;

const GLIFOS = {
  "01-sobre": `<g transform="translate(6 6) scale(.875)">${p(T.base, SIMBOLO)}</g>`,

  // galeria 2×2 iluminada em diagonal
  "02-portfolio":
    p(T.luz, "M6 6H44V44H6Z") + p(T.base, "M52 6H90V44H52Z") +
    p(T.base, "M6 52H44V90H6Z") + p(T.esc, "M52 52H90V90H52Z"),

  // bico depositando a camada (quente) sobre as camadas já impressas
  "03-impressao":
    p(T.base, "M28 4H68V28H28Z") + p(T.esc, "M38 28H58L52 42H44Z") +
    p(T.luz, "M8 54H50V64H8Z") + p(T.base, "M8 69H88V79H8Z") + p(T.esc, "M8 84H88V94H8Z"),

  // "A" em blocos sublinhado: seu nome
  "04-personalizados":
    p(T.base, "M12 76V18H24V6H72V18H84V76H64V54H32V76Z M32 38H64V24H32Z", 'fill-rule="evenodd"') +
    p(T.luz, "M12 84H84V92H12Z"),

  // amostras de cor em cascata, descendo como os degraus do N
  "05-cores":
    p(T.luz, "M6 6H52V52H6Z") + p(T.base, "M25 25H71V71H25Z") + p(T.esc, "M44 44H90V90H44Z"),

  // cubo sólido com as três faces na luz da marca
  "06-modelagem":
    p(T.luz, "M48 6L86 28L48 50L10 28Z") + p(T.base, "M10 28L48 50V94L10 72Z") + p(T.esc, "M86 28L48 50V94L86 72Z"),

  // cota técnica sobre peça escalonada
  "07-sob-medida":
    p(T.luz, "M6 8H12V40H6Z M84 8H90V40H84Z M12 21H84V27H12Z M12 24L28 14V34Z M84 24L68 14V34Z") +
    p(T.base, "M6 52H58V68H90V92H6Z"),

  // folha com dobra e linhas vazadas
  "08-orcamento":
    p(T.base, "M14 4H62V24H82V92H14Z M26 44H70V51H26Z M26 58H70V65H26Z M26 72H52V79H26Z", 'fill-rule="evenodd"') +
    p(T.luz, "M62 4L82 24H62Z"),

  // caixa com fita
  "09-entregas":
    p(T.esc, "M6 14H90V34H6Z") + p(T.base, "M12 34H84V92H12Z") + p(T.luz, "M41 14H55V58H41Z"),

  // aspas em degraus
  "10-feedbacks": `<g transform="translate(0 6)">${
    p(T.base, "M8 16H42V64H30V76H12V64H24V52H8Z") + p(T.luz, "M54 16H88V64H76V76H58V64H70V52H54Z")}</g>`,
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
