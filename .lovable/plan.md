

## Plano: Substituir todas as logos do site pela nova imagem PNG com fundo transparente

### O que será feito

Copiar `user-uploads://LOGOTIPO.png` para `public/images/logo-laregence.png` e atualizar todas as referências no projeto.

### Alterações

1. **Copiar arquivo** — `user-uploads://LOGOTIPO.png` → `public/images/logo-laregence.png`

2. **Header** (`src/components/layout/Header.tsx`)
   - Trocar `src="/images/logo-laregence-clean.jpg"` → `"/images/logo-laregence.png"`

3. **Footer** (`src/components/layout/Footer.tsx`)
   - Trocar `src="/images/logo-laregence-full.jpg"` → `"/images/logo-laregence.png"`

4. **Favicon** (`index.html`)
   - Trocar `href="/images/logo-laregence-mono.jpg"` → `"/images/logo-laregence.png"` com `type="image/png"`

5. **PWA Manifest** (`public/manifest.json`)
   - Atualizar ambos os ícones para `"/images/logo-laregence.png"` com `type: "image/png"`

