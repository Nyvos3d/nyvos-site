# Vídeo · Suporte Barber Connection — "O Clarão"

Prévia 3D para o cliente aprovar a peça: 1080×1920 (9:16), 30 fps, 19 s, H.264 + AAC.
Direção criativa e storyboard: [`direcao-criativa.md`](direcao-criativa.md).

A geometria vem **direto do 3MF do cliente** (`suporte_barber_connection_2_cores.3mf`, R2), sem remodelagem.
O vídeo é CGI renderizado com three.js. Não é foto nem vídeo gerado por IA.

## Como renderizar

```sh
cd video/barber-connection
python3 -I extrair_3mf.py <arquivo.3mf> cena/modelo     # malhas → buffers (cena/modelo/ não é versionado)
./build.sh                                              # empacota a cena (requer npm install na raiz)
ESCALA=1.5 node render.js quadros <pasta-quadros>       # 570 PNGs 1620×2880 (~8 s/quadro, só CPU)
python3 audio.py som.wav                                # desenho de som sintetizado
./montar.sh <pasta-quadros> som.wav <saida>             # MP4 com som, MP4 sem som e capa JPG
```

Para conferir um instante sem renderizar tudo: `ESCALA=1.5 node render.js still quadro.png 7.0`.

## Arquivos

| Arquivo | O que faz |
|---|---|
| `cena/roteiro.js` | Planos, câmeras, luzes, foco e tempos. Tudo em função de `t`, de forma determinística |
| `cena/cena.js` | Estúdio: materiais PRETO/PRATA com as cores do 3MF, luzes de área, sombra de contato, reflexo no piso, pós-produção (profundidade de campo, bloom, vinheta, grão) |
| `cena/index.html` | Página renderizada, com o texto da assinatura final |
| `render.js` | Chromium headless (Playwright): quadro a quadro → PNG |
| `audio.py` | Trovões nos clarões, pad grave, impactos nos cortes (numpy, semente fixa) |
| `montar.sh` | ffmpeg: redução Lanczos para 1080×1920, H.264 CRF 15, áudio normalizado a −16 LUFS |

## Limites conhecidos

- **Render em tempo real por rasterização**, não *path tracing*.
- **Linhas de camada FDM não simuladas.** A superfície mostra o acabamento do modelo, não o da impressão.
- **Prata e preto aproximados.** Seguem as cores do 3MF (#D4D7DD e #20232B). O prata foi tratado como plástico com brilho
  metálico; o tom real depende do filamento usado.
- **Sem marca do estúdio.** A assinatura final não tem logo enquanto a marca não for definida (NYVOS ou Mundo 3D Lab).
