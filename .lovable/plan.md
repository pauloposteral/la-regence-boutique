

## Plano: Adicionar logomarca oficial da La Régence no Header, Favicon e demais locais

### Contexto

O PDF contém o manual de marca com diversas versões do logotipo. As melhores para uso no site:
- **Page 1** (fundo branco, logo completa com ornamentos dourados) -- para Header e Footer
- **Page 9** (versão limpa "La Regence - Cafés Especiais", fundo branco) -- alternativa clean para o header
- **Page 5** (versão monocromática outline) -- boa para favicon/ícone

Como o PDF contém vetores, mas só temos os screenshots em JPG, vamos extrair as imagens das páginas relevantes e salvar no projeto.

### Arquivos de imagem a copiar

1. **Logo principal (fundo branco)** -- page 1 screenshot -> `public/images/logo-laregence-full.jpg` (para Header)
2. **Logo limpa "Cafés Especiais"** -- page 9 screenshot -> `public/images/logo-laregence-clean.jpg` (alternativa)
3. **Logo fundo escuro** -- page 2 screenshot -> `public/images/logo-laregence-dark.jpg` (para Footer se necessário)
4. **Logo monocolor** -- page 5 screenshot -> `public/images/logo-laregence-mono.jpg` (para favicon/PWA icons)

### Alterações no código

1. **Header (`src/components/layout/Header.tsx`)**
   - Substituir o texto tipográfico "La Régence" no centro por uma tag `<img>` com a logo oficial (versão page 1 ou page 9, fundo branco)
   - Manter como link para `/`
   - Dimensionar para ~40-48px de altura no desktop, ~32-36px no mobile

2. **Footer (`src/components/layout/Footer.tsx`)**
   - Adicionar a logo oficial acima ou próximo ao bloco de copyright (onde antes havia o "Brand emblem" vazio)

3. **Favicon (`index.html` + `public/favicon.svg`)**
   - Substituir o favicon SVG minimalista "LR" pela imagem da logo (versão mono/ícone)
   - Atualizar `index.html` para referenciar a nova imagem

4. **PWA Manifest (`public/manifest.json`)**
   - Atualizar os ícones para usar a nova logo

5. **Emails / Meta tags**
   - Atualizar og:image se desejado para usar a logo oficial

### Detalhes técnicos

- As imagens serão copiadas de `parsed-documents://` para `public/images/`
- O header usará `<img>` com `object-contain` e altura fixa para não quebrar o layout grid de 3 colunas
- Manter a transição suave de hover existente no link da logo

