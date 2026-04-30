# La Régence — Auditoria de Progresso

_Atualizado em 30/04/2026_

## Progresso global: **~88%**

## Status por área

| Área | Status | % | Observação |
|---|---|---|---|
| Identidade visual / Design system | Completo | 100% | Cream/Gold/Brown, fontes e pill buttons aplicados |
| Homepage (Hero → Newsletter) | Completo | 100% | Todas as seções renderizando com lazy load |
| Catálogo + filtros + ProductCard | Completo | 100% | Intensity bars, flavor tags, SCA score |
| Carrinho + Checkout + Stripe Pay | Completo | 100% | Pix 10% off e 12x sem juros ativos |
| Autenticação (email + Google) | Completo | 100% | Sem auto-confirm, fluxo padrão |
| Painel Admin (10 telas CRUD) | Completo | 95% | dashboard, produtos, pedidos, clientes, cupons, banners, blog, categorias, collections, assinaturas |
| Rastreio de pedidos (timeline) | Completo | 90% | Falta polimento realtime no estado `delivered` |
| Assinaturas Stripe (checkout + portal) | Em curso | 80% | `create-subscription-checkout`, `customer-portal` e webhook OK; falta UI de pausa/skip e troca de plano |
| Reviews (aroma/flavor/aftertaste) | Completo | 90% | Falta moderação no admin |
| Wishlist / Favoritos | Completo | 100% | — |
| Fidelidade (Bronze→Platinum) | Em curso | 75% | Tiers, pontos e `TierProgress` OK; falta resgate no checkout |
| Perfil de sabor (Quiz) | Em curso | 60% | `QuizPage` existe; falta persistir e gerar recomendações |
| Emails transacionais | Em curso | 50% | `send-email` + abandoned-cart prontos; faltam paid/shipped/delivered |
| SEO (meta, sitemap, schema) | Em curso | 70% | `SEOHead` + `generate-sitemap` OK; falta JSON-LD Product/Review |
| Analytics (GA4 / Pixel) | Em curso | 40% | Base em `lib/analytics.ts`; falta wiring nos eventos |
| PWA / Performance | Completo | 90% | `sw.js`, manifest e `LazySection` em produção |

## Concluído recentemente

- Remoção do popup de exit-intent (10% OFF) — `Layout.tsx`
- Fix crítico de RLS: `GRANT EXECUTE` em `public.has_role` para `anon`/`authenticated`/`service_role`
- Edge functions `create-subscription-checkout` e `customer-portal`
- Componente `TierProgress` + helpers em `src/lib/loyalty.ts`
- Atualização do `stripe-webhook` para eventos de subscription

## Próximos passos (ordem de impacto)

1. **Resgate de pontos de fidelidade no checkout** — fecha o ciclo Bronze→Platinum
2. **Emails transacionais** — pedido pago, enviado e entregue
3. **JSON-LD Product/Review** — destrava rich snippets no Google
4. **Wiring GA4 + Pixel** nos eventos críticos: `view_item`, `add_to_cart`, `begin_checkout`, `purchase`
5. **UI de pausar/pular mês e trocar plano** em `AssinaturaPage`
6. **Persistência do quiz de perfil de sabor** + recomendações personalizadas

## Saúde técnica

- RLS ativo em todas as tabelas, com `has_role` corrigido
- SPA Vite + React preservado (sem Next.js, sem SSR)
- Light mode only (Cream #FAF7F2) — sem dark mode
- Stripe + Supabase Edge Functions funcionando em produção
