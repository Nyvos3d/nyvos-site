// Renderiza os ícones 3D dos destaques (icones3d-cena.js) em PNG sem fundo, em fonte/icones/,
// e anota em medidas.json a caixa de cada objeto na imagem (usada pela capa para centrar e igualar).
// Sobe um servidor local na raiz do site (para o three.js de node_modules) e captura cada ícone.
// Uso: npm install (na raiz) e depois node icones3d.js [id ...]
const { chromium } = require("/opt/node-tools/node_modules/playwright");
const http = require("http"), fs = require("fs"), path = require("path");
const { SIMBOLO } = require("./art.js");

const RAIZ = path.resolve(__dirname, "../../../..");
const SAIDA = path.join(__dirname, "icones");
const TIPOS = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json" };

const srv = http.createServer((req, res) => {
  const f = path.join(RAIZ, decodeURIComponent(req.url.split(/[?#]/)[0]));
  if (!f.startsWith(RAIZ) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": TIPOS[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});

srv.listen(0, async () => {
  fs.mkdirSync(SAIDA, { recursive: true });
  const b = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const page = await b.newPage({ viewport: { width: 1600, height: 1600 } });
  page.on("pageerror", (e) => console.log("erro:", e.message));
  page.on("console", (m) => m.type() === "error" && console.log("console:", m.text()));
  await page.goto(`http://localhost:${srv.address().port}/assets/social/instagram/fonte/icones3d.html`);
  await page.waitForFunction(() => window.__icones, null, { timeout: 60000 });
  const ids = process.argv.slice(2).length ? process.argv.slice(2) : await page.evaluate(() => window.__icones);
  const fMedidas = path.join(SAIDA, "medidas.json");
  const medidas = fs.existsSync(fMedidas) ? JSON.parse(fs.readFileSync(fMedidas, "utf8")) : {};
  for (const id of ids) {
    const r = await page.evaluate(([id, simbolo]) => window.__icone(id, { simbolo }), [id, SIMBOLO]);
    fs.writeFileSync(path.join(SAIDA, `${id}.png`), Buffer.from(r.url.split(",")[1], "base64"));
    medidas[id] = { caixa: r.caixa, lado: r.lado };
    console.log("ícone", id, r.caixa.join(" "));
  }
  fs.writeFileSync(fMedidas, JSON.stringify(medidas, null, 2) + "\n");
  await b.close();
  srv.close();
});
