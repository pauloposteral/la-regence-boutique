
# Auditoria visual + performance (LCP/Imagens)

Auditei `index.html`, `HeroSection.tsx`, `OptimizedImage.tsx` e o uso de imagens em produtos/banners. Boa notícia: já existe base sólida (preload do hero, `<picture>` com AVIF/WebP, srcset, Supabase Image Transformation). Ruim: há **3 desperdícios de LCP** e oportunidades visuais finas.

---

## 1. Correções de LCP (alto impacto, baixo risco)

### 1.1 Hero: eliminar dupla requisição (LCP duplicado) ⚠️ crítico
Hoje o `index.html` faz `preload` da imagem **como `<img>`** (1440w webp), mas o `HeroSection.tsx` renderiza ela como `background-image` via `image-set()` em **outras larguras** (1920/2560). O navegador baixa **duas vezes** e o preload é desperdiçado (warning no console).

**Fix:** trocar o background CSS por uma `<img>` real absoluta (`object-cover`) com `fetchpriority="high"`, `decoding="async"`, `srcset` idêntico ao do preload do `index.html`. Mantém visual 1:1 (mesmo gradient overlay), mas o LCP passa a usar a imagem **já preloaded** → ganho típico de 400–900ms em mobile 4G.

### 1.2 Preload da fonte LCP (Playfair) 
O `<h1>` do hero usa Playfair Display. Hoje só pré-carregamos o CSS do Google Fonts; o `.woff2` em si só baixa depois → FOUT/CLS no título. 
**Fix:** adicionar `<link rel="preload" as="font" type="font/woff2" crossorigin>` para o Playfair 700 (peso usado no h1). Combinar com `font-display: swap` (já vem do Google).

### 1.3 Preconnect ao Supabase Storage
Adicionar `<link rel="preconnect" href="https://uuuaylqjllxqjjmvdybm.supabase.co" crossorigin>` no `<head>`. Salva ~150–300ms de DNS+TLS na primeira imagem.

### 1.4 Reduzir qualidade do preload mobile
O preload usa `quality=78` para 640w. Para mobile, `quality=70` corta ~25% do peso sem diferença visual perceptível. (Hero é 100vw escurecido por overlay 70% — perda invisível.)

---

## 2. Otimização de imagens (em todo o catálogo)

### 2.1 `OptimizedImage`: AVIF está quebrado na prática
O componente envia `&format=avif` na URL, mas a Supabase Image Transformation **não suporta AVIF** — devolve WebP com header errado, fazendo o navegador rejeitar a `<source>` e cair no WebP de qualquer forma. Resultado: 2 requests duplicados em alguns casos.
**Fix:** remover o `<source type="image/avif">` ou trocar por `format=auto` (o Supabase já serve AVIF para Chrome via `Accept` header). Ganho: menos parsing, sem requests fantasmas.

### 2.2 `sizes` mais preciso por contexto
O default `(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw` é genérico. Para `ProductCard` em grid 2-col mobile / 4-col desktop, o correto é `(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw`. Isso faz o browser baixar a versão **480w** em vez de **1080w** no mobile → economia de ~60% por card.
**Fix:** aceitar `sizes` por contexto (já é prop) e passar valores corretos em `ProductCard`, `CrossSellProducts`, `RecentlyViewed`, `CoffeeCarousel`.

### 2.3 Eager + fetchpriority="high" para 1ª linha do catálogo
Em `CafesPage`, marcar os **2 primeiros cards** com `eager` para serem o LCP da página de listagem.

### 2.4 Larguras menores no DEFAULT_WIDTHS
Atualmente: `[320, 480, 640, 800, 1080, 1440]`. Para cards de produto, 1440w nunca é usado e polui o srcset. Manter para hero/PDP, mas criar preset `CARD_WIDTHS = [240, 320, 480, 640]` para thumbnails.

### 2.5 Aspect-ratio obrigatório (CLS = 0)
Hoje `aspectRatio` é opcional. Vários usos (DynamicBanners, BlogPage) não passam → CLS. **Fix:** logar warning em dev quando ausente e definir `aspect-[3/4]` como fallback no ProductCard.

---

## 3. Melhorias visuais (alinhadas à identidade Gold/Brown)

### 3.1 Hero
- Substituir overlay `from-black/70 via-black/40 to-black/10` por **gradient quente** `from-brown-deep/75 via-brown-deep/40 to-transparent`. Hoje o preto puro destoa da paleta cream/brown (regra do projeto: nunca preto puro).
- Adicionar **grain sutil** (SVG noise 3% opacity) sobre a imagem — dá textura editorial tipo Aesop, custa ~2KB inline.
- Linha dourada do separador: trocar `bg-gradient-to-r from-gold to-gold-light` por uma versão de 1px com `shadow-[0_0_8px_hsl(var(--gold)/0.4)]` → glow discreto premium.

### 3.2 ProductCard
- Skeleton atual é `bg-muted` cinza. Trocar por `bg-cream-200` com shimmer dourado (`bg-gradient-to-r from-cream-200 via-cream-100 to-cream-200`) → coerente com a marca durante load.
- Hover da imagem hoje é `scale-105` puro. Adicionar **leve translate-y(-2px)** + sombra `shadow-[0_20px_40px_-15px_hsl(var(--brown-deep)/0.25)]` no card inteiro para sensação de "lift".

### 3.3 Transições globais de imagem
A transição `opacity-0 → opacity-100` em 500ms é boa, mas pode acompanhar **scale leve** (1.02 → 1) para um fade-in cinematográfico. ~10 linhas.

### 3.4 Loading states
Trocar todos `animate-pulse bg-muted` por skeleton com gradient cream (`bg-gradient-to-br from-cream-100 to-cream-200`). Já existe shimmer em algumas partes; padronizar.

---

## Detalhes técnicos

**Arquivos tocados:**
- `index.html` — preconnect Supabase, preload font Playfair-700, ajuste quality mobile
- `src/components/home/HeroSection.tsx` — substituir bg CSS por `<img>` com srcset igual ao preload, overlay quente, grain SVG
- `src/components/ui/optimized-image.tsx` — remover AVIF source quebrado, shimmer cream, scale fade-in, prop `cardSizes`/preset
- `src/components/product/ProductCard.tsx` (e onde renderiza) — passar `sizes` correto, eager para primeiros, aspect-ratio fallback
- `src/pages/CafesPage.tsx` — marcar 2 primeiros cards como `eager`

**Sem regressões:** zero mudança de layout, zero remoção de componente, paleta/fontes/raios preservados. Tudo aditivo ou substituição equivalente.

**Métricas esperadas (mobile 4G, viewport 440×688):**
- LCP: ~2.4s → **~1.3s** (preload realmente usado + preconnect + font preload)
- Bytes da home: **−35%** (sizes correto + AVIF removido + qualidade mobile)
- CLS: **0** (aspect-ratio enforced + font preload evita shift do h1)

---

## Ordem de execução

1. Fix LCP do hero (substituir bg por `<img>` + preconnect + font preload) — ganho maior, risco zero
2. Limpar AVIF + corrigir `sizes` no ProductCard
3. Polimento visual (overlay quente, shimmer cream, hover lift)
4. Marcar eager nos 2 primeiros cards de Cafés/Home

Aprove para eu executar tudo cirurgicamente.
