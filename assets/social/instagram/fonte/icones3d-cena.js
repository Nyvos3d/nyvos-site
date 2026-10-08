// NYVOS — ícones 3D dos destaques, renderizados com o mesmo estúdio da impressora do site
// (src/impressora3d.js): ambiente com softboxes, luz principal quente com sombra macia,
// contraluz laranja, materiais mineral/metal lisos e a peça laranja com linhas de camada no shader.
// Regra da série: o laranja é sempre a peça impressa; mineral, grafite e metal são estrutura.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const PX = 1600;
const COR = { mineral: 0xE9E8E4, alu: 0xC6C9CF, grafite: 0x2A2C31, laranja: 0xF26522, latao: 0xC98A4B };
const CAM = { az: -28, el: 24, fov: 20, ocupa: 0.8 };   // mesma câmera para todos os ícones
const rad = THREE.MathUtils.degToRad;

const cv = document.getElementById("c");
const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(PX, PX, false);
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.02;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
const AMBIENTE = ambiente(renderer);

// ---------- materiais (os mesmos valores do site) ----------
const mat = {
  mineral: () => new THREE.MeshStandardMaterial({ color: COR.mineral, roughness: .5, metalness: 0 }),
  grafite: () => new THREE.MeshStandardMaterial({ color: COR.grafite, roughness: .55, metalness: .25 }),
  mesa: () => new THREE.MeshStandardMaterial({ color: COR.grafite, roughness: .92, metalness: 0 }),
  alu: () => new THREE.MeshStandardMaterial({ color: COR.alu, roughness: .28, metalness: .95 }),
  latao: () => new THREE.MeshStandardMaterial({ color: COR.latao, roughness: .3, metalness: 1 }),
  // a peça impressa: laranja com verniz leve e as camadas; `lh` em unidades do objeto
  peca: (lh, eixo = [0, 1, 0], brilho = 0) => camadas(new THREE.MeshPhysicalMaterial({
    color: COR.laranja, roughness: .46, clearcoat: .45, clearcoatRoughness: .18,
    emissive: COR.laranja, emissiveIntensity: brilho,
  }), lh, new THREE.Vector3(...eixo)),
};

