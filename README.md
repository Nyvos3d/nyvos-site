# NYVOS — Site

Site institucional da **NYVOS · Design & Fabricação Digital** (impressão 3D).
Página única, autossuficiente, com foco em contato.

## Estrutura
- `index.html` — o site (HTML/CSS/JS inline, sem dependências além das Google Fonts)
- `assets/impressora3d.min.js` — cena 3D do hero (WebGL/three.js): impressora imprimindo o N, já empacotada
  - fonte em `src/impressora3d.js`; para regerar: `npm install` e `npm run build:3d`
  - `assets/impressora3d-poster.webp` — quadro estático exibido até o WebGL carregar (e sem WebGL)
- `favicon.ico` — favicon multi-resolução
- `assets/` — identidade visual da marca
  - `*.svg` — logo, símbolo e wordmark (vetor, escala infinita)
  - `png/` — versões rasterizadas (256–4096 px)
  - `social/` — artes para redes (post, header, faixa)
    - `instagram/perfil/` — foto de perfil (4 variações, 1080 e 2048 px + SVG)
    - `instagram/destaques/` — 10 capas de destaques 1080×1920 "Estrato": glifos sólidos na geometria do N, nos três laranjas da marca + mineral, sobre fundo quase preto (+ SVG)
    - `instagram/fonte/` — gerador (`node fonte/render.js <saida>`, requer Playwright)
  - `favicon/` — ícones 16–512 px + `.ico` + `apple-touch-icon.png` (180 px, fundo cheio para o iOS)

## Editar contatos
No topo do `<script>` em `index.html`, edite o objeto `CONFIG`:

```js
const CONFIG = {
  whatsapp: "5534988941661",   // só números, DDI+DDD
  instagram: "nyvos.3d",
  tiktok: "nyvos.3d",
  email: "nyvos3d@gmail.com",
  cidade: "Uberlândia · MG",
  mapa: "https://maps.google.com/?q=Uberlandia+MG"
};
```

O `CONFIG` atualiza os botões de WhatsApp, o menu de redes sociais e o e-mail ao carregar a página.
Os mesmos links também estão escritos direto no HTML (`href` de `zapHero`, `zapFim`, `tbInsta`,
`tbTiktok`, `tbMail`) para funcionarem sem JavaScript e serem lidos por buscadores — ao trocar um
contato, atualize os dois lugares (e o `telephone`/`sameAs` do JSON-LD no `<head>`).
