// Roteiro "O Clarão": estado da cena em função do tempo t (s). Puro e determinístico.
// Câmera em coordenadas esféricas em torno do alvo (az 0° = frente, 90° = lateral direita).
// Referências medidas no 3MF (mm, eixos da cena): logo na face frontal inclinada (~20°),
// "O" com raio ≈ (17, 18, 38); "A TEMPESTADE" ≈ (0, 8.8, 40.8), letras de 2,3 mm;
// raio direito na face x ≈ 36,6, da base frontal (z 30, y 5) ao topo traseiro (z −39, y 113).

export const FPS = 30;
export const DURACAO = 20;
// cortes (s): plano a plano
export const CORTES = { s3a: 7.4, s3b: 9.9, s3c: 12.2, s4: 14.4, s5: 16.5 };

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const lerpV = (a, b, k) => a.map((v, i) => lerp(v, b[i], k));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const suave = (k) => k * k * (3 - 2 * k);
const sen = (k) => 0.5 - 0.5 * Math.cos(Math.PI * k);           // ease in-out senoidal
const saida = (k) => 1 - Math.pow(1 - k, 3);                     // ease out cúbico
const RAD = Math.PI / 180;
const orbita = (alvo, az, el, d) => [
  alvo[0] + d * Math.cos(el * RAD) * Math.sin(az * RAD),
  alvo[1] + d * Math.sin(el * RAD),
  alvo[2] + d * Math.cos(el * RAD) * Math.cos(az * RAD)];

// relâmpago: soma de pulsos com ataque de ~1 quadro e decaimento exponencial
function relampago(t, pulsos) {
  let v = 0;
  for (const [t0, amp, dec] of pulsos) {
    const d = t - t0;
    if (d < -0.034) continue;
    v += amp * (d < 0 ? (d + 0.034) / 0.034 : Math.exp(-d / dec));
  }
  return v;
}
const FLASH_1 = [[0.55, 1.0, 0.05], [0.62, 0.45, 0.04], [0.70, 0.85, 0.07]];
const FLASH_2 = [[1.45, 0.6, 0.05], [1.52, 1.0, 0.06], [1.63, 0.5, 0.05], [1.76, 0.9, 0.09], [1.98, 0.35, 0.12]];
// clarão que esconde um corte: pico no instante do corte
const clarao = (t, tc, amp = 1) => amp * Math.exp(-Math.pow((t - tc) / 0.045, 2));

// rig base de estúdio (posições fixas no mundo)
function rigHero(k = 1) {
  return {
    chave: { i: 5 * k, pos: [-240, 250, 250], alvo: [0, 50, 0], w: 260, h: 170 },
    sombra: { i: 1.0 * k, pos: [-260, 330, 300], alvo: [0, 40, 0] },
    recorteD: { i: 1.9 * k, pos: [210, 140, -190], alvo: [0, 60, 0], w: 30, h: 260 },
    recorteE: { i: 1.7 * k, pos: [-210, 140, -190], alvo: [0, 60, 0], w: 30, h: 260 },
    topo: { i: 1.3 * k, pos: [0, 320, 40], alvo: [0, 0, 0], w: 200, h: 200 },
    preenche: { i: 2.6 * k, pos: [300, 130, 70], alvo: [0, 55, 0], w: 200, h: 200 },   // ilumina a face do raio direito
  };
}

function base() {
  return {
    cena: 0,
    cam: { az: 30, el: 9, dist: 590, alvo: [0, 57, 0], fov: 24 },
    luzes: {}, ambiente: 0.22,
    fundo: { brilho: 0.07, flash: 0, centro: [0.5, 0.6], raio: 0.5 },
    dof: null, bloom: 0.08, clarao: 0, fade: 1, texto: 0,
  };
}

