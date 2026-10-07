// NYVOS — Instagram: foto de perfil (as capas de destaques ficam em glifos.js)
const C = { carbono: "#1B1D21", mineral: "#F3F2EE", acento: "#F26522" };
const SIMBOLO = "M0 0H30V32H48V64H66V0H96V96H36V64H24V32H12V96H0Z";

// ---------- Perfil ----------
// tamanho do símbolo em % do lado: seguro p/ recorte circular e legível em 110px
function perfil({ fundo, simbolo, escala = 0.42 }) {
  const s = 1000 * escala, o = (1000 - s) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">
  <rect width="1000" height="1000" fill="${fundo}"/>
  <path transform="translate(${o} ${o}) scale(${s / 96})" fill="${simbolo}" d="${SIMBOLO}"/>
</svg>`;
}

const PERFIS = {
  "perfil-laranja": { fundo: C.carbono, simbolo: C.acento },
  "perfil-mineral": { fundo: C.carbono, simbolo: C.mineral },
  "perfil-invertido": { fundo: C.acento, simbolo: C.carbono },
  "perfil-claro": { fundo: C.mineral, simbolo: C.carbono },
};

module.exports = { C, SIMBOLO, perfil, PERFIS };
