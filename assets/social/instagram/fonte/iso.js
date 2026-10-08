// NYVOS — motor isométrico dos ícones 3D dos destaques
// Projeção isométrica (30°), faces chapadas sem degradê: a luz vem da esquerda, então a face
// voltada para a esquerda (+z) é a mais clara, o topo (+y) intermediário e a direita (+x) a
// sombra, igual ao cubo de Impressões. Faces verticais ganham as linhas de camada da impressão.
// Eixos: x desce para a direita, z desce para a esquerda, y sobe.
const R3 = Math.sqrt(3) / 2;
const fx = (n) => +n.toFixed(2);
const OLHO = [1, 1, 1];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const unit = (v) => { const l = Math.hypot(...v) || 1; return v.map((c) => c / l); };
const proj = ([x, y, z]) => [(x - z) * R3, -y + (x + z) * 0.5];

// materiais: tom da face voltada para a esquerda (e), para cima (t) e para a direita (d)
const MAT = {
  mineral: { e: "#F3F2EE", t: "#DEDDD8", d: "#A9AAA6", sulco: .34 },
  laranja: { e: "#F26522", t: "#F26522", d: "#BC4C12", sulco: .2 },
  carbono: { e: "#3A3D44", t: "#2C2F35", d: "#1F2125", sulco: 0 },
};
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgb = (c) => "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
function tom(m, n) {
  const w = [Math.max(0, n[2]), Math.max(0, n[1]), Math.max(0, n[0])], s = w[0] + w[1] + w[2] || 1;
  const cs = [m.e, m.t, m.d].map(hex);
  return rgb([0, 1, 2].map((i) => (w[0] * cs[0][i] + w[1] * cs[1][i] + w[2] * cs[2][i]) / s));
}

// ---------- primitivas (só as faces voltadas para quem olha) ----------
const visivel = (f) => dot(f.n, OLHO) > 1e-4;

function caixa([x0, y0, z0], [dx, dy, dz], m, camada) {
  const [x1, y1, z1] = [x0 + dx, y0 + dy, z0 + dz];
  return [
    { p: [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], n: [0, 1, 0], m, camada },
    { p: [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], n: [1, 0, 0], m, camada },
    { p: [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], n: [0, 0, 1], m, camada },
  ].map((f) => ({ ...f, convexo: true }));
}

// contorno 2D (u para a direita, v para cima) extrudado de z0 até z1; a frente fica em z1.
// `giro`: gira a peça em torno do eixo vertical (graus) para a frente encarar quem olha;
// 30° deixa a frente quase de frente (só ~9° de inclinação) e mostra a espessura na lateral
function prisma(contorno, z0, z1, m, camada, { giro = 0, pos = [0, 0, 0] } = {}) {
  let area = 0;
  contorno.forEach(([u, v], i) => { const [u2, v2] = contorno[(i + 1) % contorno.length]; area += u * v2 - u2 * v; });
  const c = area < 0 ? [...contorno].reverse() : contorno;             // anti-horário
  const g = giro * Math.PI / 180, cg = Math.cos(g), sg = Math.sin(g);
  const rot = ([x, y, z]) => [x * cg + z * sg, y, -x * sg + z * cg];
  const ponto = (u, v, z) => rot([u, v, z]).map((w, q) => w + pos[q]);
  const faces = [{ p: c.map(([u, v]) => ponto(u, v, z1)), n: rot([0, 0, 1]), m, camada }];
  c.forEach(([u, v], i) => {
    const [u2, v2] = c[(i + 1) % c.length];
    faces.push({ p: [ponto(u, v, z0), ponto(u2, v2, z0), ponto(u2, v2, z1), ponto(u, v, z1)], n: rot(unit([v2 - v, -(u2 - u), 0])), m, camada });
  });
  return faces.filter(visivel);
}

