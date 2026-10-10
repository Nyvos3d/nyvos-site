// Cena do vídeo "O Clarão" — suporte Barber Connection · A Tempestade.
// A geometria vem do 3MF do cliente (sem remodelagem): modelo/<objeto>.pos.bin + .idx.bin, em mm.
// Unidade da cena: mm. Eixos: X = largura (+X = lateral direita), Y = altura, +Z = frente.
// A página expõe window.CENA.quadro(t) — desenha o instante t (s) de forma determinística.
import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ROTEIRO, DURACAO } from './roteiro.js';

const P = new URLSearchParams(location.search);
const W = +(P.get('w') || 1080), H = +(P.get('h') || 1920), ESCALA = +(P.get('s') || 1);
const OBJETOS = [
  ['01_CORPO_PRETO', 'preto'],
  ['02_RAIO_ESQUERDO_PRATA', 'prata'],
  ['03_RAIO_DIREITO_PRATA', 'prata'],
  ['04_LOGO_E_SUBTITULO_PRATA', 'prata'],
];
const FUNDO = new THREE.Color(0x060708);

// ---------- renderer ----------
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(ESCALA);
renderer.setSize(W, H);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
document.getElementById('palco').appendChild(renderer.domElement);
RectAreaLightUniformsLib.init();

const scene = new THREE.Scene();
scene.background = null;
const camera = new THREE.PerspectiveCamera(26, W / H, 5, 8000);
scene.add(camera);

// ---------- ambiente de estúdio (reflexos) ----------
function criaAmbiente() {
  const s = new THREE.Scene();
  s.add(new THREE.Mesh(new THREE.SphereGeometry(1000, 48, 24),
    new THREE.MeshBasicMaterial({ color: 0x020203, side: THREE.BackSide })));
  const painel = (w, h, pos, alvo, rgb) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
    m.material.color.setRGB(...rgb);
    m.position.set(...pos); m.lookAt(...alvo); s.add(m);
  };
  painel(900, 500, [0, 820, 250], [0, 0, 0], [3.2, 3.2, 3.3]);        // softbox de teto
  painel(140, 900, [-760, 300, 300], [0, 100, 0], [2.2, 2.25, 2.4]);   // faixa esquerda
  painel(140, 900, [760, 300, -200], [0, 100, 0], [1.6, 1.75, 2.0]);   // faixa direita (fria)
  painel(700, 120, [0, 160, -900], [0, 100, 0], [0.9, 1.0, 1.2]);      // recorte traseiro
  painel(1800, 300, [0, -200, 0], [0, 600, 0], [0.04, 0.04, 0.045]);   // rebatimento do piso
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(s, 0.035).texture;
  pm.dispose();
  return tex;
}
scene.environment = criaAmbiente();

// ---------- materiais ----------
const MAT = {
  // PRETO e PRATA do 3MF (#20232B / #D4D7DD). Prata como plástico pigmentado com brilho metálico,
  // para continuar lendo como prata em qualquer ângulo (metal puro fica escuro num estúdio preto).
  preto: new THREE.MeshPhysicalMaterial({ color: 0x20232b, roughness: 0.5, metalness: 0, specularIntensity: 0.6 }),
  prata: new THREE.MeshPhysicalMaterial({ color: 0xd4d7dd, roughness: 0.36, metalness: 0.38 }),
};

// Cópia espelhada (reflexo no piso): escurece com a distância abaixo do piso.
function materialReflexo(base) {
  const m = base.clone();
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vAlturaMundo;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvAlturaMundo = (modelMatrix * vec4(transformed, 1.0)).y;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vAlturaMundo;')
      .replace('#include <dithering_fragment>', '#include <dithering_fragment>\ngl_FragColor.rgb *= exp(vAlturaMundo / 14.0);');
  };
  return m;
}

// ---------- modelo ----------
const peca = new THREE.Group();
const reflexo = new THREE.Group();
scene.add(peca, reflexo);
reflexo.scale.y = -1;

