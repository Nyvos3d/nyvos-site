"""Desenho de som de "O Clarão" (19 s, 48 kHz, estéreo), sincronizado com cena/roteiro.js.

Só síntese (numpy, semente fixa): ambiência grave, pad em lá menor, trovões nos clarões,
impactos nos cortes com clarão e um brilho de ar acompanhando a luz que varre o logo.
Não é trilha musical — é sound design discreto; a música pode ser trocada na edição.

    python3 audio.py saida.wav
"""
import sys
import wave
import numpy as np

SR = 48000
DUR = 19.0
N = int(SR * DUR)
rng = np.random.default_rng(7)
T = np.arange(N) / SR

# instantes do roteiro (s)
FLASH_1, FLASH_2, CORTE_3A, CORTE_4, CORTE_5 = 0.55, 1.52, 7.4, 14.4, 16.5


def filtro(x, lo=None, hi=None, ordem=2):
    """Passa-faixa estático no domínio da frequência (resposta tipo Butterworth)."""
    n = len(x)
    X = np.fft.rfft(x, axis=0)
    f = np.fft.rfftfreq(n, 1 / SR)[:, None] if x.ndim == 2 else np.fft.rfftfreq(n, 1 / SR)
    g = np.ones_like(f)
    if lo:
        g = g / np.sqrt(1 + (lo / np.maximum(f, 1e-3)) ** (2 * ordem))
    if hi:
        g = g / np.sqrt(1 + (f / hi) ** (2 * ordem))
    return np.fft.irfft(X * g, n, axis=0)


def passa_baixa_variavel(x, corte, bloco=4096):
    """Passa-baixa com corte variando no tempo (overlap-add com janela de Hann). corte(t) → Hz."""
    out = np.zeros_like(x)
    win = np.hanning(bloco)
    f = np.fft.rfftfreq(bloco, 1 / SR)
    for i in range(0, len(x) - bloco, bloco // 2):
        seg = x[i:i + bloco] * win[:, None]
        fc = corte((i + bloco / 2) / SR)
        g = 1 / np.sqrt(1 + (f / fc) ** 4)
        out[i:i + bloco] += np.fft.irfft(np.fft.rfft(seg, axis=0) * g[:, None], bloco, axis=0)
    return out


def ruido_marrom(n, canais=2):
    b = np.cumsum(rng.standard_normal((n, canais)), axis=0)
    b = filtro(b, lo=18)                        # tira a deriva DC
    return b / (np.abs(b).max() + 1e-9)


def env(n, ataque, decai):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(ataque, 1e-4)) * np.exp(-t / decai)


def coloca(buf, sinal, t0, ganho=1.0):
    i = int(t0 * SR)
    j = min(N, i + len(sinal))
    if j > i:
        buf[i:j] += ganho * sinal[: j - i]


def suave(k):
    k = np.clip(k, 0, 1)
    return k * k * (3 - 2 * k)


def trovao(tamanho, duracao):
    """Estalo + corpo + ronco rolando. Estéreo descorrelacionado."""
    n = int(SR * (duracao + 0.5))
    s = np.zeros((n, 2))
    # estalo principal e estalidos secundários
    estalo = filtro(rng.standard_normal((int(SR * 0.3), 2)), lo=900, hi=7000) * env(int(SR * 0.3), 0.001, 0.022)[:, None]
    s[: len(estalo)] += estalo * 0.9
    for _ in range(int(6 + 6 * tamanho)):
        t0 = rng.uniform(0.01, 0.35)
        m = int(SR * 0.08)
        c = filtro(rng.standard_normal((m, 2)), lo=1500, hi=9000) * env(m, 0.0005, rng.uniform(0.004, 0.012))[:, None]
        i = int(t0 * SR)
        s[i:i + m] += c * rng.uniform(0.15, 0.5)
    # corpo grave do impacto
    corpo = filtro(rng.standard_normal((int(SR * 1.2), 2)), hi=140) * env(int(SR * 1.2), 0.004, 0.35)[:, None]
    s[: len(corpo)] += corpo * 2.2
    # ronco: ruído marrom com ondulações lentas aleatórias
    r = filtro(ruido_marrom(n), hi=170)
    lfo = filtro(rng.standard_normal(n), hi=2.5)
    lfo = 0.55 + 0.45 * lfo / (np.abs(lfo).max() + 1e-9)
    t = np.arange(n) / SR
    envr = suave((t - 0.12) / 0.35) * np.exp(-np.maximum(t - 0.4, 0) / (duracao * 0.38))
    s += r * (envr * lfo)[:, None] * 1.6
    return s * tamanho