export function ROTEIRO(t) {
  const e = base();

  if (t < CORTES.s3a) {
    // ---- 1 + 2: silhueta no clarão → órbita até o hero 3/4 (plano contínuo) ----
    e.cena = t < 3 ? 1 : 2;
    const f = relampago(t, [...FLASH_1, ...FLASH_2]);
    const push = saida(seg(t, 0, 3.4));
    const orb = sen(seg(t, 2.7, 7.0));
    const alvo = lerpV([0, 60, -2], [0, 57, 0], orb);
    e.cam = { az: lerp(lerp(83, 79, push), 30, orb), el: lerp(3, 9, orb), dist: lerp(lerp(610, 550, push), 590, orb), alvo, fov: 24 };
    const luzOn = suave(seg(t, 2.6, 4.4));
    const r = rigHero(luzOn);
    // contraluz do relâmpago: sempre atrás da peça em relação à câmera
    r.contra = { i: 16 * f, pos: orbita([0, 70, 0], e.cam.az + 180, 38, 320), alvo: [0, 60, 0], w: 320, h: 220 };
    // filete rasante no raio direito (aparece entre os flashes e some quando a luz principal entra)
    const filete = suave(seg(t, 0.9, 2.4)) * (1 - suave(seg(t, 4.0, 5.5)));
    r.varredura = { i: 20 * filete, pos: [78, 8, 120], alvo: [36, 72, -12], w: 16, h: 110 };
    r.recorteD.i += 1.2 * f; r.recorteE.i += 1.2 * f;
    e.luzes = r;
    e.ambiente = lerp(0.06, 0.22, luzOn);
    e.fundo = { brilho: lerp(0.03, 0.07, luzOn), flash: 0.15 * f, centro: [0.5, 0.6], raio: 0.5 };
    e.bloom = 0.08 + 0.22 * Math.min(f, 1);
    e.clarao = clarao(t, CORTES.s3a, 0.22);
  } else if (t < CORTES.s3b) {
    // ---- 3a: logo frontal, travelling lateral + faixa de luz varrendo ----
    e.cena = 3;
    const k = sen(seg(t, CORTES.s3a, CORTES.s3b));
    const alvo = [lerp(-5, 3, k), 26, 37];
    e.cam = { az: lerp(-11, 7, k), el: 17, dist: lerp(305, 290, k), alvo, fov: 20 };
    const r = rigHero(0.45);
    const vx = lerp(-150, 150, sen(seg(t, CORTES.s3a + 0.2, CORTES.s3b - 0.1)));
    r.varredura = { i: 12, pos: [vx, 60, 150], alvo: [vx * 0.25, 20, 38], w: 12, h: 160 };
    e.luzes = r;
    e.ambiente = 0.16;
    e.fundo = { brilho: 0.05, flash: 0, centro: [0.5, 0.75], raio: 0.55 };
    e.dof = { ponto: [0, 21, 37], abertura: 0.00016, max: 0.012 };
    e.clarao = clarao(t, CORTES.s3a, 0.22);
  } else if (t < CORTES.s3c) {
    // ---- 3b: macro no "O" com raio → foco passa para "A TEMPESTADE" ----
    e.cena = 3;
    const k = sen(seg(t, CORTES.s3b, CORTES.s3c));
    const alvo = lerpV([15, 17, 38], [5, 11.5, 40], k);
    e.cam = { az: lerp(30, 18, k), el: lerp(13, 17, k), dist: lerp(172, 158, k), alvo, fov: 17 };
    const r = rigHero(0.4);
    const vx = lerp(-60, 140, k);
    r.varredura = { i: 10, pos: [vx, 70, 140], alvo: [10, 14, 39], w: 12, h: 140 };
    e.luzes = r;
    e.ambiente = 0.16;
    e.fundo = { brilho: 0.04, flash: 0, centro: [0.5, 0.75], raio: 0.55 };
    const rack = sen(seg(t, CORTES.s3b + 0.85, CORTES.s3b + 1.65));
    e.dof = { ponto: lerpV([17, 18, 38], [-2, 8.8, 40.8], rack), abertura: 0.00045, max: 0.014 };
  } else if (t < CORTES.s4) {
    // ---- 3c: macro ao longo do raio direito, luz rasante revelando o relevo de 2 mm ----
    e.cena = 3;
    const k = sen(seg(t, CORTES.s3c, CORTES.s4));
    const alvo = lerpV([37, 26, 18], [37, 84, -22], k);
    e.cam = { az: lerp(52, 60, k), el: lerp(8, 14, k), dist: 200, alvo, fov: 19 };
    const r = rigHero(0.35);
    r.sombra = { i: 2.4, pos: [70, 30, 230], alvo: [36, 70, -20] };
    r.varredura = { i: 6, pos: [95, 20, 150], alvo: [36, 60, -10], w: 16, h: 120 };
    r.recorteD.i = 3;
    e.luzes = r;
    e.ambiente = 0.14;
    e.fundo = { brilho: 0.04, flash: 0, centro: [0.5, 0.6], raio: 0.5 };
    e.dof = { ponto: alvo, abertura: 0.00028, max: 0.012 };
    e.clarao = clarao(t, CORTES.s4, 0.2);
  } else if (t < CORTES.s5) {
    // ---- 4: a parte de trás — contraluz atravessando o recorte em seta ----
    e.cena = 4;
    const k = sen(seg(t, CORTES.s4, CORTES.s5));
    e.cam = { az: lerp(206, 166, k), el: lerp(18, 14, k), dist: lerp(560, 540, k), alvo: [0, 56, 0], fov: 24 };
    const r = rigHero(0.55);
    r.chave = { i: 4, pos: [-200, 260, -260], alvo: [0, 50, 0], w: 240, h: 160 };
    r.sombra = { i: 1.2, pos: [-230, 330, -280], alvo: [0, 40, 0] };
    r.contra = { i: 4, pos: [0, 240, 260], alvo: [0, 60, 0], w: 260, h: 200 };
    r.recorteD = { i: 2.6, pos: [220, 150, 120], alvo: [0, 60, 0], w: 30, h: 260 };
    r.recorteE = { i: 2.6, pos: [-220, 150, 120], alvo: [0, 60, 0], w: 30, h: 260 };
    e.luzes = r;
    e.ambiente = 0.16;
    e.fundo = { brilho: 0.09, flash: 0, centro: [0.5, 0.62], raio: 0.38 };
    e.clarao = clarao(t, CORTES.s4, 0.2) + clarao(t, CORTES.s5, 0.2);
  } else {
    // ---- 5: hero final + assinatura ----
    e.cena = 5;
    const k = saida(seg(t, CORTES.s5, DURACAO));
    e.cam = { az: lerp(27, 22, k), el: lerp(10, 9, k), dist: lerp(720, 685, k), alvo: [0, -6, 0], fov: 24 };
    const f = relampago(t, [[CORTES.s5, 0.9, 0.09], [CORTES.s5 + 0.11, 0.5, 0.12]]);
    const r = rigHero(1);
    r.contra = { i: 14 * f, pos: orbita([0, 70, 0], e.cam.az + 180, 38, 320), alvo: [0, 60, 0], w: 320, h: 220 };
    e.luzes = r;
    e.fundo = { brilho: 0.075, flash: 0.13 * f, centro: [0.5, 0.66], raio: 0.48 };
    e.bloom = 0.08 + 0.2 * Math.min(f, 1);
    e.clarao = clarao(t, CORTES.s5, 0.2);
    e.texto = seg(t, CORTES.s5 + 0.5, CORTES.s5 + 1.4);
    e.marca = seg(t, CORTES.s5 + 1.4, CORTES.s5 + 2.1);   // logo NYVOS entra depois do texto
    e.fade = 1 - suave(seg(t, DURACAO - 0.45, DURACAO));
  }
  return e;
}