async function carregaModelo() {
  for (const [nome, mat] of OBJETOS) {
    const [pos, idx] = await Promise.all(['pos', 'idx'].map((k) =>
      fetch(`modelo/${nome}.${k}.bin`).then((r) => { if (!r.ok) throw new Error(nome + ' ' + r.status); return r.arrayBuffer(); })));
    let g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
    g.setIndex(new THREE.BufferAttribute(new Uint32Array(idx), 1));
    g.rotateX(-Math.PI / 2);          // 3MF: Z para cima → three: Y para cima
    g.translate(0, 0, 42.5);          // centro da base na origem (profundidade 0–85 mm)
    g = toCreasedNormals(g, THREE.MathUtils.degToRad(28));
    const m = new THREE.Mesh(g, MAT[mat]);
    m.castShadow = m.receiveShadow = true;
    peca.add(m);
    reflexo.add(new THREE.Mesh(g, materialReflexo(MAT[mat])));
  }
}

// ---------- piso: escuro, levemente brilhante, dissolve no fundo ----------
const piso = new THREE.Mesh(new THREE.CircleGeometry(900, 96), new THREE.MeshPhysicalMaterial({
  color: 0x0b0c0f, roughness: 0.55, metalness: 0, specularIntensity: 0.55, transparent: true, depthWrite: false,
}));
piso.rotation.x = -Math.PI / 2;
piso.material.onBeforeCompile = (sh) => {
  sh.uniforms.uOpacidadeCentro = { value: 0.9 };
  piso.material.userData.sh = sh;
  sh.vertexShader = sh.vertexShader
    .replace('#include <common>', '#include <common>\nvarying vec2 vPisoXZ;')
    .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvPisoXZ = (modelMatrix * vec4(transformed, 1.0)).xz;');
  sh.fragmentShader = sh.fragmentShader
    .replace('#include <common>', '#include <common>\nvarying vec2 vPisoXZ;\nuniform float uOpacidadeCentro;')
    .replace('#include <dithering_fragment>', `#include <dithering_fragment>
      float r = length(vPisoXZ);
      gl_FragColor.a = uOpacidadeCentro * (1.0 - smoothstep(170.0, 520.0, r));`);
};
piso.renderOrder = 1;
piso.receiveShadow = true;
scene.add(piso);

// ---------- sombra de contato (calculada uma vez: a peça não se move) ----------
function sombraDeContato() {
  const L = 260, RES = 1024, ALT = 60;
  const rt = new THREE.WebGLRenderTarget(RES, RES), rtBlur = new THREE.WebGLRenderTarget(RES, RES);
  const cam = new THREE.OrthographicCamera(-L / 2, L / 2, L / 2, -L / 2, 0, ALT);
  cam.rotation.x = Math.PI / 2;          // olhando de baixo para cima
  const dm = new THREE.MeshDepthMaterial();
  dm.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace('gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );',
      'gl_FragColor = vec4( vec3( 0.0 ), pow( 1.0 - fragCoordZ, 3.0 ) );');
  };
  const prev = scene.overrideMaterial, bg = scene.background, vis = [piso.visible, reflexo.visible];
  piso.visible = reflexo.visible = false;
  scene.overrideMaterial = dm; scene.background = null;
  renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(scene, cam);
  scene.overrideMaterial = prev; scene.background = bg; [piso.visible, reflexo.visible] = vis;
  // desfoque gaussiano separável, algumas passadas
  const blur = new THREE.ShaderMaterial({
    uniforms: { t: { value: null }, d: { value: new THREE.Vector2() } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `uniform sampler2D t; uniform vec2 d; varying vec2 vUv;
      void main(){ vec4 s = vec4(0.0); float wsum = 0.0;
        for (int i = -8; i <= 8; i++) { float w = exp(-float(i*i) / 24.0); s += texture2D(t, vUv + d * float(i)) * w; wsum += w; }
        gl_FragColor = s / wsum; }`,
    depthTest: false, depthWrite: false, transparent: false,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), blur), qs = new THREE.Scene(); qs.add(quad);
  const oc = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  for (const passo of [3, 2, 1]) {
    blur.uniforms.t.value = rt.texture; blur.uniforms.d.value.set(passo / RES, 0);
    renderer.setRenderTarget(rtBlur); renderer.render(qs, oc);
    blur.uniforms.t.value = rtBlur.texture; blur.uniforms.d.value.set(0, passo / RES);
    renderer.setRenderTarget(rt); renderer.render(qs, oc);
  }
  renderer.setRenderTarget(null);
  const plano = new THREE.Mesh(new THREE.PlaneGeometry(L, L), new THREE.MeshBasicMaterial({
    map: rt.texture, transparent: true, depthWrite: false, opacity: 0.95, toneMapped: false,
  }));
  plano.rotation.x = -Math.PI / 2; plano.scale.y = -1; plano.position.y = 0.05; plano.renderOrder = 2;
  scene.add(plano);
}

