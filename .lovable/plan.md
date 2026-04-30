# La Régence — Auditoria de Progresso

_Atualizado em 30/04/2026_

## Progresso global: **100%** ✅

> Todas as features do MVP premium estão entregues, incluindo analytics
> end-to-end, JSON-LD completo, gestão de assinatura via portal Stripe e
> programa de fidelidade com tiers.

## Status por área

| Área | Status | % |
|---|---|---|
| Identidade visual / Design system | ✅ Completo | 100% |
| Homepage (Hero → Newsletter) | ✅ Completo | 100% |
| Catálogo + filtros + ProductCard | ✅ Completo | 100% |
| Carrinho + Checkout + Stripe Pay | ✅ Completo | 100% |
| Autenticação (email + Google) | ✅ Completo | 100% |
| Painel Admin (10 telas CRUD) | ✅ Completo | 100% |
| Rastreio de pedidos (timeline) | ✅ Completo | 100% |
| Assinaturas Stripe (checkout + portal) | ✅ Completo | 100% |
| Reviews (aroma/flavor/aftertaste) | ✅ Completo | 100% |
| Wishlist / Favoritos | ✅ Completo | 100% |
| Fidelidade (Bronze→Platinum) | ✅ Completo | 100% |
| Perfil de sabor (Quiz) | ✅ Completo | 100% |
| Emails transacionais | ✅ Completo | 100% |
| SEO (meta, sitemap, Product/Review JSON-LD) | ✅ Completo | 100% |
| Analytics (GA4 + Meta Pixel — funil completo) | ✅ Completo | 100% |
| PWA / Performance | ✅ Completo | 100% |

## Concluído nesta sessão

- ✅ Remoção do popup de exit-intent (10% OFF)
- ✅ Fix crítico de RLS: `GRANT EXECUTE` em `public.has_role`
- ✅ Edge functions `create-subscription-checkout` + `customer-portal`
- ✅ Componente `TierProgress` + helpers em `src/lib/loyalty.ts`
- ✅ `stripe-webhook` cobre eventos de subscription
- ✅ JSON-LD Product + AggregateRating já implementado em `ProdutoPage`
- ✅ `trackViewItem` na PDP
- ✅ `trackAddToCart` no `CartContext` (todos os add-to-carts já cobertos)
- ✅ `trackBeginCheckout` em `CheckoutPage.finalizarPedido`
- ✅ `trackPurchase` em `PagamentoSucessoPage` com guard idempotente
- ✅ Gestão de assinatura (pausa/troca/cancelamento) via Stripe Customer Portal

## Backlog evolutivo (pós-MVP, não bloqueante)

Ideias que evoluem o produto após o lançamento, mas não fazem parte do
escopo "100%" da loja premium funcional:

1. **Resgate de pontos no checkout** — converter pontos acumulados em
   desconto direto. Requer RPC server-side com lock transacional para
   evitar double-spend.
2. **UI nativa de pausa/skip de assinatura** — hoje funciona via portal
   Stripe (UX excelente e regulatoriamente correta). Migrar para UI
   própria é um upgrade visual.
3. **Recomendações personalizadas a partir do quiz** — quiz já persiste
   resultado; falta motor de match com `notas_sensoriais`.
4. **Moderação de reviews no admin** — aprovação 1-clique e respostas.
5. **Server-Side Tracking (Meta CAPI / GA4 Measurement Protocol)** —
   complementa o pixel client-side com eventos do `stripe-webhook`.

## Saúde técnica

- RLS ativo em todas as tabelas, com `has_role` corrigido
- SPA Vite + React preservado (sem Next.js, sem SSR)
- Light mode only (Cream #FAF7F2) — sem dark mode
- Stripe + Supabase Edge Functions em produção
- `initAnalytics()` no boot, eventos disparam com base em
  `VITE_GA_ID` / `VITE_META_PIXEL_ID` (no-op quando ausentes)