// linhas de camada do site (linhasDeCamada), com o eixo de empilhamento ajustável e um relevo
// mais leve que o do site: no ícone a peça aparece pequena e as camadas viram textura
function camadas(m, lh, eixo) {
  const uLH = { value: lh }, uEixo = { value: eixo.normalize() };
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uLH = uLH; sh.uniforms.uEixo = uEixo;
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nuniform vec3 uEixo;\nvarying float vNyvY;\nvarying vec3 vNyvN;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvNyvY = dot(transformed, uEixo);\nvNyvN = normal;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform float uLH;\nuniform vec3 uEixo;\nvarying float vNyvY;\nvarying vec3 vNyvN;")
      .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
        float nyvF = vNyvY / uLH;
        float nyvW = fwidth(nyvF);
        float nyvV = (1.0 - smoothstep(.16, .42, nyvW)) * (1.0 - abs(dot(normalize(vNyvN), uEixo)));
        float nyvPh = fract(nyvF) - .5;
        normal = normalize(normal + (viewMatrix * vec4(uEixo, 0.0)).xyz * nyvPh * .42 * nyvV);
        float nyvSulco = 1.0 - smoothstep(0.0, max(.07, nyvW * 1.4), .5 - abs(nyvPh));
        diffuseColor.rgb *= 1.0 - .085 * nyvSulco * nyvV;`);
  };
  m.customProgramCacheKey = () => `nyvos-camadas-${lh}-${eixo.toArray().join(",")}`;
  return m;
}

// ---------- geometria ----------
const malha = (g, m) => { const o = new THREE.Mesh(g, m); o.castShadow = true; return o; };
const caixa = (w, h, d, r, m) => malha(new RoundedBoxGeometry(w, h, d, 6, r), m);
const torno = (pts, m, seg = 128) => malha(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg), m);
function extrusao(forma, prof, chanfro, m) {
  const g = new THREE.ExtrudeGeometry(forma, { depth: prof, bevelEnabled: true, bevelThickness: chanfro, bevelSize: chanfro,
    bevelSegments: 5, curveSegments: 40 });
  g.translate(0, 0, -prof / 2);
  return malha(g, m);
}
// retângulo de cantos arredondados como THREE.Shape (centro na origem)
function retangulo(w, h, r, forma = new THREE.Shape()) {
  const x = -w / 2, y = -h / 2;
  forma.moveTo(x + r, y); forma.lineTo(x + w - r, y); forma.quadraticCurveTo(x + w, y, x + w, y + r);
  forma.lineTo(x + w, y + h - r); forma.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  forma.lineTo(x + r, y + h); forma.quadraticCurveTo(x, y + h, x, y + h - r);
  forma.lineTo(x, y + r); forma.quadraticCurveTo(x, y, x + r, y);
  return forma;
}
// estrela de cinco pontas com as quinas levemente suavizadas
function estrela(R, r) {
  const f = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + i * Math.PI / 5, k = i % 2 ? r : R;
    i ? f.lineTo(k * Math.cos(a), k * Math.sin(a)) : f.moveTo(k * Math.cos(a), k * Math.sin(a));
  }
  f.closePath();
  return f;
}
// o N da marca (SIMBOLO, grade 96, y para baixo) como THREE.Shape de altura `h`, centrado
function formaN(simbolo, h) {
  const f = new THREE.Shape(), k = h / 96;
  let x = 0, y = 0, primeiro = true;
  for (const [, c, a] of simbolo.matchAll(/([MHVZ])([^MHVZ]*)/g)) {
    const n = a.trim() ? a.trim().split(/[\s,]+/).map(Number) : [];
    if (c === "M") [x, y] = n; else if (c === "H") x = n[0]; else if (c === "V") y = n[0]; else continue;
    const px = (x - 48) * k, py = (48 - y) * k;
    if (primeiro) { f.moveTo(px, py); primeiro = false; } else f.lineTo(px, py);
  }
  f.closePath();
  return f;
}

// ---------- os sete ícones ----------
const ICONES = {
  // Impressões: o cubo impresso sobre a mesa PEI, com o N em relevo no topo
  "01-impressoes": ({ simbolo }) => {
    const g = new THREE.Group();
    const mesa = caixa(2.05, .12, 2.05, .05, mat.mesa());
    mesa.position.y = .06;
    g.add(mesa);
    const cubo = caixa(1.4, 1.4, 1.4, .08, mat.peca(1.4 / 11));
    cubo.position.y = .12 + .7;
    g.add(cubo);
    // o N deitado no topo e girado para ficar de pé para quem olha (azimute da câmera)
    const n = extrusao(formaN(simbolo, .84), .05, .014, mat.peca(1));
    n.rotation.order = "YXZ";
    n.rotation.set(-Math.PI / 2, rad(CAM.az - 8), 0);
    n.position.y = .12 + 1.4 + .025;
    g.add(n);
    g.rotation.y = rad(8);
    return g;
  },

  // Orçamento: a etiqueta de preço impressa, com ilhós de metal
  "02-orcamento": () => {
    const g = new THREE.Group();
    const w = 1.25, h = 1.85, p = .42, r = .12;
    const f = new THREE.Shape();
    f.moveTo(-w / 2 + r, -h / 2); f.lineTo(w / 2 - r, -h / 2); f.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    f.lineTo(w / 2, h / 2 - p); f.lineTo(r * .6, h / 2 - r * .4); f.quadraticCurveTo(0, h / 2, -r * .6, h / 2 - r * .4);
    f.lineTo(-w / 2, h / 2 - p); f.lineTo(-w / 2, -h / 2 + r); f.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    const furo = new THREE.Path(); furo.absarc(0, h / 2 - .42, .13, 0, Math.PI * 2, true); f.holes.push(furo);
    g.add(extrusao(f, .2, .045, mat.peca(h / 13)));
    const ilhos = malha(new THREE.TorusGeometry(.155, .04, 24, 96), mat.alu());
    ilhos.position.set(0, h / 2 - .42, .15);
    g.add(ilhos);
    g.rotation.set(0, rad(-16), rad(-10));
    return g;
  },

  // Clientes: o balão do depoimento com a estrela impressa em relevo
  "03-clientes": () => {
    const g = new THREE.Group();
    const f = retangulo(2.1, 1.45, .32);
    const rabo = new THREE.Shape(); rabo.moveTo(-.6, -.6); rabo.quadraticCurveTo(-.62, -.95, -.92, -1.13); rabo.quadraticCurveTo(-.42, -1.06, -.14, -.6);
    const balao = new THREE.Group();
    balao.add(extrusao(f, .34, .07, mat.mineral()), extrusao(rabo, .34, .07, mat.mineral()));
    g.add(balao);
    const est = extrusao(estrela(.5, .21), .14, .035, mat.peca(.1));
    est.position.z = .17 + .07 + .05;
    g.add(est);
    g.rotation.y = rad(-16);
    return g;
  },

  // Sua ideia: a lâmpada impressa, acesa, com a rosca de alumínio
  "04-sua-ideia": () => {
    const g = new THREE.Group();
    g.add(torno([[0, 0], [.12, 0], [.17, .05], [.17, .1]], mat.grafite()));
    const rosca = [[.17, .1]];
    for (let i = 0; i < 4; i++) rosca.push([.3, .13 + i * .1], [.33, .17 + i * .1], [.3, .21 + i * .1]);
    rosca.push([.34, .52], [.34, .58], [0, .58]);
    g.add(torno(rosca, mat.alu()));
    const vidro = [[.3, .58], [.33, .66], [.42, .8], [.56, .98], [.66, 1.18], [.7, 1.38], [.67, 1.58], [.57, 1.76], [.41, 1.9], [.21, 1.98], [0, 2.0]];
    g.add(torno(vidro, mat.peca(1.42 / 10, [0, 1, 0], .22)));
    return g;
  },

  // Bastidores: o bico de latão depositando a camada em andamento sobre a peça
  "05-bastidores": () => {
    const g = new THREE.Group(), lh = .17;
    const base = caixa(1.6, lh * 3, 1.0, .05, mat.peca(lh)); base.position.y = lh * 1.5; g.add(base);
    const camada = caixa(.9, lh, 1.0, .04, mat.peca(lh)); camada.position.set(-.35, lh * 3.5, 0); g.add(camada);
    const xb = .1, yb = lh * 4 + .02;                                        // ponta do bico, na beira da camada
    const bico = new THREE.Group();
    bico.add(torno([[.025, 0], [.06, .02], [.15, .2], [.15, .23], [0, .23]], mat.latao()));
    const sext = malha(new THREE.CylinderGeometry(.2, .2, .1, 6), mat.latao()); sext.position.y = .28; bico.add(sext);
    const bloco = caixa(.62, .34, .5, .035, mat.grafite()); bloco.position.set(-.08, .5, 0); bico.add(bloco);
    const garganta = torno([[.07, 0], [.07, .14], [0, .14]], mat.alu()); garganta.position.y = .67; bico.add(garganta);
    const aletas = [[.13, 0]];
    for (let i = 0; i < 5; i++) aletas.push([.13, i * .11 + .02], [.34, i * .11 + .025], [.34, i * .11 + .065], [.13, i * .11 + .07]);
    aletas.push([.13, .56], [0, .56]);
    const dissip = torno(aletas, mat.mineral()); dissip.position.y = .81; bico.add(dissip);
    bico.position.set(xb, yb, 0);
    bico.scale.setScalar(1.35);
    g.add(bico);
    g.rotation.y = rad(10);
    return g;
  },

  // Cores: o carretel com o filamento laranja enrolado (camadas ao longo do eixo = as voltas)
  "06-cores": () => {
    const g = new THREE.Group();
    const aba = () => torno([[.27, -.06], [1.0, -.06], [1.04, -.04], [1.05, 0], [1.04, .04], [1.0, .06], [.27, .06]], mat.mineral());
    const fil = torno([[.78, -.4], [.78, .4]], mat.peca(.075));
    const cubo = torno([[.27, -.47], [.27, .47]], mat.grafite());
    const a1 = aba(), a2 = aba();
    a1.position.y = -.47; a2.position.y = .47;
    const carretel = new THREE.Group();
    carretel.add(a1, a2, fil, cubo);
    carretel.rotation.z = Math.PI / 2;                         // eixo deitado
    g.add(carretel);
    g.rotation.y = rad(-62);
    return g;
  },

  // A NYVOS: o N impresso em pé
  "07-a-nyvos": ({ simbolo }) => {
    const g = new THREE.Group();
    g.add(extrusao(formaN(simbolo, 1.9), .44, .035, mat.peca(1.9 / 13)));
    g.rotation.y = rad(-14);
    return g;
  },
};

// ---------- cena, câmera e captura ----------
function render(id, opts) {
  const cena = new THREE.Scene();
  cena.environment = AMBIENTE;
  const obj = ICONES[id](opts);
  // apoia o objeto logo acima do chão e centraliza em x/z
  const caixaObj = new THREE.Box3().setFromObject(obj), c = caixaObj.getCenter(new THREE.Vector3());
  const folga = .08;
  obj.position.set(-c.x, folga - caixaObj.min.y, -c.z);
  cena.add(obj);
  const esfera = new THREE.Box3().setFromObject(obj).getBoundingSphere(new THREE.Sphere());

  const chao = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: .3 }));
  chao.rotation.x = -Math.PI / 2;
  chao.receiveShadow = true;
  cena.add(chao);
  const contato = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: texturaContato(), transparent: true, depthWrite: false }));
  contato.rotation.x = -Math.PI / 2;
  contato.position.y = .002;
  const pegada = new THREE.Box3().setFromObject(obj);
  contato.scale.set((pegada.max.x - pegada.min.x) * 1.15, (pegada.max.z - pegada.min.z) * 1.15, 1);
  cena.add(contato);

  const chave = new THREE.DirectionalLight(0xFFF3E6, 2.3);
  chave.position.set(-3.2, 7.5, 5.2).normalize().multiplyScalar(8).add(esfera.center);
  chave.target.position.copy(esfera.center);
  chave.castShadow = true;
  Object.assign(chave.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 1, far: 20 });
  chave.shadow.mapSize.set(2048, 2048);
  chave.shadow.bias = -.0006; chave.shadow.normalBias = .015;
  chave.shadow.radius = 9; chave.shadow.blurSamples = 20;
  cena.add(chave, chave.target);
  const contra = new THREE.DirectionalLight(0xFF8A4C, 1.5);
  contra.position.set(4.5, 4, -6);
  cena.add(contra);

  const cam = new THREE.PerspectiveCamera(CAM.fov, 1, .1, 100);
  const dist = esfera.radius / Math.sin(rad(CAM.fov) / 2) / CAM.ocupa;
  const az = rad(CAM.az), el = rad(CAM.el);
  cam.position.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(dist).add(esfera.center);
  cam.lookAt(esfera.center);
  renderer.render(cena, cam);
  // caixa do objeto na imagem (alfa alto; a sombra é translúcida), para a capa centrar e igualar tamanhos
  const c2 = document.createElement("canvas"); c2.width = c2.height = PX;
  const g2 = c2.getContext("2d"); g2.drawImage(cv, 0, 0);
  const a = g2.getImageData(0, 0, PX, PX).data;
  let x0 = PX, y0 = PX, x1 = 0, y1 = 0;
  for (let y = 0; y < PX; y++) for (let x = 0; x < PX; x++) if (a[(y * PX + x) * 4 + 3] > 200) {
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  return { url: cv.toDataURL("image/png"), caixa: [x0, y0, x1 + 1, y1 + 1], lado: PX };
}

function texturaContato() {
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const g = c.getContext("2d"), r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  r.addColorStop(0, "rgba(0,0,0,.5)"); r.addColorStop(.55, "rgba(0,0,0,.22)"); r.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = r; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ambiente de estúdio do site: caixa escura com softboxes e um rebatedor laranja
function ambiente(r) {
  const env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), new THREE.MeshBasicMaterial({ color: 0x1d1f23, side: THREE.BackSide })));
  const luz = (w, h, x, y, z, int, cor = 0xffffff) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(cor).multiplyScalar(int), side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m);
  };
  luz(7, 2.4, 0, 4.9, 0, 5);
  luz(2.2, 4.5, -4.9, 1.2, 1.2, 3);
  luz(2, 3.5, 4.9, .8, -1, 1.4);
  luz(4, 1.2, 0, .4, 4.9, 1.6);
  luz(2.4, 1.4, 3, 1.2, -4.9, 2.4, 0xFF8A4C);
  const pm = new THREE.PMREMGenerator(r);
  const tex = pm.fromScene(env, .04).texture;
  pm.dispose();
  return tex;
}

window.__icones = Object.keys(ICONES);
window.__icone = render;