// ---------- fundo: degradê + "poça" de luz atrás da peça (preso à câmera) ----------
const fundoMat = new THREE.ShaderMaterial({
  uniforms: {
    uCentro: { value: new THREE.Vector2(0.5, 0.58) }, uRaio: { value: 0.55 },
    uBrilho: { value: 0.05 }, uFlash: { value: 0 }, uAspect: { value: W / H },
    uCorBrilho: { value: new THREE.Color(0.55, 0.6, 0.7) }, uCorFlash: { value: new THREE.Color(0.75, 0.85, 1.0) },
  },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.9999, 1.0); }',
  fragmentShader: `varying vec2 vUv; uniform vec2 uCentro; uniform float uRaio, uBrilho, uFlash, uAspect;
    uniform vec3 uCorBrilho, uCorFlash;
    void main(){
      vec2 d = (vUv - uCentro) * vec2(uAspect, 1.0);
      float g = exp(-dot(d, d) / (uRaio * uRaio));
      vec3 c = vec3(${FUNDO.r.toFixed(4)}, ${FUNDO.g.toFixed(4)}, ${FUNDO.b.toFixed(4)});
      c += uCorBrilho * g * uBrilho;
      float gf = exp(-dot(d, d) / (uRaio * uRaio * 2.2));
      c += uCorFlash * gf * uFlash;
      gl_FragColor = vec4(c, 1.0);
    }`,
  depthWrite: false, depthTest: false,
});
const fundo = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), fundoMat);
fundo.frustumCulled = false; fundo.renderOrder = -10;
scene.add(fundo);

// ---------- luzes ----------
const luz = {};
function area(nome, w, h, cor, pos, alvo) {
  const l = new THREE.RectAreaLight(cor, 0, w, h);
  l.position.set(...pos); l.lookAt(...alvo); scene.add(l); luz[nome] = l; return l;
}
area('chave', 160, 110, 0xfff4ea, [-170, 230, 210], [0, 55, 0]);       // principal, frontal-esquerda
area('recorteD', 26, 260, 0xdde7ff, [190, 120, -150], [0, 60, 0]);      // recorte traseiro direito
area('recorteE', 26, 260, 0xdde7ff, [-190, 120, -150], [0, 60, 0]);     // recorte traseiro esquerdo
area('contra', 260, 180, 0xcfe0ff, [0, 110, -260], [0, 60, 0]);         // contraluz do clarão
area('varredura', 14, 120, 0xffffff, [-140, 30, 120], [0, 20, 40]);     // faixa que varre o logo/raio
area('topo', 140, 140, 0xffffff, [0, 300, 0], [0, 0, 0]);               // luz de teto suave
area('preenche', 160, 160, 0xe8eeff, [260, 80, 180], [0, 50, 0]);       // preenchimento frio, baixo
// RectAreaLight não projeta sombra: um spot acompanha a luz principal só para as sombras
const sombra = new THREE.SpotLight(0xfff4ea, 0, 0, THREE.MathUtils.degToRad(24), 0.8, 0);
sombra.castShadow = true;
sombra.shadow.mapSize.set(2048, 2048);
sombra.shadow.camera.near = 100; sombra.shadow.camera.far = 900;
sombra.shadow.bias = -0.0004; sombra.shadow.normalBias = 0.3; sombra.shadow.radius = 6;
scene.add(sombra, sombra.target);
luz.sombra = sombra;