// sólido de revolução: perfil [[raio, altura], ...] em torno do eixo y (de pé) ou z (deitado)
function torno(perfil, { c = [0, 0, 0], eixo = "y", seg = 72, m, camada }) {
  const pt = (r, h, a) => eixo === "y"
    ? [c[0] + r * Math.cos(a), c[1] + h, c[2] + r * Math.sin(a)]
    : [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a), c[2] + h];
  const ax = eixo === "y" ? [0, 1, 0] : [0, 0, 1];
  const faces = [];
  for (let i = 0; i < perfil.length - 1; i++) {
    const [ra, ha] = perfil[i], [rb, hb] = perfil[i + 1];
    for (let k = 0; k < seg; k++) {
      const a1 = (k / seg) * 2 * Math.PI, a2 = ((k + 1) / seg) * 2 * Math.PI;
      const p = [pt(ra, ha, a1), pt(ra, ha, a2), pt(rb, hb, a2), pt(rb, hb, a1)];
      // normal para fora: no plano do perfil é (dh, -dr) (perfil percorrido de baixo para cima)
      const am = (a1 + a2) / 2, radial = eixo === "y" ? [Math.cos(am), 0, Math.sin(am)] : [Math.cos(am), Math.sin(am), 0];
      const [nr, nh] = unit([hb - ha, -(rb - ra), 0]);
      faces.push({ p, n: unit(radial.map((v, q) => v * nr + ax[q] * nh)), m, camada, convexo: true });
    }
  }
  const [rf, hf] = perfil[perfil.length - 1];
  if (rf > 0) faces.push({ p: Array.from({ length: seg }, (_, k) => pt(rf, hf, (k / seg) * 2 * Math.PI)), n: ax, m, camada: null, convexo: true });
  return faces.filter(visivel);
}

// linhas de camada: planos y = cte (ou z = cte para o filamento enrolado) cortando a face
function sulcos(f) {
  if (!f.camada || !f.m.sulco) return "";
  const { L, base = 0, eixo = 1 } = f.camada;
  if (Math.abs(f.n[eixo]) > 0.98) return "";
  const vs = f.p.map((p) => p[eixo]), lo = Math.min(...vs), hi = Math.max(...vs);
  let d = "";
  for (let k = Math.ceil((lo - base) / L + 1e-6); base + k * L < hi - 1e-6; k++) {
    const c = base + k * L, pts = [];
    f.p.forEach((a, j) => {
      const b = f.p[(j + 1) % f.p.length];
      if ((a[eixo] - c) * (b[eixo] - c) < 0) { const t = (c - a[eixo]) / (b[eixo] - a[eixo]); pts.push(proj(a.map((v, q) => v + (b[q] - v) * t))); }
    });
    pts.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
    for (let i = 0; i + 1 < pts.length; i += 2) d += `M${fx(pts[i][0])} ${fx(pts[i][1])}L${fx(pts[i + 1][0])} ${fx(pts[i + 1][1])}`;
  }
  return d;
}

// ---------- cena ----------
// objetos na ordem de trás para a frente; dentro de cada um, as faces vão da mais distante à mais
// próxima. `tam`: maior medida na grade 96; `oy`: ajuste ótico vertical. Traços com espessura fixa.
function cena(objetos, { tam = 52, oy = 0 } = {}) {
  const todas = objetos.flatMap((o) => o.faces);
  const ps = todas.flatMap((f) => f.p.map(proj));
  const x0 = Math.min(...ps.map((p) => p[0])), x1 = Math.max(...ps.map((p) => p[0]));
  const y0 = Math.min(...ps.map((p) => p[1])), y1 = Math.max(...ps.map((p) => p[1]));
  const s = tam / Math.max(x1 - x0, y1 - y0);
  const tx = 48 - s * (x0 + x1) / 2, ty = 48 + oy - s * (y0 + y1) / 2;
  const prof = (f) => dot(f.p.reduce((a, p) => [a[0] + p[0], a[1] + p[1], a[2] + p[2]], [0, 0, 0]), OLHO) / f.p.length;
  const linhas = (d, m) => d ? `<path d="${d}" fill="none" stroke="#1B1D21" stroke-opacity="${m.sulco}" stroke-width="${fx(1.3 / s)}"/>` : "";
  let svg = "";
  for (const o of objetos) {
    // num sólido convexo as faces visíveis não se sobrepõem: as camadas vão por cima, num traço contínuo;
    // num prisma côncavo (N, estrela) cada face leva as suas antes da seguinte cobrir o que estiver atrás
    const convexo = o.faces.every((f) => f.convexo);
    let depois = "";
    for (const f of [...o.faces].sort((a, b) => prof(a) - prof(b))) {
      const cor = tom(f.m, f.n), d = "M" + f.p.map((p) => proj(p).map(fx).join(" ")).join("L") + "Z";
      svg += `<path d="${d}" fill="${cor}" stroke="${cor}" stroke-width="${fx(0.35 / s)}" stroke-linejoin="round"/>`;
      if (convexo) depois += sulcos(f); else svg += linhas(sulcos(f), f.m);
    }
    if (convexo && o.faces.length) svg += linhas(depois, o.faces[0].m);
    if (o.extra) svg += o.extra(proj, s);
  }
  return `<g transform="translate(${fx(tx)} ${fx(ty)}) scale(${fx(s)})">${svg}</g>`;
}

module.exports = { R3, MAT, proj, caixa, prisma, torno, cena };
