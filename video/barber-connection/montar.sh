#!/bin/sh
# Monta o MP4 final a partir dos quadros PNG (supersampling 1620×2880) e do som (audio.py).
#   ./montar.sh <pasta-quadros> <som.wav> <saida-base>
# Gera: <saida-base>.mp4 (com som, -16 LUFS), <saida-base>_sem-audio.mp4 e <saida-base>_capa.jpg
set -e
Q=$1; SOM=$2; OUT=$3
VF="scale=1080:1920:flags=lanczos,format=yuv420p"
X264="-c:v libx264 -preset slow -crf 15 -profile:v high -level 4.2 -pix_fmt yuv420p -movflags +faststart"

# loudnorm em duas passadas: mede e depois aplica ganho linear (sem compressão extra)
M=$(ffmpeg -hide_banner -nostats -i "$SOM" -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
ARG=$(printf '%s' "$M" | python3 -c "import json,sys; m=json.load(sys.stdin); print(f\"measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}\")")

ffmpeg -hide_banner -loglevel error -y -framerate 30 -i "$Q/q%05d.png" -i "$SOM" \
  -vf "$VF" $X264 -af "loudnorm=I=-16:TP=-1.5:LRA=11:linear=true:$ARG,aresample=48000" \
  -c:a aac -b:a 192k -shortest "$OUT.mp4"
ffmpeg -hide_banner -loglevel error -y -framerate 30 -i "$Q/q%05d.png" -vf "$VF" $X264 -an "$OUT"_sem-audio.mp4
# capa: quadro do hero final com a assinatura completa e o logo (t = 19,2 s)
ffmpeg -hide_banner -loglevel error -y -i "$Q/q00576.png" -vf "scale=1080:1920:flags=lanczos" -q:v 2 "$OUT"_capa.jpg
ls -l "$OUT".mp4 "$OUT"_sem-audio.mp4 "$OUT"_capa.jpg