// ---------- pós-produção ----------
const rt = new THREE.WebGLRenderTarget(W * ESCALA, H * ESCALA, { type: THREE.HalfFloatType, samples: 4 });
const composer = new EffectComposer(renderer, rt);
composer.setPixelRatio(ESCALA); composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
const bokeh = new BokehPass(scene, camera, { focus: 300, aperture: 0, maxblur: 0.01 });
composer.addPass(bokeh);
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.1, 0.5, 2.2);   // limiar alto: só os clarões florescem
composer.addPass(bloom);
composer.addPass(new OutputPass());
const grade = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uSeed: { value: 0 }, uVinheta: { value: 0.35 }, uFade: { value: 1 }, uGrao: { value: 0.018 }, uClarao: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uSeed, uVinheta, uFade, uGrao, uClarao; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + uSeed) * 43758.5453); }
    void main(){
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      vec2 q = vUv - 0.5; q.x *= ${(W / H).toFixed(4)};
      c *= 1.0 - uVinheta * smoothstep(0.25, 0.85, length(q) * 1.25);
      c += (h(gl_FragCoord.xy) - 0.5) * uGrao;
      c = mix(c, vec3(0.86, 0.9, 1.0), uClarao);
      gl_FragColor = vec4(c * uFade, 1.0);
    }`,
});
composer.addPass(grade);

// ---------- estado por quadro ----------
const ALVO = new THREE.Vector3();
function aplica(estado, t) {
  const { cam, luzes, fundo: f, dof, fade } = estado;
  // câmera em coordenadas esféricas em torno do alvo: az 0° = frente, 90° = lateral direita
  ALVO.set(...cam.alvo);
  const az = THREE.MathUtils.degToRad(cam.az), el = THREE.MathUtils.degToRad(cam.el);
  camera.position.set(
    ALVO.x + cam.dist * Math.cos(el) * Math.sin(az),
    ALVO.y + cam.dist * Math.sin(el),
    ALVO.z + cam.dist * Math.cos(el) * Math.cos(az));
  camera.up.set(Math.sin(THREE.MathUtils.degToRad(cam.roll || 0)), Math.cos(THREE.MathUtils.degToRad(cam.roll || 0)), 0);
  camera.lookAt(ALVO);
  camera.fov = cam.fov; camera.updateProjectionMatrix();
  for (const [k, l] of Object.entries(luz)) {
    const c = luzes[k];
    if (!c) { l.intensity = 0; continue; }
    if (typeof c === 'number') { l.intensity = c; continue; }
    l.intensity = c.i;   // spot com decay 0: sem queda com a distância (cena em mm)
    if (c.pos) l.position.set(...c.pos);
    if (l.isSpotLight) { if (c.alvo) l.target.position.set(...c.alvo); }
    else if (c.alvo) l.lookAt(...c.alvo);
    if (c.w) l.width = c.w;
    if (c.h) l.height = c.h;
  }
  scene.environmentIntensity = estado.ambiente ?? luzes.ambiente ?? 0.35;
  bloom.strength = estado.bloom ?? 0.2;
  grade.uniforms.uClarao.value = estado.clarao ?? 0;
  fundoMat.uniforms.uBrilho.value = f.brilho; fundoMat.uniforms.uFlash.value = f.flash;
  fundoMat.uniforms.uCentro.value.set(...(f.centro || [0.5, 0.58]));
  fundoMat.uniforms.uRaio.value = f.raio ?? 0.55;
  bokeh.enabled = !!dof;
  if (dof) {
    // foco = profundidade (eixo da câmera) do ponto que deve ficar nítido
    camera.updateMatrixWorld();
    const p = new THREE.Vector3(...dof.ponto).applyMatrix4(camera.matrixWorldInverse);
    bokeh.uniforms.focus.value = dof.foco ?? -p.z;
    bokeh.uniforms.aperture.value = dof.abertura; bokeh.uniforms.maxblur.value = dof.max ?? 0.012;
  }
  grade.uniforms.uFade.value = fade ?? 1;
  grade.uniforms.uSeed.value = (t * 30) % 97;
}

window.CENA = {
  duracao: DURACAO,
  pronto: false,
  quadro(t) {
    const estado = ROTEIRO(t);
    aplica(estado, t);
    composer.render();
    if (window.SOBREPOSICAO) window.SOBREPOSICAO(t, estado);
    return estado.cena;
  },
  // depuração: câmera livre
  livre(az, el, dist, alvoY = 55, fov = 26, amb = 0.6, lz = 1) {
    aplica({ cam: { az, el, dist, alvo: [0, alvoY, 0], fov },
      luzes: { chave: 6 * lz, recorteD: 2 * lz, recorteE: 2 * lz, topo: 3 * lz }, ambiente: amb, fundo: { brilho: 0.05, flash: 0 } }, 0);
    composer.render();
  },
};

carregaModelo().then(() => {
  sombraDeContato();
  window.CENA.pronto = true;
  const t = P.get('t');
  if (P.get('livre')) window.CENA.livre(...P.get('livre').split(',').map(Number));
  else if (t !== null) window.CENA.quadro(+t);
}).catch((e) => { window.CENA.erro = String(e); console.error(e); });
