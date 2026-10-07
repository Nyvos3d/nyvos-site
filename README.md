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
  - `favicon/` — ícones 16–512 px + `.ico`

## Editar contatos
No topo do `<script>` em `index.html`, edite o objeto `CONFIG`:

```js
const CONFIG = {
  whatsapp: "5534920024416",   // só números, DDI+DDD
  instagram: "nyvos",
  email: "contato@nyvos.com.br",
  cidade: "Uberlândia · MG",
  mapa: "https://maps.google.com/?q=..."
};
```

WhatsApp, Instagram e e-mail se propagam automaticamente para todos os botões, o FAB e o rodapé.