def impacto(pre=0.7):
    """Impacto para corte com clarão: subida de ar curta + soco subgrave (pico em t = pre)."""
    n = int(SR * (pre + 1.6))
    t = np.arange(n) / SR
    s = np.zeros((n, 2))
    sobe = filtro(rng.standard_normal((n, 2)), lo=500, hi=6000)
    s += sobe * (suave(t / pre) ** 2 * (t < pre))[:, None] * 0.18
    tp = np.maximum(t - pre, 0)
    freq = 42 + 48 * np.exp(-tp / 0.06)
    fase = 2 * np.pi * np.cumsum(freq) / SR
    soco = np.sin(fase) * (t >= pre) * np.exp(-tp / 0.45) * np.minimum(1, tp / 0.003)
    s += soco[:, None] * 0.9
    return s


def reverb(x, rt=2.4, mix=0.28):
    n = int(SR * rt)
    t = np.arange(n) / SR
    ir = rng.standard_normal((n, 2)) * np.exp(-t * 6.9 / rt)[:, None]
    ir = filtro(ir, lo=80, hi=5000)
    ir /= np.sqrt((ir ** 2).sum(axis=0))
    m = len(x) + n
    tam = 1 << int(np.ceil(np.log2(m)))
    w = np.fft.irfft(np.fft.rfft(x, tam, axis=0) * np.fft.rfft(ir, tam, axis=0), tam, axis=0)[: len(x)]
    return x * (1 - mix) + w * mix * 3.0


def main(saida):
    mix = np.zeros((N, 2))

    # 1) ambiência de sala, sempre presente
    amb = filtro(ruido_marrom(N), lo=30, hi=320)
    amb = amb * 0.3
    mix += amb * (suave(T / 1.2) * (1 - suave((T - 18.4) / 0.6)))[:, None]

    # 2) pad em lá menor (lá2, dó3, mi3 + sub lá1), abre na órbita do plano 2
    pad = np.zeros((N, 2))
    for f0, g in [(110.0, 1.0), (130.81, 0.7), (164.81, 0.8)]:
        for det, (gl, gr) in zip((-0.12, 0.0, 0.13), ((1, 0), (0.7, 0.7), (0, 1))):
            fase = rng.uniform(0, 1)
            serra = 2 * ((T * f0 * (1 + det / 100) + fase) % 1) - 1
            pad[:, 0] += serra * g * gl
            pad[:, 1] += serra * g * gr
    corte = lambda t: 220 + 900 * float(suave((t - 2.7) / 4.0)) - 380 * float(suave((t - 7.4) / 1.5)) + 500 * float(suave((t - 16.5) / 1.0))
    pad = passa_baixa_variavel(pad, corte)
    sub = np.sin(2 * np.pi * 55 * T) * (0.8 + 0.2 * np.sin(2 * np.pi * 0.11 * T))
    pad += sub[:, None] * 1.2
    vol_pad = suave((T - 2.4) / 2.6) * (1 - 0.35 * suave((T - 9.9) / 2.0)) * (1 + 0.4 * suave((T - 16.5) / 0.6))
    vol_pad *= 1 - suave((T - 18.2) / 0.8)
    pad = pad / np.abs(pad).max() * vol_pad[:, None] * 0.24

    # 3) trovões nos clarões
    fx = np.zeros((N, 2))
    coloca(fx, trovao(0.55, 2.2), FLASH_1)
    coloca(fx, trovao(1.0, 4.2), FLASH_2)
    coloca(fx, trovao(0.7, 2.6), CORTE_5)

    # 4) impactos nos cortes com clarão
    for tc, g in [(CORTE_3A, 0.75), (CORTE_4, 0.6), (CORTE_5, 1.0)]:
        coloca(fx, impacto(0.7), tc - 0.7, g)

    # 5) brilho de ar acompanhando a faixa de luz que varre o logo (esquerda → direita)
    a, b = CORTE_3A + 0.2, 9.8
    k = np.clip((T - a) / (b - a), 0, 1)
    sino = np.sin(np.pi * k) ** 2
    ar = filtro(rng.standard_normal((N, 2)), lo=3500, hi=11000)
    pan = 0.5 - 0.5 * np.cos(np.pi * k)
    fx[:, 0] += ar[:, 0] * sino * (1 - pan) * 0.05
    fx[:, 1] += ar[:, 1] * sino * pan * 0.05

    fx = np.tanh(fx / 0.7) * 0.7          # limitador suave: o estalo não domina a mixagem
    mix += pad + fx
    if '--medir' in sys.argv:
        db = lambda x: 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-12)
        for nome, x in [('ambiência', amb), ('pad', pad), ('efeitos', fx)]:
            print(f'{nome:10s} rms {db(x):6.1f} dB  pico {20 * np.log10(np.abs(x).max() + 1e-12):6.1f} dB')
    mix = reverb(mix)
    mix *= (1 - suave((T - 18.55) / 0.45))[:, None]   # acompanha o fade do vídeo
    mix /= np.abs(mix).max() / 0.89
    with wave.open(saida, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((mix * 32767).astype('<i2').tobytes())


if __name__ == '__main__':
    main(sys.argv[1])
