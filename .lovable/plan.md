

# Remover Partes Escuras e Tornar o Design Clean e Minimalista

## Resumo

Eliminar todos os blocos escuros (`bg-brown-deep`, `bg-brown-dark`, gradientes pesados) do design, substituindo por fundos claros e neutros. Simplificar botões, reduzir ruído visual, e criar uma estética arejada e minimalista mantendo o dourado como acento sutil.

## Mudanças por arquivo

### 1. Announcement Bar — `Header.tsx` (linha 86)
- **Antes:** `bg-brown-deep text-cream-200` (barra preta no topo)
- **Depois:** `bg-cream-200 text-brown` — barra clara e discreta

### 2. Hero Section — `HeroSection.tsx`
- **Antes:** Overlays escuros pesados (`from-brown-deep/92 via-brown-deep/85`)
- **Depois:** Reduzir drasticamente a opacidade dos overlays para `from-brown-deep/60 via-brown-deep/40 to-transparent` — deixar a imagem mais visível e leve. Remover o segundo gradient layer. Texto continua claro sobre a imagem.

### 3. Sensory Notes Banner — `SensoryNotesBanner.tsx`
- **Antes:** `bg-brown-deep` (faixa escura com texto gold)
- **Depois:** `bg-cream-200 border-y border-cream-400` — fundo claro, texto em `text-brown`

### 4. Footer — `Footer.tsx`
- **Antes:** `bg-brown-deep` com texto `text-cream-600`
- **Depois:** `bg-cream-200 border-t border-cream-400` — footer claro. Texto em `text-brown`. Títulos em `text-muted-foreground`. Social icons com `border-cream-500`. Brand emblem com `text-brown-dark`. Payment badges com `bg-cream-300`.

### 5. Newsletter Footer — `NewsletterFooter.tsx`
- **Antes:** Input `bg-cream-50/10` e texto `text-cream-200` (sobre fundo escuro)
- **Depois:** Input `bg-white border-cream-400` e texto `text-brown-dark` (sobre fundo claro)

### 6. Dynamic Banners — `DynamicBanners.tsx` (linha 61)
- **Antes:** `from-brown-deep/70` gradient overlay nos cards
- **Depois:** `from-brown-deep/50` — mais leve, ou substituir por `from-black/40`

### 7. Subscription Banner — `SubscriptionBanner.tsx` (linha 57)
- **Antes:** `from-brown-deep/40` gradient na imagem
- **Depois:** `from-black/20` — mais sutil

### 8. Stats Section — `StatsSection.tsx`
- Já está em `bg-cream-200` — OK, sem mudanças

### 9. Story Section — `StorySection.tsx`
- Já está em `bg-cream-200` — OK, sem mudanças

### 10. CSS Variables — `index.css`
- Sidebar variables (usadas no admin): manter `brown-deep` apenas lá
- Remover `bg-gradient-espresso` utility (não será mais usada)

### 11. Simplificações minimalistas adicionais

**Botões** — `button.tsx`:
- Remover `active:scale-[0.97]` (micro-interação desnecessária para visual clean)
- Manter rounded-full mas reduzir shadow no hover para algo mais sutil

**Cards** — menos ornamentação:
- Remover `glow-gold` class usage no `SubscriptionBanner.tsx`
- Cards do `TestimonialsSection.tsx`: remover `hover:shadow-lg` — manter apenas `hover:border-gold/20` sutil

**Brew Methods** — `BrewMethods.tsx`:
- Simplificar hover nos cards: remover `hover:shadow-lg hover:shadow-gold/5`, manter apenas border change

**CoffeeCarousel** — `CoffeeCarousel.tsx`:
- Skeleton cards: manter clean sem ornamentação extra

**Cafes Page hero** — `CafesPage.tsx` (linha 112-126):
- Já está em `bg-cream-200` — OK

**Gold decorative lines** — remover as `h-px bg-gradient-to-r from-transparent via-gold/...` lines no Header e Footer (excesso decorativo para um visual minimalista)

## Arquivos impactados (~10 arquivos)

| Arquivo | Tipo de mudança |
|---------|----------------|
| `Header.tsx` | Announcement bar: escuro → claro |
| `HeroSection.tsx` | Overlays: pesados → leves |
| `SensoryNotesBanner.tsx` | Fundo: escuro → claro |
| `Footer.tsx` | Fundo: escuro → claro |
| `NewsletterFooter.tsx` | Cores adaptadas para fundo claro |
| `DynamicBanners.tsx` | Gradient overlay mais leve |
| `SubscriptionBanner.tsx` | Gradient overlay mais leve, remover glow |
| `TestimonialsSection.tsx` | Reduzir hover effects |
| `BrewMethods.tsx` | Simplificar hover |
| `button.tsx` | Remover active:scale |

## Regras
- Fontes, layout e conteúdo inalterados
- Dourado permanece como cor de acento, mas usado com mais parcimônia
- Nenhum fundo `brown-deep` visível ao usuário (exceto admin sidebar)
- Resultado: visual arejado, claro, minimalista

