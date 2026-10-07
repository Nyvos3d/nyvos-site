// Quadros da impressora 3D do site (src/impressora3d.js, modo #poster) para os posts.
// Sobe um servidor local com o site, captura a cena em instantes da impressão e salva
// recortado e sem fundo em fonte/impressora/. Uso: node quadros.js
const { chromium } = require("/opt/node-tools/node_modules/playwright");
const http = require("http"), fs = require("fs"), path = require("path");

const RAIZ = path.resolve(__dirname, "../../../..");
const SAIDA = path.join(__dirname, "impressora");
// instante do ciclo (0–1) → nome; o display da impressora mostra o progresso
const QUADROS = { "03": 0.02, "33": 0.22, "67": 0.44, "100": 0.75 };
const TIPOS = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp", ".png": "image/png", ".ico": "image/x-icon" };

const srv = http.createServer((req, res) => {
  const f = path.join(RAIZ, decodeURIComponent(req.url.split(/[?#]/)[0]).replace(/\/$/, "/index.html"));
  if (!f.startsWith(RAIZ) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": TIPOS[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});

srv.listen(0, async () => {
  fs.mkdirSync(SAIDA, { recursive: true });
  const b = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  // movimento reduzido: câmera parada no ângulo do site, igual em todos os quadros
  const page = await b.newPage({ viewport: { width: 1500, height: 1500 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
  await page.goto(`http://localhost:${srv.address().port}/index.html#poster`);
  await page.addStyleTag({ content: `.stage{position:fixed!important;inset:0 auto auto 0!important;width:1400px!important;height:1400px!important;
    max-width:none!important;margin:0!important;z-index:99999}.stage::before,.glow,.stage-poster{display:none!important}` });
  await page.waitForFunction(() => window.__nyvosPoster, null, { timeout: 60000 });
  await page.waitForTimeout(1500);
  for (const [nome, p] of Object.entries(QUADROS)) {
    const url = await page.evaluate(async (p) => {
      const img = new Image();
      img.src = window.__nyvosPoster(p);
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.width; c.height = img.height;
      const g = c.getContext("2d");
      g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data;
      let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
      for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 4) {
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
      const r = document.createElement("canvas");
      r.width = x1 - x0 + 1; r.height = y1 - y0 + 1;
      r.getContext("2d").drawImage(c, -x0, -y0);
      return r.toDataURL("image/webp", 0.92);
    }, p);
    fs.writeFileSync(path.join(SAIDA, `impressora-${nome}.webp`), Buffer.from(url.split(",")[1], "base64"));
    console.log("quadro", nome);
  }
  await b.close();
  srv.close();
});
