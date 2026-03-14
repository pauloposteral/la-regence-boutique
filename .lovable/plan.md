

## Plano: Próximo bloco de melhorias — .gitignore, Database enrichment, Analytics, Cart UX

Baseado na análise do estado atual vs. o guia de 17 sessões, vou implementar as melhorias mais impactantes que ainda faltam.

### O que será feito

**1. .gitignore — adicionar `.env`**
O arquivo `.gitignore` não contém `.env`. Adicionar para evitar exposição de credenciais.

**2. Database: Enriquecer tabela `profiles`**
Adicionar colunas: `preferred_roast` (text), `preferred_grind` (text), `loyalty_tier` (text default 'bronze'). Criar function + trigger para calcular tier automaticamente baseado em pontos.

**3. Database: Enriquecer tabela `avaliacoes`**
Adicionar colunas: `titulo` (text), `aroma` (integer), `sabor` (integer), `finalizacao` (integer), `compra_verificada` (boolean default false), `resposta_admin` (text), `resposta_admin_at` (timestamptz).

**4. Google Analytics 4**
Adicionar script GA4 condicional no `index.html` via env var `VITE_GA_ID`. Criar helper `src/lib/analytics.ts` com funções `trackEvent`, `trackPageView`, `trackEcommerce` para disparar eventos: `view_item`, `add_to_cart`, `begin_checkout`, `purchase`.

**5. Cart Drawer — empty state melhorado**
Quando carrinho vazio, mostrar CTA "Explorar Cafés" com link para `/cafes` em vez de apenas ícone.

**6. Structured Data JSON-LD**
Adicionar Organization schema no Layout e BreadcrumbList schema nas páginas de catálogo.

**7. Product Reviews UI enriquecida**
Atualizar `ProductReviews.tsx` para suportar as novas colunas (aroma, sabor, finalização) e exibir breakdown por estrela.

### Arquivos afetados

| Arquivo | Alteração |
|---|---|
| `.gitignore` | Adicionar `.env` |
| Migration SQL | Colunas em `profiles` e `avaliacoes`, function loyalty_tier |
| `index.html` | Script GA4 condicional |
| `src/lib/analytics.ts` | Novo — helper de analytics |
| `src/contexts/CartContext.tsx` | Dispatch `add_to_cart` event |
| `src/components/cart/CartDrawer.tsx` | Empty state com CTA |
| `src/components/layout/Layout.tsx` | Organization JSON-LD |
| `src/components/product/ProductReviews.tsx` | UI para reviews detalhadas |

