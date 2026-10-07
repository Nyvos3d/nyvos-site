// NYVOS — Instagram: foto de perfil + capas de destaques (minimal)
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

// ---------- Ícones (grade 96, traço 6, cantos retos, 1 acento laranja) ----------
const L = `fill="none" stroke="${C.mineral}" stroke-width="6" stroke-linecap="butt" stroke-linejoin="miter"`;
const A = `fill="${C.acento}"`;
const AL = `fill="none" stroke="${C.acento}" stroke-width="6" stroke-linecap="butt"`;

const ICONES = {
  "01-sobre": `<path transform="translate(18 18) scale(.625)" fill="${C.acento}" d="${SIMBOLO}"/>`,

  "02-portfolio": `
    <path ${A} d="M48 12L80 30L48 48L16 30Z"/>
    <path ${L} d="M48 12L80 30V66L48 84L16 66V30Z M16 30L48 48L80 30 M48 48V84"/>`,

  "03-impressao": `
    <path ${L} d="M26 14H70V36H26Z M40 36H56L50 48H46Z"/>
    <path ${L} d="M16 84H80 M16 74H80"/>
    <path ${AL} d="M16 64H46"/>`,

  "04-personalizados": `
    <g transform="rotate(45 48 48)">
      <path ${L} d="M40 10H56V62L48 76L40 62Z M40 22H56"/>
      <path ${A} d="M44.5 69.5L48 76L51.5 69.5Z"/>
    </g>
    <path ${L} d="M60 84H82"/>`,

  "05-cores": `
    <path ${L} d="M16 14V82 M80 14V82"/>
    <path ${L} d="M28 30H68 M28 48H68"/>
    <path ${AL} d="M28 66H68"/>`,

  "06-modelagem": `
    <path ${L} d="M14 76C14 52 28 42 48 42C68 42 82 52 82 76"/>
    <path ${L} d="M20 42H76"/>
    <rect x="14" y="38" width="8" height="8" fill="${C.mineral}"/>
    <rect x="74" y="38" width="8" height="8" fill="${C.mineral}"/>
    <rect x="8" y="70" width="12" height="12" fill="${C.mineral}"/>
    <rect x="76" y="70" width="12" height="12" fill="${C.mineral}"/>
    <rect x="41" y="35" width="14" height="14" ${A}/>`,

  "07-sob-medida": `
    <path ${L} d="M12 30H84V66H12Z"/>
    <path ${L} d="M24 30V46 M36 30V40 M48 30V46 M60 30V40"/>
    <path ${AL} d="M72 30V52"/>`,

  "08-orcamento": `
    <path ${L} d="M22 12H60L76 28V84H22Z M60 12V28H76"/>
    <path ${L} d="M34 44H64 M34 56H64"/>
    <path ${AL} d="M34 68H50"/>`,

  "09-entregas": `
    <path ${L} d="M14 30H82V82H14Z M14 30L22 16H74L82 30"/>
    <path ${A} d="M42 30H54V54H42Z"/>`,

  "10-feedbacks": `
    <path fill="${C.mineral}" d="M20 28H44V52L34 70H24L32 52H20Z"/>
    <path ${A} d="M52 28H76V52L66 70H56L64 52H52Z"/>`,
};

// capa 1080x1920: ícone centralizado (o Instagram recorta o círculo central)
function capa(id, { w = 1080, h = 1920, tam = 470 } = {}) {
  const x = (w - tam) / 2, y = (h - tam) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${C.carbono}"/>
  <g transform="translate(${x} ${y}) scale(${tam / 96})">${ICONES[id]}</g>
</svg>`;
}

module.exports = { C, SIMBOLO, perfil, PERFIS, ICONES, capa };
