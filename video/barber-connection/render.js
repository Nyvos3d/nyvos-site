// Renderiza a cena quadro a quadro no Chromium headless (Playwright) e salva PNGs.
//   node render.js quadros <pasta> [inicio] [fim] [fps]   → sequência para o ffmpeg
//   node render.js still <arquivo.png> <t>                 → um quadro do roteiro
//   node render.js livre <pasta> nome:az,el,dist[,alvoY,fov,amb,luz] … → câmera livre (estudo da peça)
// Requer: cena/cena.bundle.js (./build.sh) e cena/modelo/ com os .bin do 3MF. ESCALA=1.5 ativa o supersampling.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const RAIZ = path.join(__dirname, 'cena');
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.bin': 'application/octet-stream', '.svg': 'image/svg+xml', '.png': 'image/png' };

function servidor() {
  return new Promise((ok) => {
    const s = http.createServer((req, res) => {
      const p = path.join(RAIZ, decodeURIComponent(new URL(req.url, 'http://x').pathname));
      if (!p.startsWith(RAIZ) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': TIPOS[path.extname(p)] || 'application/octet-stream' });
      fs.createReadStream(p).pipe(res);
    }).listen(0, '127.0.0.1', () => ok(s));
  });
}

(async () => {
  const [modo, saida, a, b, c] = process.argv.slice(2);
  const ESCALA = +(process.env.ESCALA || 1);   // supersampling: 1.5 → PNG 1620×2880, reduzido no ffmpeg
  const srv = await servidor();
  const url = `http://127.0.0.1:${srv.address().port}/index.html?s=${ESCALA}`;
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: ESCALA });
  page.setDefaultTimeout(180000);
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[página]', m.text()); });
  page.on('pageerror', (e) => console.log('[erro]', e.message));
  await page.goto(url);
  await page.waitForFunction(() => window.CENA && (window.CENA.pronto || window.CENA.erro), null, { timeout: 120000 });
  const erro = await page.evaluate(() => window.CENA.erro);
  if (erro) throw new Error(erro);
  await page.evaluate(() => document.fonts.ready);

  const foto = (arq) => page.screenshot({ path: arq, clip: { x: 0, y: 0, width: 1080, height: 1920 } });
  if (modo === 'livre') {
    // várias vistas numa sessão: nome:az,el,dist,... nome2:...
    for (const v of process.argv.slice(4)) {
      const [nome, spec] = v.split(':');
      await page.evaluate((x) => window.CENA.livre(...x), spec.split(',').map(Number));
      await foto(path.join(saida, nome + '.png'));
    }
  } else if (modo === 'still') {
    await page.evaluate((t) => window.CENA.quadro(t), +a);
    await foto(saida);
  } else if (modo === 'quadros') {
    const fps = +(c || 30), dur = await page.evaluate(() => window.CENA.duracao);
    const ini = +(a || 0), fim = Math.min(+(b || Math.round(dur * fps)), Math.round(dur * fps));
    fs.mkdirSync(saida, { recursive: true });
    const t0 = Date.now();
    for (let i = ini; i < fim; i++) {
      await page.evaluate((t) => window.CENA.quadro(t), i / fps);
      await foto(path.join(saida, `q${String(i).padStart(5, '0')}.png`));
      if ((i - ini) % 30 === 0) console.log(`quadro ${i}/${fim}  ${((Date.now() - t0) / (i - ini + 1) / 1000).toFixed(2)} s/quadro`);
    }
  }
  await browser.close(); srv.close();
})().catch((e) => { console.error(e); process.exit(1); });
