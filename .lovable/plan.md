
# Correção de Cores: Cards, Textos e Backgrounds — Tema Claro

## Problemas Identificados nos Screenshots

1. **Footer escuro**: `bg-secondary/30` resulta em fundo quase transparente, mas a renderizacao mostra escuro. Precisa de cor explícita clara.
2. **Seções com `bg-secondary/30`** (StorySection, TestimonialsSection, Footer): inconsistentes — trocar por cores claras explícitas.
3. **Newsletter popup**: fundo modal com `bg-brown-deep/50` — muito escuro para tema claro.
4. **Skeleton cards**: `bg-cream-200` / `bg-cream-300` ficam acinzentados. Precisam de tons mais claros.
5. **Textos `text-brown`** no Footer ficam escuros demais em fundo claro, ou invisíveis em fundo que parece escuro — padronizar.

## Plano de Correções

### 1. Padronizar backgrounds de seções alternadas com cores explícitas

| Componente | Atual | Novo |
|------------|-------|------|
| `HeroSection` | OK (image + overlay) | Manter |
| `SensoryNotesBanner` | `bg-white` | Manter |
| `CoffeeCarousel` | `bg-white` | Manter |
| `StorySection` | `bg-secondary/30` | `bg-cream-100` |
| `BrewMethods` | `bg-white` | Manter |
| `SubscriptionBanner` | `bg-secondary/30` | `bg-cream-100` |
| `StatsSection` | `bg-white` | Manter |
| `TestimonialsSection` | `bg-secondary/30` | `bg-cream-100` |
| `Footer` | `bg-secondary/30` | `bg-cream-100 border-t border-cream-300` |

### 2. Footer — textos e elementos para tema claro explícito
- Links: `text-foreground/70` com hover `text-gold`
- Headings: `text-foreground`
- Contact info: `text-muted-foreground`
- Social icons: `border-cream-300 text-foreground/60`
- Brand emblem: `border-cream-300 text-foreground`
- Bottom bar separators: `bg-cream-300`
- Badges Stripe/Pix: `bg-cream-200 border-cream-300 text-foreground/70`

### 3. Newsletter popup — overlay mais claro
- Overlay: `bg-black/30 backdrop-blur-sm` (era `bg-brown-deep/50`)
- Card: Manter `bg-card` (branco)

### 4. Cards de produto (CoffeeCarousel) — mais clean
- Card border: `border-cream-300` (era `border-cream-400`)
- Image area: `bg-cream-100` (era `bg-cream-200/30`)
- SCA badge: `bg-white/90` com `text-foreground`
- Skeletons: `bg-cream-100` para container, `bg-cream-200` para shimmer bars (era `bg-cream-300`)

### 5. Testimonials cards — mais leves
- Card bg: `bg-white` (já ok)
- Card border: `border-cream-300` (era `border-border`)

### 6. NewsletterFooter — garantir cores claras
- Input: `bg-white border-cream-300` (era `border-cream-400`)
- Heading: `text-foreground` (era `text-brown-dark`)

## Arquivos a modificar (9)

| Arquivo | Mudança |
|---------|---------|
| `StorySection.tsx` | `bg-secondary/30` → `bg-cream-100` |
| `SubscriptionBanner.tsx` | `bg-secondary/30` → `bg-cream-100` |
| `TestimonialsSection.tsx` | `bg-secondary/30` → `bg-cream-100`, card borders |
| `StatsSection.tsx` | OK, only minor text adjustments |
| `CoffeeCarousel.tsx` | Lighter skeleton/card colors |
| `Footer.tsx` | `bg-cream-100`, all text/border colors explicit light |
| `NewsletterFooter.tsx` | Text colors for light bg |
| `NewsletterPopup.tsx` | Lighter overlay |
| `Header.tsx` | Minor — announcement bar `bg-cream-100` (era `bg-cream-200`) |
