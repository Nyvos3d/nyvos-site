# NYVOS — Site

Site institucional da **NYVOS · Design & Fabricação Digital** (impressão 3D).
Página única, autossuficiente, com foco em contato.

## Estrutura
- `index.html` — o site (HTML/CSS/JS inline, sem dependências além das Google Fonts)
- `favicon.ico` — favicon multi-resolução
- `assets/` — identidade visual da marca
  - `*.svg` — logo, símbolo e wordmark (vetor, escala infinita)
  - `png/` — versões rasterizadas (256–4096 px)
  - `social/` — artes para redes (post, header, faixa)
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
