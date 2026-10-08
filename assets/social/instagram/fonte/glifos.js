// NYVOS — capas de destaques
// Os ícones são renders 3D com o estúdio da impressora do site (icones3d.js → fonte/icones/*.png):
// mesma câmera, mesma luz, mineral e metal lisos e a peça laranja com as linhas de camada.
// A capa só assenta o render no fundo grafite, centrado e com o mesmo tamanho visual em todos.
const fs = require("fs"), path = require("path");

const FUNDO = { centro: "#24272C", meio: "#1B1D21", borda: "#16171A" };
const MEDIDAS = JSON.parse(fs.readFileSync(path.join(__dirname, "icones/medidas.json"), "utf8"));
const TAM = 0.48;   // maior medida do objeto, em fração do círculo do destaque

const DESTAQUES = [
  { id: "01-impressoes", nome: "Impressões", sobre: "Peças saindo da impressora: do modelo 3D à peça pronta" },
  { id: "02-orcamento", nome: "Orçamento", sobre: "Como pedir, prazos, formas de pagamento" },
  { id: "03-clientes", nome: "Clientes", sobre: "Depoimentos, prints de conversa, cliente com a peça" },
  { id: "04-sua-ideia", nome: "Sua ideia", sobre: "Personalizados: o que o cliente pediu → o que entregamos" },
  { id: "05-bastidores", nome: "Bastidores", sobre: "A impressora trabalhando, time-lapses, processo", otica: 1.08 },
  { id: "06-cores", nome: "Cores", sobre: "Filamentos e cores disponíveis" },
  { id: "07-a-nyvos", nome: "A NYVOS", sobre: "Quem está por trás, missão, contatos" },
];

const png = {};
const icone = (id) => (png[id] ??= fs.readFileSync(path.join(__dirname, "icones", `${id}.png`)).toString("base64"));

// capa 1080x1920; o Instagram mostra o círculo central (diâmetro = largura)
function capa(dest, { w = 1080, h = 1920 } = {}) {
  const { caixa: [x0, y0, x1, y1], lado } = MEDIDAS[dest.id];
  // `otica`: compensação para formas altas e finas, que parecem menores com a mesma medida
  const k = (w * TAM * (dest.otica || 1)) / Math.max(x1 - x0, y1 - y0);
  const cx = w / 2, cy = h / 2, f = `f-${dest.id}`;
  const x = cx - k * (x0 + x1) / 2, y = cy - k * (y0 + y1) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
  <defs><radialGradient id="${f}" cx="${cx}" cy="${cy}" r="${Math.max(w, h) * 0.62}" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="${FUNDO.centro}"/><stop offset=".45" stop-color="${FUNDO.meio}"/><stop offset="1" stop-color="${FUNDO.borda}"/>
  </radialGradient></defs>
  <rect width="${w}" height="${h}" fill="url(#${f})"/>
  <image href="data:image/png;base64,${icone(dest.id)}" x="${+x.toFixed(2)}" y="${+y.toFixed(2)}" width="${+(lado * k).toFixed(2)}" height="${+(lado * k).toFixed(2)}"/>
</svg>`;
}

module.exports = { FUNDO, DESTAQUES, capa };
