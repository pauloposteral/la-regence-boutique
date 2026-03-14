

# Correções Visuais e CSS — La Régence

## Problemas Identificados nos Screenshots

### Críticos
1. **`min-font-size: 14px`** em `index.css` linha 122 — propriedade CSS inválida (não existe). Deve ser removida.
2. **`bg-gold/8`** em `BrewMethods.tsx` linha 41 — classe Tailwind inválida (valores de opacidade devem ser múltiplos de 5). Deve ser `bg-gold/10`.
3. **Seção `.dark` removida** do `index.css` — a seção dark mode foi removida nas migrações anteriores mas existem referências a ela. Sem impacto já que não usamos dark mode, mas bom limpar.
4. **Home mostra apenas Hero + Footer** — as lazy sections (CoffeeCarousel, Collections, etc.) dependem do IntersectionObserver mas podem não carregar se o viewport inicial cobre todo o conteúdo visível. O `rootMargin: "200px"` deveria resolver, mas o problema parece ser que na viewport atual (1330x908) o Hero ocupa 85-90vh, não sobrando espaço para o observer dos sections seguintes disparar. As sections DynamicBanners e CoffeeCarousel não estão dentro de LazySection e deveriam aparecer — isso sugere que o problema pode ser de dados (nenhum produto no banco) fazendo CoffeeCarousel renderizar vazio, e DynamicBanners retorna null por falta de banners.

### Visuais
5. **Newsletter popup** — visual correto mas pode melhorar com gold border accent mais visível.
6. **Footer newsletter section** — "Receba novidades" e "Dicas de preparo..." texto em `text-cream-200` e `text-cream-600` sobre fundo `brown-deep` — está OK nos screenshots.
7. **Fontes** — Google Fonts carrega Playfair Display, Cormorant Garamond, Outfit e JetBrains Mono. Tailwind config referencia `font-display`, `font-body`, `font-accent`, `font-mono`. Tudo alinhado, sem erros de fonte.
8. **WhatsApp button** — agora usa `bg-gold` (correto com a paleta), não verde.

## Plano de Correções

### 1. Corrigir CSS inválido — `src/index.css`
- Remover `min-font-size: 14px` (propriedade inexistente)
- Substituir por `font-size: max(14px, 1em)` ou simplesmente remover

### 2. Corrigir classe Tailwind inválida — `src/components/home/BrewMethods.tsx`
- `bg-gold/8` → `bg-gold/10` (linha 41)

### 3. Garantir que seções da Home apareçam mesmo sem dados
- **CoffeeCarousel**: quando `items.length === 0` e `isLoading === false`, mostrar estado vazio elegante em vez de nada
- **DynamicBanners**: retorna `null` quando não há banners — OK, mas o CoffeeCarousel deveria pelo menos mostrar skeletons ou empty state

### 4. Melhorias visuais menores
- **Card shadows**: `shadow-sm` no `card.tsx` está muito fraco — melhorar para `shadow-[0_2px_8px_-2px_hsl(var(--gold)/0.08)]`
- **BrewMethods icon circles**: fix opacity value
- **Body font-size**: adicionar `font-size: 14px` como base no body (propriedade válida)

### Arquivos a modificar
| Arquivo | Mudança |
|---------|---------|
| `src/index.css` | Remover `min-font-size`, adicionar font-size base válido |
| `src/components/home/BrewMethods.tsx` | Fix `bg-gold/8` → `bg-gold/10` |
| `src/components/home/CoffeeCarousel.tsx` | Adicionar empty state elegante |
| `src/components/ui/card.tsx` | Refinar shadow |

