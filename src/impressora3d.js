// NYVOS — impressora 3D do hero (WebGL / three.js)
// Modelo minimalista de impressora de mesa deslizante (base, mesa, duas colunas,
// travessa, eixo X que sobe a cada camada, cabeçote e bobina) imprimindo o N
// Estrato em pé, camada por camada. Medidas em milímetros dentro de `raiz`.
import * as THREE from "three";

const stage = document.getElementById("stage");
const cv = document.getElementById("impressora3d");
if (stage && cv) iniciar();

function iniciar(){
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // modo leve: celulares e telas de toque (sem sombras dinâmicas, 30 qps, pixel ratio menor)
  const mob = matchMedia("(max-width:640px),(hover:none)").matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (e) { return; }                       // sem WebGL: o pôster estático continua no lugar
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mob ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.shadowMap.enabled = !mob;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const cena = new THREE.Scene();
  cena.environment = ambiente(renderer);
  const raiz = new THREE.Group();
  raiz.scale.setScalar(0.01);                  // 1 unidade do mundo = 100 mm
  cena.add(raiz);

  // ── cores e materiais ──
  const COR = { mineral: 0xE9E8E4, alu: 0xC6C9CF, grafite: 0x2A2C31, pei: 0x2E2D2B, laranja: 0xF26522, latao: 0xC98A4B };
  const M = {
    corpo: new THREE.MeshStandardMaterial({ color: COR.mineral, roughness: .5, metalness: 0 }),
    alu: new THREE.MeshStandardMaterial({ color: COR.alu, roughness: .28, metalness: .95 }),
    escuro: new THREE.MeshStandardMaterial({ color: COR.grafite, roughness: .55, metalness: .25 }),
    trilho: new THREE.MeshStandardMaterial({ color: 0x8C9097, roughness: .22, metalness: 1 }),
    pei: new THREE.MeshStandardMaterial({ color: COR.pei, roughness: .8, metalness: .35, map: texturaPEI() }),
    latao: new THREE.MeshStandardMaterial({ color: COR.latao, roughness: .3, metalness: 1 }),
    led: new THREE.MeshBasicMaterial({ color: new THREE.Color(COR.laranja).multiplyScalar(1.5) }),
    marca: new THREE.MeshStandardMaterial({ color: 0xBDBCB7, roughness: .6 }),
    acento: new THREE.MeshStandardMaterial({ color: COR.laranja, roughness: .4, emissive: COR.laranja, emissiveIntensity: .35 }),
    peca: new THREE.MeshPhysicalMaterial({ color: COR.laranja, roughness: .36, clearcoat: .6, clearcoatRoughness: .22 }),
    quente: new THREE.MeshStandardMaterial({ color: 0xFF9A55, roughness: .4, emissive: 0xFF5A14, emissiveIntensity: 1.1 }),
    brasa: new THREE.MeshBasicMaterial({ color: 0xFF6A1F, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
    ptfe: new THREE.MeshStandardMaterial({ color: 0xF4F3EF, roughness: .3, transparent: true, opacity: .9 }),
    filamento: new THREE.MeshStandardMaterial({ color: COR.laranja, roughness: .42, map: texturaBobina() }),
  };

  const add = (pai, geo, mat, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = true;
    pai.add(m);
    return m;
  };

  // ── base ──
  const BASE_TOPO = 70;
  add(raiz, caixa(352, 6, 432, 30, "y", 2), M.escuro, 0, 3, -10);
  add(raiz, caixa(360, 64, 440, 34, "y", 8), M.corpo, 0, 38, -10);
  add(raiz, new THREE.BoxGeometry(110, 3, 1.5), M.led, 0, 40, 210.4).castShadow = false;
  const logo = add(raiz, new THREE.ShapeGeometry(formaN()), M.marca, -150, 46, 210.3);
  logo.scale.set(.13, .13, 1);
  logo.castShadow = false;

  // ── mesa (eixo Y): carro, chapa PEI e a peça ──
  const mesa = new THREE.Group();
  raiz.add(mesa);
  add(mesa, caixa(236, 8, 236, 10, "y", 1.5), M.escuro, 0, BASE_TOPO + 4, 0);
  add(mesa, caixa(270, 5, 270, 9, "y", 1.2), M.pei, 0, BASE_TOPO + 10.5, 0);
  add(mesa, caixa(56, 4, 18, 4, "y", 1), M.escuro, 0, BASE_TOPO + 10, 144);
  const MESA_TOPO = BASE_TOPO + 13;

  // ── colunas, pés e travessa ──
  const COL_Z = -125, COL_X = 158, COL_H = 430;
  for (const s of [-1, 1]){
    add(raiz, caixa(48, 22, 48, 8, "y", 2), M.escuro, s * COL_X, BASE_TOPO + 11, COL_Z);
    add(raiz, caixa(34, COL_H, 34, 6, "y", 2), M.alu, s * COL_X, BASE_TOPO + COL_H / 2, COL_Z);
  }
  const TOPO = BASE_TOPO + COL_H;
  add(raiz, caixa(352, 30, 36, 6, "x", 2), M.alu, 0, TOPO + 15, COL_Z);

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

  // ── cabeçote: corpo, faixa laranja, ventoinha, bloco aquecedor e bico ──
  const cab = new THREE.Group();
  raiz.add(cab);
  add(cab, caixa(62, 86, 56, 11, "z", 3), M.corpo, 0, 0, 0);
  add(cab, new THREE.BoxGeometry(62.6, 3, 56.6), M.acento, 0, -26, 0);
  add(cab, new THREE.CylinderGeometry(15, 15, 2, 48).rotateX(Math.PI / 2), M.escuro, 0, 12, 28.6);
  add(cab, new THREE.TorusGeometry(15.4, 1.1, 10, 48), M.acento, 0, 12, 29.4);
  add(cab, new THREE.CylinderGeometry(4.5, 4.5, 2, 24).rotateX(Math.PI / 2), M.corpo, 0, 12, 30);
  add(cab, new THREE.BoxGeometry(48, 58, 10), M.escuro, 0, 2, -32);
  add(cab, new THREE.CylinderGeometry(6, 6, 9, 20), M.escuro, 0, 47, -4);
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
  const bobina = new THREE.Group();
  bobina.position.set(228, 420, COL_Z);
  raiz.add(bobina);
  add(raiz, new THREE.CylinderGeometry(6, 6, 92, 16).rotateZ(Math.PI / 2), M.escuro, 221, 420, COL_Z);
  const eixoX = g => g.rotateZ(Math.PI / 2);
  add(bobina, eixoX(new THREE.CylinderGeometry(84, 84, 56, 72)), M.filamento);
  for (const s of [-1, 1]) add(bobina, eixoX(new THREE.CylinderGeometry(98, 98, 5, 72)), M.escuro, s * 30.5, 0, 0);
  add(bobina, eixoX(new THREE.CylinderGeometry(30, 30, 68, 40)), M.corpo);

  // ── tubo PTFE: da bobina até o topo do cabeçote (refeito quando o cabeçote anda) ──
  const tubo = add(raiz, new THREE.BufferGeometry(), M.ptfe);
  tubo.castShadow = false;
  const curva = new THREE.CatmullRomCurve3([0, 1, 2, 3, 4].map(() => new THREE.Vector3()), false, "centripetal");
  function refazTubo(x, y){
    const p = curva.points;
    p[0].set(214, 512, COL_Z + 8);
    p[1].set(176, 586, -110);
    p[2].set((x + 176) / 2, 606, -86);
    p[3].set(x, y + 92, CAB_Z - 4);
    p[4].set(x, y + 51, CAB_Z - 4);
    tubo.geometry.dispose();
    tubo.geometry = new THREE.TubeGeometry(curva, 44, 3.2, 8, false);
  }

  // ── a peça: o N em pé, camada por camada ──
  // faixas horizontais do N (de baixo para cima), em unidades do símbolo 96×96
  const FAIXAS = [[[0, 12], [36, 96]], [[0, 12], [24, 48], [66, 96]], [[0, 30], [66, 96]]];
  const U = 1.5, NC = 30, LH = 96 * U / NC, ESP = 30;    // 144 mm de altura · 30 camadas de 4,8 mm · 30 mm de espessura
  const peca = new THREE.Group();
  peca.position.y = MESA_TOPO;
  mesa.add(peca);
  const geoCamada = new Map();
  const geoDe = w => geoCamada.get(w) || geoCamada.set(w, caixa(w, LH, ESP, LH / 2, "z", LH * .3)).get(w);
  const camadas = [];                             // por camada: [{ a, b (mm), w }]
  for (let i = 0; i < NC; i++){
    camadas.push(FAIXAS[Math.floor(i * 3 / NC)].map(([a, b]) => ({ a: (a - 48) * U, b: (b - 48) * U, w: (b - a) * U })));
  }
  // camadas prontas: uma InstancedMesh por largura, instâncias em ordem de camada
  const lotes = new Map();
  camadas.forEach((cs, i) => cs.forEach(c => {
    if (!lotes.has(c.w)) lotes.set(c.w, { itens: [], ate: [] });
    lotes.get(c.w).itens.push({ i, x: (c.a + c.b) / 2 });
  }));
  const m4 = new THREE.Matrix4();
  for (const [w, lote] of lotes){
    const im = new THREE.InstancedMesh(geoDe(w), M.peca, lote.itens.length);
    lote.itens.forEach((it, k) => im.setMatrixAt(k, m4.makeTranslation(it.x, it.i * LH + LH / 2, 0)));
    im.castShadow = im.receiveShadow = true;
    for (let L = 0; L <= NC; L++) lote.ate[L] = lote.itens.filter(it => it.i < L).length;
    lote.im = im;
    peca.add(im);
  }
  // camada em impressão (filamento quente) e a anterior esfriando
  const ativa = [0, 1, 2].map(() => add(peca, geoDe(camadas[0][0].w), M.quente));
  const brasa = [0, 1, 2].map(() => { const m = add(peca, geoDe(camadas[0][0].w), M.brasa); m.castShadow = false; return m; });

  // ── luzes ──
  const chave = new THREE.DirectionalLight(0xFFF3E6, 2.3);
  chave.position.set(-3.2, 7.5, 5.2);
  chave.target.position.set(0, 1.6, -.4);
  chave.castShadow = !mob;
  Object.assign(chave.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 18 });
  chave.shadow.mapSize.set(2048, 2048);
  chave.shadow.bias = -.0004;
  chave.shadow.normalBias = .02;
  chave.shadow.radius = 3;
  cena.add(chave, chave.target);
  const contra = new THREE.DirectionalLight(0xFF8A4C, 1.5);
  contra.position.set(4.5, 4, -6);
  cena.add(contra);
  const varre = new THREE.DirectionalLight(0xFFFFFF, 0);    // luz que varre a peça pronta
  cena.add(varre, varre.target);
  varre.target.position.set(0, 1.4, -.5);

  // chão: só a sombra de contato — a máquina "flutua" como foto de produto
  const contato = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 5.2), new THREE.MeshBasicMaterial({ map: texturaContato(), transparent: true, depthWrite: false }));
  contato.rotation.x = -Math.PI / 2;
  contato.position.set(.05, .002, -.08);
  cena.add(contato);

  // ── câmera ──
  const cam = new THREE.PerspectiveCamera(24, 1, .1, 60);
  const ALVO = new THREE.Vector3(.42, 2.02, -.3);
  const CAM = { az: -23, el: 14, dist: 18.4 };
  const mira = { x: 0, y: 0, ax: 0, ay: 0 };
  function posCamera(t){
    const az = (CAM.az + (mob || reduce ? 0 : 6 * Math.sin((t - INICIO * T) / 22 * Math.PI * 2)) + mira.ax * 7) * Math.PI / 180;
    const el = (CAM.el + mira.ay * 4) * Math.PI / 180;
    cam.position.set(ALVO.x + CAM.dist * Math.sin(az) * Math.cos(el), ALVO.y + CAM.dist * Math.sin(el), ALVO.z + CAM.dist * Math.cos(az) * Math.cos(el));
    cam.lookAt(ALVO);
  }
  if (!mob && !reduce){
    stage.addEventListener("pointermove", e => {
      const r = stage.getBoundingClientRect();
      mira.x = ((e.clientX - r.left) / r.width - .5) * 2;
      mira.y = ((e.clientY - r.top) / r.height - .5) * 2;
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
  const tela = {
    box: document.getElementById("tela"), st: document.getElementById("telaSt"),
    pc: document.getElementById("telaPc"), bar: document.getElementById("telaBar"), msg: document.getElementById("telaMsg"),
  };
  let rotulo = "";

  function camadaVisivel(m, c, frac, dir){
    if (frac <= .001){ m.visible = false; return; }
    m.visible = true;
    m.geometry = geoDe(c.w);
    m.scale.x = frac;
    m.position.x = dir > 0 ? c.a + c.w * frac / 2 : c.b - c.w * frac / 2;
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
      camadas[L].forEach((c, k) => {
        const frac = dir > 0 ? cl((nx - c.a) / c.w) : cl((c.b - nx) / c.w);
        camadaVisivel(ativa[k], c, frac, dir);
        ativa[k].position.y = L * LH + LH / 2;
      });
      if (L > 0){
        M.brasa.opacity = .5 * (1 - dentro) * (1 - dentro);
        camadas[L - 1].forEach((c, k) => {
          const m = brasa[k];
          m.visible = true;
          m.geometry = geoDe(c.w);
          m.scale.set(1.004, 1.02, 1.03);
          m.position.set((c.a + c.b) / 2, (L - 1) * LH + LH / 2, 0);
        });
      }
      setTela("Imprimindo", `Camada ${String(L + 1).padStart(2, "0")}/${NC}`, f, false);
    } else {
      L = NC;
      const topo = MESA_TOPO + NC * LH + .4;
      const a = suave(cl((p - F_IMP) / (F_APR - F_IMP)));           // recolhe o cabeçote e apresenta a mesa
      const r = suave(cl((p - F_SAI - .03) / (1 - F_SAI - .03)));   // volta para o início
      nx = lerp(lerp(X1, PARK_X, a), X0, r);
      ny = lerp(lerp(topo, topo + 70, a), MESA_TOPO + LH + .4, r);
      mz = lerp(lerp(MESA_Z, MESA_SHOW, a), MESA_Z, r);
      quente = 1 - cl((p - F_IMP) / .02);
      opaco = 1 - cl((p - F_SAI) / .035);
      if (p >= F_APR && p < F_SAI) sweep = (p - F_APR) / (F_SAI - F_APR);
      if (p < F_APR) setTela("Inspeção", "Acabamento", 1, false);
      else if (p < .97) setTela("Peça pronta", "Retire a peça", 1, true);
      else setTela("Preparando", "Nivelando mesa", 0, false);
    }

    for (const lote of lotes.values()) lote.im.count = lote.ate[L];
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

    // brilho de estúdio: uma luz atravessa a peça pronta da esquerda para a direita
    if (sweep >= 0){
      const s = suave(sweep);
      varre.position.set(lerp(-6, 6, s), 3.2, 5);
      varre.intensity = 3.2 * Math.sin(Math.PI * Math.min(1, sweep * 1.6));
    } else varre.intensity = 0;
    return { nx, ny };
  }

  function setTela(st, msg, prog, ok){
    if (!tela.box) return;
    if (st !== rotulo){ tela.st.textContent = st; tela.box.classList.toggle("ok", ok); rotulo = st; }
    if (tela.msg.textContent !== msg) tela.msg.textContent = msg;
    const pc = Math.round(prog * 100) + "%";
    if (tela.pc.textContent !== pc) tela.pc.textContent = pc;
    tela.bar.style.transform = `scaleX(${prog.toFixed(3)})`;
  }

  // ── tamanho, laço de animação e pausa fora da tela ──
  function ajusta(){
    const w = cv.clientWidth, h = cv.clientHeight;
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
    if (Math.abs(nx - tuboX) > .5 || Math.abs(cy - tuboY) > .5){ refazTubo(nx, cy); tuboX = nx; tuboY = cy; }
    posCamera(t);
    renderer.render(cena, cam);
  }

  // pôster estático (gerado a partir desta mesma cena): #poster expõe a captura de um instante
  if (location.hash === "#poster"){
    window.__nyvosPoster = p => { tuboX = NaN; quadro(p * T); return cv.toDataURL("image/png"); };
  }

  const revela = () => { cv.classList.add("on"); stage.classList.add("pronto"); };
  if (reduce){                                     // sem movimento: só a peça pronta, parada
    quadro(T * (F_APR + .02));
    revela();
    return;
  }

  const t0 = performance.now();
  let raf = null, ultimo = 0, primeiro = true, ativo = true;
  const passo = mob ? 1000 / 30 : 0;
  function laco(agora){
    raf = requestAnimationFrame(laco);
    if (agora - ultimo < passo) return;
    ultimo = agora;
    quadro((agora - t0) / 1000 + INICIO * T);
    if (primeiro){ primeiro = false; revela(); }
  }
  const liga = () => { if (!raf && ativo && !document.hidden) raf = requestAnimationFrame(laco); };
  const desliga = () => { if (raf){ cancelAnimationFrame(raf); raf = null; } };
  if ("IntersectionObserver" in window){
    new IntersectionObserver(es => { ativo = es[0].isIntersecting; ativo ? liga() : desliga(); }, { threshold: 0 }).observe(stage);
  }
  document.addEventListener("visibilitychange", () => document.hidden ? desliga() : liga());
  liga();
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
