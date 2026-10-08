// NYVOS — Instagram: foto de perfil (as capas de destaques ficam em glifos.js)
const C = { carbono: "#1B1D21", mineral: "#F3F2EE", acento: "#F26522" };
const SIMBOLO = "M0 0H30V32H48V64H66V0H96V96H36V64H24V32H12V96H0Z";

// ---------- Perfil ----------
// N em 54% do lado: presença nos tamanhos pequenos do app (feed, comentários, direct) com folga
// até a borda do círculo. Correção ótica: o centro de massa do N fica em (51,9; 49,9) na grade 96,
// à direita e abaixo do centro da caixa; o símbolo recua metade dessa diferença para parecer centrado.
const OTICA = { dx: -1.95, dy: -0.97 };
function perfil({ fundo, simbolo, escala = 0.54 }) {
  const s = 1000 * escala, o = (1000 - s) / 2, k = s / 96;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">
  <rect width="1000" height="1000" fill="${fundo}"/>
  <path transform="translate(${+(o + OTICA.dx * k).toFixed(2)} ${+(o + OTICA.dy * k).toFixed(2)}) scale(${+k.toFixed(4)})" fill="${simbolo}" d="${SIMBOLO}"/>
</svg>`;
}

const PERFIS = {
  "perfil-laranja": { fundo: C.carbono, simbolo: C.acento },
  "perfil-mineral": { fundo: C.carbono, simbolo: C.mineral },
  "perfil-invertido": { fundo: C.acento, simbolo: C.carbono },
  "perfil-claro": { fundo: C.mineral, simbolo: C.carbono },
};

module.exports = { C, SIMBOLO, perfil, PERFIS };
