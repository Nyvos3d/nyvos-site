// NYVOS — impressora 3D do hero (WebGL / three.js)
// Modelo minimalista de impressora de mesa deslizante (base, mesa, duas colunas,
// travessa, eixo X que sobe a cada camada, cabeçote, bobina e display lateral)
// imprimindo o N Estrato em pé, camada por camada. Medidas em milímetros dentro de `raiz`.
import * as THREE from "three";

const stage = document.getElementById("stage");
const cv = document.getElementById("impressora3d");
// monta a cena quando o navegador estiver ocioso: a compilação dos shaders não disputa a primeira pintura
// nem os primeiros toques (o pôster cobre esse intervalo)
if (stage && cv){
  if ("requestIdleCallback" in window) requestIdleCallback(iniciar, { timeout: 1200 });
  else setTimeout(iniciar, 200);
}

function iniciar(){
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // modo leve: celulares e telas de toque (sem sombras dinâmicas, 30 qps, pixel ratio menor)
  const mob = matchMedia("(max-width:640px),(hover:none)").matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, powerPreference: mob ? "default" : "high-performance" });
  } catch (e) { return; }                       // sem WebGL: o pôster estático continua no lugar
  // nitidez: até 2× em qualquer aparelho (telas 3× de celular ficavam moles a 1,5×)
  const DPR = window.devicePixelRatio || 1;
  const PR_MAX = Math.min(DPR, 2), PR_PISO = Math.min(PR_MAX, DPR >= 2 ? 1.5 : 1);
  let pr = PR_MAX;
  renderer.setPixelRatio(pr);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;          // sombras macias (penumbra) e baratas

  const cena = new THREE.Scene();
  cena.environment = ambiente(renderer);
  const raiz = new THREE.Group();
  raiz.scale.setScalar(0.01);                  // 1 unidade do mundo = 100 mm
  cena.add(raiz);

  // ── cores e materiais ──
  const COR = { mineral: 0xE9E8E4, alu: 0xC6C9CF, grafite: 0x2A2C31, pei: 0x262729, laranja: 0xF26522, latao: 0xC98A4B };
  const M = {
    corpo: new THREE.MeshStandardMaterial({ color: COR.mineral, roughness: .5, metalness: 0 }),
    alu: new THREE.MeshStandardMaterial({ color: COR.alu, roughness: .28, metalness: .95 }),
    escuro: new THREE.MeshStandardMaterial({ color: COR.grafite, roughness: .55, metalness: .25 }),
    trilho: new THREE.MeshStandardMaterial({ color: 0x8C9097, roughness: .22, metalness: 1 }),
    pei: new THREE.MeshStandardMaterial({ color: COR.pei, roughness: .82, metalness: .2, map: texturaPEI() }),
    latao: new THREE.MeshStandardMaterial({ color: COR.latao, roughness: .3, metalness: 1 }),
    acento: new THREE.MeshStandardMaterial({ color: COR.laranja, roughness: .4, emissive: COR.laranja, emissiveIntensity: .35 }),
    peca: linhasDeCamada(new THREE.MeshPhysicalMaterial({ color: COR.laranja, roughness: .46, clearcoat: .45, clearcoatRoughness: .18 })),
    quente: new THREE.MeshStandardMaterial({ color: 0xFF9A55, roughness: .4, emissive: 0xFF5A14, emissiveIntensity: 1.1 }),
    brasa: new THREE.MeshBasicMaterial({ color: 0xFF6A1F, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
    ptfe: new THREE.MeshStandardMaterial({ color: 0xF4F3EF, roughness: .12, transparent: true, opacity: .5, depthWrite: false }),
    fio: new THREE.MeshStandardMaterial({ color: COR.laranja, roughness: .35, emissive: COR.laranja, emissiveIntensity: .25 }),
    filamento: new THREE.MeshStandardMaterial({ color: COR.laranja, roughness: .42, map: texturaBobina() }),
  };

  const add = (pai, geo, mat, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = true;
    pai.add(m);
    return m;
  };
  const semSombra = m => { m.castShadow = false; return m; };

  // ── base: a marca NYVOS na borda frontal ──
  const BASE_TOPO = 70;
  add(raiz, caixa(352, 6, 432, 30, "y", 2), M.escuro, 0, 3, -10);
  add(raiz, caixa(360, 64, 440, 34, "y", 8), M.corpo, 0, 38, -10);
  const MARCA_W = 104, MARCA_H = MARCA_W * 102 / 575;   // proporção do logo horizontal (viewBox 575×102)
  semSombra(add(raiz, new THREE.PlaneGeometry(MARCA_W, MARCA_H), new THREE.MeshStandardMaterial({
    map: texturaMarca(), transparent: true, roughness: .45, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2,
  }), 0, 38, 210.2));

  // ── mesa (eixo Y): carro, chapa PEI e a peça ──
  const mesa = new THREE.Group();
  raiz.add(mesa);
  add(mesa, caixa(236, 8, 236, 10, "y", 1.5), M.escuro, 0, BASE_TOPO + 4, 0);
  add(mesa, caixa(270, 5, 270, 9, "y", 1.2), M.pei, 0, BASE_TOPO + 10.5, 0);
  add(mesa, caixa(56, 4, 18, 4, "y", 1), M.escuro, 0, BASE_TOPO + 10, 144);
  const MESA_TOPO = BASE_TOPO + 13;

  // ── colunas (mais baixas), pés e travessa ──
  const COL_Z = -125, COL_X = 158, COL_H = 330;
  for (const s of [-1, 1]){
    add(raiz, caixa(48, 22, 48, 8, "y", 2), M.escuro, s * COL_X, BASE_TOPO + 11, COL_Z);
    add(raiz, caixa(34, COL_H, 34, 6, "y", 2), M.alu, s * COL_X, BASE_TOPO + COL_H / 2, COL_Z);
  }
  const TOPO = BASE_TOPO + COL_H;
  add(raiz, caixa(352, 28, 36, 6, "x", 2), M.alu, 0, TOPO + 14, COL_Z);

  // ── pórtico (eixo Z): viga com trilho linear e as duas carcaças que sobem nas colunas ──
  const portico = new THREE.Group();
  raiz.add(portico);
  add(portico, caixa(300, 30, 26, 5, "x", 2), M.alu, 0, 0, -91);
  add(portico, new THREE.BoxGeometry(286, 8, 4), M.trilho, 0, 4, -76);
  const parafusos = new THREE.InstancedMesh(new THREE.CylinderGeometry(2, 2, 1.2, 12).rotateX(Math.PI / 2), M.escuro, 13);
  for (let i = 0; i < 13; i++) parafusos.setMatrixAt(i, new THREE.Matrix4().makeTranslation(-132 + i * 22, 4, -73.6));
  portico.add(parafusos);
  add(portico, caixa(62, 84, 62, 12, "z", 3), M.corpo, COL_X, 6, -118);
  add(portico, caixa(48, 62, 52, 10, "z", 3), M.corpo, -COL_X, 2, -120);
  // o N laranja na carcaça direita, onde a impressora real leva a etiqueta do modelo
  const emblema = semSombra(add(portico, new THREE.ShapeGeometry(formaN()), M.acento, COL_X, 14, -86.7));
  emblema.scale.set(.24, .24, 1);

  // ── cabeçote: corpo, faixa laranja, ventoinha, bloco aquecedor e bico ──
  const cab = new THREE.Group();
  raiz.add(cab);
  add(cab, caixa(62, 86, 56, 11, "z", 3), M.corpo, 0, 0, 0);
  add(cab, new THREE.BoxGeometry(62.6, 3, 56.6), M.acento, 0, -26, 0);
  add(cab, new THREE.CylinderGeometry(15, 15, 2, 48).rotateX(Math.PI / 2), M.escuro, 0, 12, 28.6);
  add(cab, new THREE.TorusGeometry(15.4, 1.1, 10, 48), M.acento, 0, 12, 29.4);
  add(cab, new THREE.CylinderGeometry(4.5, 4.5, 2, 24).rotateX(Math.PI / 2), M.corpo, 0, 12, 30);
  add(cab, new THREE.BoxGeometry(48, 58, 10), M.escuro, 0, 2, -32);
  // entrada lateral do filamento: conector escuro com anel laranja, na altura do bico
  const PORTA = { x: 31, y: -14 };
  add(cab, new THREE.CylinderGeometry(5.5, 5.5, 8, 20).rotateZ(Math.PI / 2), M.escuro, PORTA.x + 4, PORTA.y, 0);
  add(cab, new THREE.TorusGeometry(5, 1.1, 8, 24).rotateY(Math.PI / 2), M.acento, PORTA.x + 8, PORTA.y, 0);
  add(cab, caixa(24, 14, 24, 3, "y", 1), M.escuro, 0, -50, 0);
  add(cab, new THREE.CylinderGeometry(5.5, 1.4, 9, 24), M.latao, 0, -61.5, 0);
  const BICO = -66;                             // ponta do bico em relação ao centro do cabeçote
  const CAB_Z = -50;                            // o bico trabalha sempre nesta linha (a mesa é que se move em Y)

  // brilho da ponta do bico + luz quente que ilumina a peça
  const brilho = new THREE.Sprite(new THREE.SpriteMaterial({ map: texturaBrilho(), color: 0xFF8A3D, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  brilho.scale.set(30, 30, 1);
  brilho.position.set(0, BICO, 0);
  cab.add(brilho);
  const luzBico = new THREE.PointLight(0xFF7A30, 0, 1.4, 2);
  luzBico.position.set(0, BICO - 4, 6);
  cab.add(luzBico);

  // ── bobina de filamento laranja presa na coluna direita ──
  const BOB_Y = TOPO - 70;
  const bobina = new THREE.Group();
  bobina.position.set(228, BOB_Y, COL_Z);
  raiz.add(bobina);
  add(raiz, new THREE.CylinderGeometry(6, 6, 92, 16).rotateZ(Math.PI / 2), M.escuro, 221, BOB_Y, COL_Z);
  const eixoX = g => g.rotateZ(Math.PI / 2);
  add(bobina, eixoX(new THREE.CylinderGeometry(84, 84, 56, 72)), M.filamento);
  for (const s of [-1, 1]) add(bobina, eixoX(new THREE.CylinderGeometry(98, 98, 5, 72)), M.escuro, s * 30.5, 0, 0);
  add(bobina, eixoX(new THREE.CylinderGeometry(30, 30, 68, 40)), M.corpo);

  // ── tubo PTFE translúcido com o filamento laranja dentro: da bobina até a lateral do cabeçote ──
  const tubo = semSombra(add(raiz, new THREE.BufferGeometry(), M.ptfe));
  const fio = semSombra(add(raiz, new THREE.BufferGeometry(), M.fio));
  tubo.renderOrder = 2;
  const curva = new THREE.CatmullRomCurve3([0, 1, 2, 3, 4, 5].map(() => new THREE.Vector3()), false, "centripetal");
  function refazTubo(x, y){
    const p = curva.points, py = y + PORTA.y, px = x + PORTA.x + 8;
    p[0].set(222, BOB_Y - 34, -48);                       // sai da frente da bobina
    p[1].set(214, BOB_Y - 78, -46);
    p[2].set((214 + px + 34) / 2, (BOB_Y - 78 + py) / 2 - 6, -48);   // tubo rígido: curva tensa, quase sem barriga
    p[3].set(px + 34, py, CAB_Z);                          // chega na horizontal
    p[4].set(px + 12, py, CAB_Z);
    p[5].set(px, py, CAB_Z);
    tubo.geometry.dispose();
    fio.geometry.dispose();
    tubo.geometry = new THREE.TubeGeometry(curva, 48, 4.4, 10, false);
    fio.geometry = new THREE.TubeGeometry(curva, 48, 1.75, 6, false);
  }

  // ── display lateral: preso à esquerda da base, virado para a frente como a impressora ──
  const tela = criaTela();
  const display = new THREE.Group();
  display.position.set(-246, 74, 156);
  display.rotation.x = -.26;                    // levemente inclinado para trás, como um painel de bancada
  raiz.add(display);
  add(raiz, caixa(52, 12, 18, 4, "x", 2), M.escuro, -204, 50, 148);
  add(display, caixa(118, 78, 12, 9, "z", 3), M.escuro);
  semSombra(add(display, new THREE.PlaneGeometry(106, 66.25), new THREE.MeshBasicMaterial({ map: tela.textura, toneMapped: false }), 0, 0, 6.15));

  // ── a peça: o N em pé, camada por camada ──
  // faixas horizontais do N (de baixo para cima), em unidades do símbolo 96×96
  const FAIXAS = [[[0, 12], [36, 96]], [[0, 12], [24, 48], [66, 96]], [[0, 30], [66, 96]]];
  const U = 1.5, NC = 30, LH = 96 * U / NC, ESP = 30;    // 144 mm de altura · 30 camadas de 4,8 mm · 30 mm de espessura
  M.peca.userData.uLH.value = LH;
  const peca = new THREE.Group();
  peca.position.y = MESA_TOPO;
  mesa.add(peca);
  const camadas = [];                             // por camada: [{ a, b (mm), w }]
  for (let i = 0; i < NC; i++){
    camadas.push(FAIXAS[Math.floor(i * 3 / NC)].map(([a, b]) => ({ a: (a - 48) * U, b: (b - 48) * U, w: (b - a) * U })));
  }
  // camadas prontas: uma InstancedMesh de blocos (caixa unitária escalada), em ordem de camada
  const cubo = new THREE.BoxGeometry(1, 1, 1);
  const itens = camadas.flatMap((cs, i) => cs.map(c => ({ i, c })));
  const pilha = new THREE.InstancedMesh(cubo, M.peca, itens.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), e = new THREE.Vector3();
  itens.forEach(({ i, c }, k) => pilha.setMatrixAt(k, m4.compose(v.set((c.a + c.b) / 2, i * LH + LH / 2, 0), q, e.set(c.w, LH, ESP))));
  pilha.castShadow = pilha.receiveShadow = true;
  const ate = [];
  for (let L = 0; L <= NC; L++) ate[L] = itens.filter(it => it.i < L).length;
  peca.add(pilha);
  // camada em impressão (filamento quente) e a anterior esfriando
  const ativa = [0, 1, 2].map(() => add(peca, cubo, M.quente));
  const brasa = [0, 1, 2].map(() => semSombra(add(peca, cubo, M.brasa)));

  // ── brilho da peça pronta ──
  const ALTURA_N = NC * LH;
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: texturaBrilho(), color: 0xFF7A2E, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
  halo.scale.set(300, 300, 1);
  halo.position.set(0, ALTURA_N * .55, -ESP);
  peca.add(halo);
  const texFaisca = texturaFaisca();
  const faiscas = [[48, 96], [-48, 96], [48, 0], [-48, 64]].map(([x, y]) => {
    const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: texFaisca, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
    f.position.set(x * U, y * U * ALTURA_N / (96 * U), ESP / 2 + 2);
    f.scale.set(0, 0, 1);
    peca.add(f);
    return f;
  });
  const LARANJA = new THREE.Color(COR.laranja);
  M.peca.emissive = LARANJA.clone();
  M.peca.emissiveIntensity = 0;

  // ── luzes ──
  const chave = new THREE.DirectionalLight(0xFFF3E6, 2.3);
  chave.position.set(-3.2, 7.5, 5.2);
  chave.target.position.set(0, 1.6, -.4);
  chave.castShadow = true;
  // a câmera de sombra cobre a máquina inteira e a sombra no chão (sem cortes retos)
  Object.assign(chave.shadow.camera, { left: -5.5, right: 5.5, top: 5.5, bottom: -5.5, near: 2, far: 20 });
  chave.shadow.mapSize.set(mob ? 1024 : 2048, mob ? 1024 : 2048);
  chave.shadow.bias = -.0006;
  chave.shadow.normalBias = .015;
  chave.shadow.radius = mob ? 5 : 7;
  chave.shadow.blurSamples = mob ? 8 : 16;
  cena.add(chave, chave.target);
  const contra = new THREE.DirectionalLight(0xFF8A4C, 1.5);
  contra.position.set(4.5, 4, -6);
  cena.add(contra);
  const varre = new THREE.DirectionalLight(0xFFFFFF, 0);    // luz que varre a peça pronta
  cena.add(varre, varre.target);
  varre.target.position.set(0, 1.4, -.5);

  // chão: sombra projetada macia (some nas bordas) + sombra de contato logo abaixo da base
  const chao = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.ShadowMaterial({ opacity: .34 }));
  chao.rotation.x = -Math.PI / 2;
  chao.position.set(.4, 0, -.6);
  chao.receiveShadow = true;
  cena.add(chao);
  const contato = new THREE.Mesh(new THREE.PlaneGeometry(5, 5.2), new THREE.MeshBasicMaterial({ map: texturaContato(), transparent: true, depthWrite: false }));
  contato.rotation.x = -Math.PI / 2;
  contato.position.set(-.2, .002, -.08);
  cena.add(contato);

  // ── câmera ──
  const cam = new THREE.PerspectiveCamera(24, 1, .1, 60);
  const ALVO = new THREE.Vector3(-.1, 1.92, -.2);
  const CAM = { az: -23, el: 14, dist: 16.6 };
  const mira = { x: 0, y: 0, ax: 0, ay: 0 };
  function posCamera(t){
    const az = (CAM.az + (mob || reduce ? 0 : 6 * Math.sin((t - INICIO * T) / 22 * Math.PI * 2)) + mira.ax * 7) * Math.PI / 180;
    const el = (CAM.el + mira.ay * 4) * Math.PI / 180;
    cam.position.set(ALVO.x + CAM.dist * Math.sin(az) * Math.cos(el), ALVO.y + CAM.dist * Math.sin(el), ALVO.z + CAM.dist * Math.cos(az) * Math.cos(el));
    cam.lookAt(ALVO);
  }
  if (!mob && !reduce){
    stage.addEventListener("pointermove", ev => {
      const r = stage.getBoundingClientRect();
      mira.x = ((ev.clientX - r.left) / r.width - .5) * 2;
      mira.y = ((ev.clientY - r.top) / r.height - .5) * 2;
    });
    stage.addEventListener("pointerleave", () => { mira.x = mira.y = 0; });
  }

  // ── linha do tempo ──
  // ciclo de 15 s: impressão 0→66% · recolhe e apresenta a peça →72% · peça pronta →92% · reinício
  const T = 15, F_IMP = .66, F_APR = .72, F_SAI = .92;
  const INICIO = .5;                             // a animação começa no mesmo quadro do pôster (troca invisível)
  const MESA_Z = CAB_Z, MESA_SHOW = 40, PARK_X = -100;
  const X0 = -48 * U - 8, X1 = 48 * U + 8;
  const suave = t => t * t * (3 - 2 * t);
  const lerp = (a, b, t) => a + (b - a) * t;
  const cl = t => Math.min(1, Math.max(0, t));

  function bloco(m, c, frac, dir, i){
    if (frac <= .001){ m.visible = false; return; }
    m.visible = true;
    m.scale.set(c.w * frac, LH, ESP);
    m.position.set(dir > 0 ? c.a + c.w * frac / 2 : c.b - c.w * frac / 2, i * LH + LH / 2, 0);
  }

  function atualizar(t){
    const p = (((t % T) + T) % T) / T;            // o 1º quadro do rAF pode vir com t levemente negativo
    let L, nx, ny, mz, quente = 0, opaco = 1, sweep = -1;
    ativa.forEach(m => m.visible = false);
    brasa.forEach(m => m.visible = false);

    if (p < F_IMP){
      const f = p / F_IMP, lf = f * NC;
      L = Math.min(NC - 1, Math.floor(lf));
      const dentro = lf - L, dir = L % 2 ? -1 : 1;
      nx = dir > 0 ? lerp(X0, X1, dentro) : lerp(X1, X0, dentro);
      ny = MESA_TOPO + (L + 1) * LH + .4;
      mz = MESA_Z + 7 * Math.sin(t * Math.PI * 2 * 1.7);
      quente = 1;
      camadas[L].forEach((c, k) => bloco(ativa[k], c, dir > 0 ? cl((nx - c.a) / c.w) : cl((c.b - nx) / c.w), dir, L));
      if (L > 0){
        M.brasa.opacity = .5 * (1 - dentro) * (1 - dentro);
        camadas[L - 1].forEach((c, k) => {
          const m = brasa[k];
          m.visible = true;
          m.scale.set(c.w + .4, LH + .1, ESP + .8);
          m.position.set((c.a + c.b) / 2, (L - 1) * LH + LH / 2, 0);
        });
      }
      tela.estado("imprimindo", f, L + 1, NC);
    } else {
      L = NC;
      const topo = MESA_TOPO + NC * LH + .4;
      const a = suave(cl((p - F_IMP) / (F_APR - F_IMP)));           // recolhe o cabeçote e apresenta a mesa
      const r = suave(cl((p - F_SAI - .03) / (1 - F_SAI - .03)));   // volta para o início
      nx = lerp(lerp(X1, PARK_X, a), X0, r);
      ny = lerp(lerp(topo, topo + 40, a), MESA_TOPO + LH + .4, r);
      mz = lerp(lerp(MESA_Z, MESA_SHOW, a), MESA_Z, r);
      quente = 1 - cl((p - F_IMP) / .02);
      opaco = 1 - cl((p - F_SAI) / .035);
      if (p >= F_APR && p < F_SAI) sweep = (p - F_APR) / (F_SAI - F_APR);
      if (p < F_APR) tela.estado("inspecao", 1, NC, NC);
      else if (p < .97) tela.estado("pronta", 1, NC, NC);
      else tela.estado("preparando", 0, 0, NC);
    }

    pilha.count = ate[L];
    const fade = opaco < 1;
    if (M.peca.transparent !== fade){ M.peca.transparent = fade; M.peca.needsUpdate = true; }
    M.peca.opacity = opaco;
    peca.visible = opaco > .001;

    mesa.position.z = mz;
    cab.position.set(nx, ny - BICO, CAB_Z);
    portico.position.y = ny - BICO - 8;
    brilho.material.opacity = quente * (.75 + .25 * Math.sin(t * 40));
    luzBico.intensity = quente * .22;
    bobina.rotation.x = -t * .35;

    // peça pronta: o N acende num pulso, respira e ganha halo; faíscas piscam nas quinas
    let acende = 0;
    if (sweep >= 0){
      const ent = suave(cl(sweep / .18));                         // entrada do brilho
      const sai = 1 - suave(cl((sweep - .82) / .18));             // saída antes de sumir
      acende = ent * sai * (.62 + .2 * Math.sin(sweep * Math.PI * 6));
    }
    M.peca.emissiveIntensity = .38 * acende;
    halo.material.opacity = .55 * acende;
    faiscas.forEach((f, i) => {
      const k = sweep < 0 ? 0 : cl((sweep - .12 - i * .14) / .16);   // cada faísca em sequência
      const v = Math.sin(Math.PI * k);
      f.material.opacity = v;
      f.scale.set(34 * v, 34 * v, 1);
      f.material.rotation = k * Math.PI;
    });

    // brilho de estúdio: uma luz atravessa a peça pronta da esquerda para a direita
    if (sweep >= 0){
      const s = suave(sweep);
      varre.position.set(lerp(-6, 6, s), 3.2, 5);
      varre.intensity = 2.6 * Math.sin(Math.PI * Math.min(1, sweep * 1.6));
    } else varre.intensity = 0;
    return { nx, ny };
  }

  // ── tamanho, laço de animação, qualidade adaptativa e pausa fora da tela ──
  function ajusta(){
    const r = cv.getBoundingClientRect(), w = r.width, h = r.height;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
  }
  ajusta();
  if ("ResizeObserver" in window) new ResizeObserver(ajusta).observe(cv);
  else addEventListener("resize", ajusta);

  let tuboX = NaN, tuboY = NaN;
  function quadro(t){
    mira.ax += (mira.x - mira.ax) * .06;
    mira.ay += (mira.y - mira.ay) * .06;
    const { nx, ny } = atualizar(t);
    const cy = ny - BICO;
    if (!(Math.abs(nx - tuboX) <= .5 && Math.abs(cy - tuboY) <= .5)){ refazTubo(nx, cy); tuboX = nx; tuboY = cy; }
    tela.desenha();
    posCamera(t);
    renderer.render(cena, cam);
  }

  // pôster estático (gerado a partir desta mesma cena): #poster expõe a captura de um instante
  if (location.hash === "#poster"){
    window.__nyvosPoster = p => { tuboX = NaN; quadro(p * T); return cv.toDataURL("image/png"); };
  }

  const revela = () => { cv.classList.add("on"); stage.classList.add("pronto"); };
  // as fontes do site chegam depois: redesenha o display quando estiverem prontas
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { tela.sujo = true; if (reduce) quadro(T * (F_APR + .02)); });
  if (reduce){                                     // sem movimento: só a peça pronta, parada
    quadro(T * (F_APR + .02));
    revela();
    return;
  }

  const t0 = performance.now();
  let raf = null, ultimo = 0, primeiro = true, ativo = true;
  const passo = mob ? 1000 / 30 : 0;
  // qualidade adaptativa: só age em lentidão sustentada, depois do aquecimento (compilação de shaders e
  // primeiros quadros sempre engasgam). Primeiro abre mão das sombras; a resolução só cai até um piso nítido.
  let amostras = 0, soma = 0, antes = 0, aquece = 180, lentas = 0;
  const LIMITE = mob ? 45 : 30;
  function mede(agora){
    if (antes){
      const d = agora - antes;
      if (aquece > 0) aquece--;
      else if (d < 250){ soma += d; amostras++; }     // ignora pausas (troca de aba, rolagem parada)
    }
    antes = agora;
    if (amostras < 120) return;
    const media = soma / amostras;
    amostras = soma = 0;
    lentas = media > LIMITE ? lentas + 1 : 0;
    if (lentas < 2) return;
    lentas = 0;
    if (renderer.shadowMap.enabled){
      renderer.shadowMap.enabled = false;
      chave.castShadow = false;
      chao.visible = false;
      cena.traverse(o => o.material && (o.material.needsUpdate = true));
    } else if (pr > PR_PISO){
      pr = Math.max(PR_PISO, pr - .25);
      renderer.setPixelRatio(pr);
      ajusta();
    }
  }
  function laco(agora){
    raf = requestAnimationFrame(laco);
    if (agora - ultimo < passo) return;
    ultimo = agora;
    quadro((agora - t0) / 1000 + INICIO * T);
    mede(agora);
    if (primeiro){ primeiro = false; revela(); }
  }
  const liga = () => { if (!raf && ativo && !document.hidden){ antes = 0; raf = requestAnimationFrame(laco); } };
  const desliga = () => { if (raf){ cancelAnimationFrame(raf); raf = null; } };
  if ("IntersectionObserver" in window){
    new IntersectionObserver(es => { ativo = es[0].isIntersecting; ativo ? liga() : desliga(); }, { threshold: 0 }).observe(stage);
  }
  document.addEventListener("visibilitychange", () => document.hidden ? desliga() : liga());
  // se o navegador derrubar o contexto WebGL (memória, aba em segundo plano), volta para o pôster
  cv.addEventListener("webglcontextlost", ev => {
    ev.preventDefault();
    desliga();
    ativo = false;
    cv.classList.remove("on");
    stage.classList.remove("pronto");
  });
  liga();
}

// ── material da peça: linhas de camada finas no shader ──
// cada camada vira um cordão sutil (a normal inclina no topo e na base) com um sulco fino entre camadas;
// as linhas somem suavemente quando ficariam menores que ~2 px, evitando cintilação em telas pequenas
function linhasDeCamada(mat){
  const uLH = { value: 5 };
  mat.userData.uLH = uLH;
  mat.onBeforeCompile = sh => {
    sh.uniforms.uLH = uLH;
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying float vNyvY;\nvarying vec3 vNyvN;")
      .replace("#include <begin_vertex>", `#include <begin_vertex>
        vec4 nyvP = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          nyvP = instanceMatrix * nyvP;
        #endif
        vNyvY = nyvP.y;
        vNyvN = normal;`);
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform float uLH;\nvarying float vNyvY;\nvarying vec3 vNyvN;")
      .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
        float nyvF = vNyvY / uLH;
        float nyvW = fwidth(nyvF);
        float nyvV = (1.0 - smoothstep(.16, .42, nyvW)) * (1.0 - abs(normalize(vNyvN).y));
        float nyvPh = fract(nyvF) - .5;
        normal = normalize(normal + (viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz * nyvPh * .7 * nyvV);
        float nyvSulco = 1.0 - smoothstep(0.0, max(.07, nyvW * 1.4), .5 - abs(nyvPh));
        diffuseColor.rgb *= 1.0 - .13 * nyvSulco * nyvV;`);
  };
  mat.customProgramCacheKey = () => "nyvos-camadas";
  return mat;
}

// ── display da impressora: interface desenhada em canvas com a identidade NYVOS ──
function criaTela(){
  const W = 512, H = 320;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d");
  const textura = new THREE.CanvasTexture(c);
  textura.colorSpace = THREE.SRGBColorSpace;
  textura.anisotropy = 4;
  const TXT = {
    imprimindo: ["IMPRIMINDO", "#F26522"], inspecao: ["INSPEÇÃO", "#FF8A4C"],
    pronta: ["PEÇA PRONTA", "#2BD96B"], preparando: ["PREPARANDO", "#9A9FA6"],
  };
  let st = "", pct = -1, cam = -1, total = 30, assinatura = "";
  const tela = {
    textura, sujo: true,
    estado(s, prog, camada, nc){
      const p = Math.round(prog * 100);
      if (s !== st || p !== pct || camada !== cam){ st = s; pct = p; cam = camada; total = nc; tela.sujo = true; }
    },
    desenha(){
      if (!tela.sujo) return;
      const a = `${st}|${pct}|${cam}|${document.fonts ? document.fonts.status : ""}`;
      tela.sujo = false;
      if (a === assinatura) return;
      assinatura = a;
      const [rotulo, cor] = TXT[st] || TXT.imprimindo;
      const mono = "'DM Mono', ui-monospace, monospace", disp = "'Outfit', system-ui, sans-serif";
      // fundo: vidro escuro com leve gradiente
      const fundo = g.createLinearGradient(0, 0, 0, H);
      fundo.addColorStop(0, "#17181C"); fundo.addColorStop(1, "#0C0D0F");
      g.fillStyle = fundo; g.fillRect(0, 0, W, H);
      // cabeçalho: estado com ponto colorido · temperaturas (a marca fica na frente da máquina, não na tela)
      g.textBaseline = "middle";
      g.fillStyle = cor; g.beginPath(); g.arc(37, 44, 8, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#E4E5E8"; g.font = `500 24px ${mono}`;
      g.fillText(rotulo, 56, 45);
      g.fillStyle = "#9A9FA6"; g.font = `500 18px ${mono}`; g.textAlign = "right";
      g.fillText(st === "imprimindo" ? "220°C · 60°C" : st === "preparando" ? "60°C" : "40°C", W - 28, 45);
      g.textAlign = "left";
      g.fillStyle = "rgba(255,255,255,.07)"; g.fillRect(28, 80, W - 56, 2);
      // percentual grande
      g.fillStyle = "#F3F2EE"; g.font = `700 104px ${disp}`; g.textBaseline = "alphabetic";
      g.fillText(`${pct}`, 26, 222);
      const wn = g.measureText(`${pct}`).width;
      g.fillStyle = "#9A9FA6"; g.font = `600 46px ${disp}`;
      g.fillText("%", 34 + wn, 220);
      // camada à direita
      g.textAlign = "right"; g.fillStyle = "#9A9FA6"; g.font = `500 18px ${mono}`;
      g.fillText("CAMADA", W - 28, 180);
      g.fillStyle = "#F3F2EE"; g.font = `600 34px ${disp}`;
      g.fillText(`${String(Math.max(cam, 0)).padStart(2, "0")}/${total}`, W - 28, 220);
      g.textAlign = "left";
      // barra de progresso
      g.fillStyle = "rgba(255,255,255,.09)"; arred(g, 28, 256, W - 56, 12, 6); g.fill();
      if (pct > 0){
        const gb = g.createLinearGradient(28, 0, W - 28, 0);
        if (st === "pronta"){ gb.addColorStop(0, "#1EB858"); gb.addColorStop(1, "#2BD96B"); }
        else { gb.addColorStop(0, "#C94A12"); gb.addColorStop(1, "#FF8A4C"); }
        g.fillStyle = gb; arred(g, 28, 256, Math.max(12, (W - 56) * pct / 100), 12, 6); g.fill();
      }
      // reflexo do vidro
      const brilho = g.createLinearGradient(0, 0, W, H);
      brilho.addColorStop(0, "rgba(255,255,255,.07)"); brilho.addColorStop(.45, "rgba(255,255,255,0)");
      g.fillStyle = brilho; g.fillRect(0, 0, W, H);
      textura.needsUpdate = true;
    },
  };
  return tela;
}

function arred(g, x, y, w, h, r){
  g.beginPath();
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

// ── geometria ──

// retângulo com cantos arredondados centrado na origem
function retArred(w, h, r){
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0);
  s.lineTo(x + w, y + h - r); s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2);
  s.lineTo(x + r, y + h); s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
  s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5);
  return s;
}

// caixa centrada na origem com todas as arestas arredondadas: as arestas paralelas ao `eixo`
// têm raio r, as demais o raio do chanfro b
function caixa(w, h, d, r, eixo = "y", b = 1.5){
  const [a, c, L] = eixo === "y" ? [w, d, h] : eixo === "x" ? [d, h, w] : [w, h, d];
  b = Math.min(b, L / 2 - .01, a / 2 - .01, c / 2 - .01);
  const sa = a - 2 * b, sc = c - 2 * b;
  const rr = Math.max(.01, Math.min(r - b, sa / 2 - .001, sc / 2 - .001));
  const g = new THREE.ExtrudeGeometry(retArred(sa, sc, rr), {
    depth: L - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 3, curveSegments: 8,
  });
  g.translate(0, 0, -(L - 2 * b) / 2);
  if (eixo === "y") g.rotateX(-Math.PI / 2);
  else if (eixo === "x") g.rotateY(Math.PI / 2);
  return suavizar(g);
}

// normais suaves entre faces com menos de `ang` graus de diferença (chanfros sem facetas)
function suavizar(g, ang = 50){
  const pos = g.attributes.position, nor = g.attributes.normal, n = pos.count;
  const lim = Math.cos(ang * Math.PI / 180), grupos = new Map(), out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++){
    const k = `${pos.getX(i).toFixed(2)},${pos.getY(i).toFixed(2)},${pos.getZ(i).toFixed(2)}`;
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k).push(i);
  }
  const v = new THREE.Vector3(), w = new THREE.Vector3(), s = new THREE.Vector3();
  for (const gr of grupos.values()){
    for (const i of gr){
      v.fromBufferAttribute(nor, i);
      s.set(0, 0, 0);
      for (const j of gr){ w.fromBufferAttribute(nor, j); if (v.dot(w) >= lim) s.add(w); }
      s.normalize();
      out[i * 3] = s.x; out[i * 3 + 1] = s.y; out[i * 3 + 2] = s.z;
    }
  }
  g.setAttribute("normal", new THREE.BufferAttribute(out, 3));
  return g;
}

// o símbolo N (96×96) com y para cima, centrado
function formaN(){
  const P = [[0, 0], [30, 0], [30, 32], [48, 32], [48, 64], [66, 64], [66, 0], [96, 0], [96, 96], [36, 96], [36, 64], [24, 64], [24, 32], [12, 32], [12, 96], [0, 96]];
  return new THREE.Shape(P.map(([x, y]) => new THREE.Vector2(x - 48, 48 - y)));
}

// ── texturas procedurais ──

function canvas(w, h, desenha){
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  desenha(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// chapa PEI texturizada: microgranulado claro/escuro
function texturaPEI(){
  const t = canvas(256, 256, (g, w, h) => {
    g.fillStyle = "#e6e6e6"; g.fillRect(0, 0, w, h);
    let s = 7;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 9000; i++){
      const v = rnd() < .5 ? 200 + rnd() * 25 : 245 + rnd() * 10;
      g.fillStyle = `rgb(${v},${v},${v})`;
      g.fillRect(rnd() * w, rnd() * h, 1.2, 1.2);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(5, 5);
  return t;
}

// logo horizontal NYVOS (assets/nyvos-logo-horizontal.svg) para a frente da base
function texturaMarca(){
  const K = 2048 / 575;
  const t = canvas(2048, Math.round(102 * K), g => {
    g.setTransform(K, 0, 0, K, 0, 2 * K);
    g.fillStyle = "#F26522";
    g.fill(new Path2D("M0 0H30V32H48V64H66V0H96V96H36V64H24V32H12V96H0Z"));
    g.fillStyle = "#1B1D21";
    const letra = (d, tx, ty = 0, sy = 1, regra = "nonzero") => {
      g.setTransform(K, 0, 0, K * sy, (128 + tx) * K, (2 + ty) * K);
      g.fill(new Path2D(d), regra);
    };
    letra("M0 0H20L60 62V0H80V96H60L20 34V96H0Z", 0);
    letra("M0 0H20L40 36L60 0H80L50 54V96H30V54Z", 94);
    letra("M0 0H20L40 64L60 0H80L50 96H30Z", 182);
    letra("M48 -1.5A48 49.5 0 1 0 48.01 -1.5ZM48 19.5A27 28.5 0 1 1 47.99 19.5Z", 272, 0, 1, "evenodd");
    letra("M66.42 18.91A34.5 29.5 0 1 0 34 58.5A13.5 8.5 0 1 1 21.31 69.91L1.58 77.09A34.5 29.5 0 1 0 34 37.5A13.5 8.5 0 1 1 46.69 26.09Z", 378, -1, 1.0206);
  });
  t.anisotropy = 8;
  return t;
}

// filamento enrolado na bobina: voltas finas ao longo do eixo
function texturaBobina(){
  const t = canvas(16, 256, (g, w, h) => {
    for (let y = 0; y < h; y += 4){
      g.fillStyle = "#ffffff"; g.fillRect(0, y, w, 2.6);
      g.fillStyle = "#c9c9c9"; g.fillRect(0, y + 2.6, w, 1.4);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1, 1);
  return t;
}

function texturaBrilho(){
  return canvas(64, 64, (g, w) => {
    const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    r.addColorStop(0, "rgba(255,246,234,1)");
    r.addColorStop(.25, "rgba(255,176,102,.85)");
    r.addColorStop(.6, "rgba(242,101,34,.25)");
    r.addColorStop(1, "rgba(242,101,34,0)");
    g.fillStyle = r; g.fillRect(0, 0, w, w);
  });
}

// faísca de 4 pontas (a mesma do brilho da marca)
function texturaFaisca(){
  return canvas(64, 64, (g, w) => {
    const c = w / 2;
    const r = g.createRadialGradient(c, c, 0, c, c, c);
    r.addColorStop(0, "rgba(255,248,238,1)"); r.addColorStop(.3, "rgba(255,200,150,.5)"); r.addColorStop(1, "rgba(255,160,90,0)");
    g.fillStyle = r;
    g.beginPath();
    g.moveTo(c, 0); g.quadraticCurveTo(c + 4, c - 4, w, c); g.quadraticCurveTo(c + 4, c + 4, c, w);
    g.quadraticCurveTo(c - 4, c + 4, 0, c); g.quadraticCurveTo(c - 4, c - 4, c, 0);
    g.fill();
  });
}

function texturaContato(){
  return canvas(128, 128, (g, w) => {
    const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    r.addColorStop(0, "rgba(0,0,0,.62)");
    r.addColorStop(.55, "rgba(0,0,0,.32)");
    r.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = r; g.fillRect(0, 0, w, w);
  });
}

// ambiente de estúdio para reflexos (caixa escura com softboxes, convertida em PMREM)
function ambiente(renderer){
  const env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), new THREE.MeshBasicMaterial({ color: 0x1d1f23, side: THREE.BackSide })));
  const luz = (w, h, x, y, z, int, cor = 0xffffff) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(cor).multiplyScalar(int), side: THREE.DoubleSide }));
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    env.add(m);
  };
  luz(7, 2.4, 0, 4.9, 0, 5);
  luz(2.2, 4.5, -4.9, 1.2, 1.2, 3);
  luz(2, 3.5, 4.9, .8, -1, 1.4);
  luz(4, 1.2, 0, .4, 4.9, 1.6);
  luz(2.4, 1.4, 3, 1.2, -4.9, 2.4, 0xFF8A4C);
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(env, .04).texture;
  pm.dispose();
  return tex;
}
