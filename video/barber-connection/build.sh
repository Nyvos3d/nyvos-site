#!/bin/sh
# Empacota a cena (three.js + roteiro) num único módulo para o Chromium headless.
cd "$(dirname "$0")/../.." && npx esbuild video/barber-connection/cena/cena.js --bundle --format=esm --target=es2020 \
  --outfile=video/barber-connection/cena/cena.bundle.js --log-level=warning
