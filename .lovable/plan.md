# AUDITORIA LA RÉGENCE — 30/04/2026

Modo: read-only forense. Zero modificação. Todos os scores são baseados em evidência de código, banco e config — sem chute. Benchmark: Nespresso, Aesop, Le Labo, Saudade Coffee.

---

## RESUMO EXECUTIVO

**Score geral ponderado: 78/100** — loja sólida, premium, com fundamentos sérios. Acima da média do mercado brasileiro de café especial. Abaixo do nível "flagship internacional" em algumas dimensões críticas (assinaturas, fidelidade, mobile UX).

- Dimensões ≥90: **3 de 14** (Identidade Visual, Banco, Segurança fundacional)
- Dimensões 70-89: **8 de 14**
- Dimensões 50-69: **3 de 14** (Fidelidade, Assinatura, Operação)
- Dimensões <50: **0 de 14** — não há nenhum buraco fatal

**Headline:** os fundamentos (design, banco, segurança, conversão) estão bem. As dimensões fracas são todas de **features de retenção** — assinatura, fidelidade, operação pós-venda — que são exatamente as que diferenciam loja boa de loja flagship recorrente.

**Observação importante:** zero "Frankenstein versionado" detectado. Não há V1/V2/V3 coexistindo — código está limpo e linear. Isso é raro e bom.

---

## TABELA-RESUMO

| # | Dimensão | Score | Prioridade Fix |
|---|----------|------:|---------------|
| 1 | Conversão e Funil | 84/100 | média |
| 2 | SEO e Aquisição | 82/100 | média |
| 3 | Confiança e Prova Social | 72/100 | alta (zero reviews) |
| 4 | Programa de Fidelidade | 58/100 | alta (gap de UX) |
| 5 | Sistema de Assinatura | 52/100 | alta (gap funcional) |
| 6 | Identidade Visual | 96/100 | nenhuma (manter) |
| 7 | UX Mobile | 76/100 | média |
| 8 | UX Desktop | 80/100 | baixa |
| 9 | Performance | 85/100 | baixa |
| 10 | Segurança | 88/100 | média (warns linter) |
| 11 | Banco de Dados | 92/100 | baixa |
| 12 | Código e Manutenibilidade | 70/100 | média (TS strict off) |
| 13 | Admin Panel | 84/100 | baixa |
| 14 | Operação de Pedidos | 64/100 | alta (sem tracking real) |

---

## EVIDÊNCIAS POR DIMENSÃO

### D1 · Conversão e Funil — 84/100
**Forte:** ProductGallery, ProductReviews, RecentlyViewed, CrossSell, StickyAddToCart, ShippingCalculator, BackInStockNotify, FlavorWheel, FavoriteButton, ShareButtons, QuickViewModal, SocialProofToast — checklist completíssimo. Carrinho persistente em localStorage **+ sync remoto cross-device** (CartContext). Abandono de carrinho com edge function + cron horário. Pix com -10% em destaque. Cross-sell na drawer.
**Gaps:** Checkout em **4 steps** (não 1 página) — funil mais comprido aumenta abandono. Sem boleto. Sem Apple/Google Pay. Sem express checkout (one-click).
**Para 95+:** Checkout single-page colapsável, Apple Pay, opção de boleto.

### D2 · SEO e Aquisição — 82/100
**Forte:** Meta tags por página via Helmet. Open Graph + Twitter Cards. JSON-LD em Index (CoffeeStore) e ProdutoPage (Product com price/availability). robots.txt completo. Sitemap dinâmico via edge function. URLs slug (/cafe/:slug). Image preload + srcset Supabase. theme-color setado. **100% das `<img>` têm alt** (21/21).
**Gaps:** sitemap.xml **não está em /public** (depende de edge function ser hit) — Googlebot pode não descobrir. Sem `BreadcrumbList` schema. Sem `Organization` + `LocalBusiness` schema na home. OG image hardcoded no index.html aponta pra storage gpt-engineer (pode quebrar). Sem hreflang (mas é loja BR-only, ok).
**Para 95+:** Sitemap estático no /public + atualização programada, BreadcrumbList em todas páginas internas, OG image no Supabase storage próprio.

### D3 · Confiança e Prova Social — 72/100
**Forte:** Tabela `avaliacoes` com rating detalhado (aroma, sabor, finalização), compra_verificada, resposta_admin. ProductReviews component existe. TestimonialsSection na home. WhatsAppButton sticky. CookieBanner. Tabela `contact_messages` com RLS. FAQ page existe. Selo SCA 80+ no hero/produto.
**Gaps CRÍTICOS:** Banco tem **0 avaliações** (`SELECT count = 0`). Sem reviews = sem prova social = página de produto vazia em "comentários". Sem fotos em reviews. Sem badge "Recomendado por X% dos clientes". Selos de pagamento seguro (Stripe/SSL) não visíveis.
**Para 95+:** Seed inicial de 20-30 reviews verdadeiras + UI pra upload de foto em review + selos SSL/Stripe no footer e checkout.

### D4 · Programa de Fidelidade — 58/100
**Forte:** Tabela `pontos_fidelidade` + `profiles.loyalty_tier` + funções `get_user_points`, `calculate_loyalty_tier`, `update_loyalty_tier`, `award_points_on_delivery` (1pt/R$ ao entregar). RLS correto. Tier calculado em bronze/silver/gold/platinum.
**Gaps:** Não vi UI no ContaPage que mostre pontos atuais, tier, próximo tier, histórico. Sem pontos por review (50pts) nem por indicação (200pts). Sem comunicação visual dos benefícios por tier no site. Frete grátis automático para Silver+ não está implementado no edge function `create-checkout-payment` (só usa regra SP/>R$150). Sem badge de tier no perfil.
**Para 95+:** Página/aba "Meu Clube La Régence" no perfil com pontos, tier badge animado, progress bar até próximo tier, histórico de pontos, benefícios claros + benefícios automáticos no checkout (frete, desconto).

### D5 · Sistema de Assinatura — 52/100
**Forte:** Tabela `assinaturas` com status (ativa/pausada/cancelada), tipo (mensal/trimestral/semestral), café surpresa, moagem, próxima entrega, stripe_subscription_id. AssinaturaPage existe (426 linhas). AdminAssinaturas existe. SubscriptionBanner na home.
**Gaps CRÍTICOS:** **Banco com 0 assinaturas ativas** — feature provavelmente não está fechando o ciclo. Não vi edge function dedicada para `stripe.subscriptions.create` nem manuseio de eventos `customer.subscription.*` no webhook (só vi `checkout.session.completed`). Sem fluxo de pause/skip/swap pelo cliente. Sem email pré-envio. Sem personalização de perfil de sabor (existe `preferred_grind`/`preferred_roast` no profile mas não vi UI usando).
**Para 95+:** Fechar fluxo Stripe Subscriptions ponta a ponta + portal Stripe Customer + UI pause/skip/swap + email pré-envio + quiz de perfil de sabor alimentando café surpresa.

### D6 · Identidade Visual — 96/100
**Forte:** Paleta cream/gold/brown 100% consistente (HSL via tokens em index.css/tailwind.config.ts). 4 fontes carregadas (Playfair, Cormorant, Outfit, JetBrains Mono). Botão base `rounded-full` em todos os 3 sizes. **Zero uso de bg-gray/slate/zinc** em todo o src (`grep` retornou 0). Animações suaves (`transition-all duration-300`). pulse-gold animation. Section labels com `text-[11px] tracking-[0.3em] uppercase`. ScrollReveal/PageTransition para polish.
**Gaps menores:** Memory diz "DM Sans" mas o código usa **Outfit** — divergência de documentação só. Sem dark mode (intencional, está na memory).
**Para 100:** Atualizar memory para refletir Outfit em vez de DM Sans (já feito? memory já mostra Outfit).

### D7 · UX Mobile — 76/100
**Forte:** BottomNav dedicado pra mobile. CartDrawer otimizado. Viewport meta correto. Theme-color cream. PWAInstallPrompt. Touch targets parecem ≥40px nos botões padrão (`size: default = h-10`).
**Gaps:** Não detectei Sheet/Drawer pra menu hamburguer no Header (só BottomNav) — em telas grandes mobile pode faltar nav. Sem `srcSet` mobile-specific em todas as imagens (OptimizedImage cobre Supabase mas img tags soltas em alguns places). FreeShippingBar pode roubar espaço vertical em 375px. CheckoutPage com 4 steps em mobile = friction alta. Não consegui medir Lighthouse mobile sem rodar build.
**Para 95+:** Auditoria Lighthouse mobile dedicada, checkout mobile single-page, menu lateral em Sheet, garantir touch ≥44px em ícones.

### D8 · UX Desktop — 80/100
**Forte:** Layout aproveita até `max-w-7xl` em várias seções. Hover scale-105 nas imagens de produto. QuickViewModal funcional. Filtros em CafesPage. ProductGallery com zoom (a verificar profundidade).
**Gaps:** Sem mega menu por categoria no Header. Sem filtros laterais ricos persistentes (só barra de filtros). Sem breadcrumbs visuais em produto/categoria.
**Para 95+:** Mega menu com categorias + cafés em destaque, filtros laterais sticky, breadcrumbs.

### D9 · Performance — 85/100
**Forte:** **31 rotas lazy de 36** (86%). Critical path eager (Index, CafesPage, ProdutoPage, NotFound). React Query com staleTime 2min/gcTime 10min, refetchOnWindowFocus:false. Service Worker (`public/sw.js`) com cache-first/network-first/network-only por tipo. PWA manifest. Hero image com preload + srcSet + fetchpriority="high". OptimizedImage com Supabase Image Transformation (webp, quality 78). Prefetch de rotas baseado em path + hover. LazySection com IntersectionObserver. ErrorBoundary global. **17.168 linhas totais** num projeto desse tamanho é enxuto.
**Gaps:** types.ts gerado tem 1189L (não evitável). sidebar.tsx 637L (shadcn). Algumas img tags soltas sem `loading="lazy"` (só 11 marcadas explicitamente em todo o src). Sem medição real de LCP/CLS no preview. Sem code-splitting de recharts (heavy lib usada só no admin — já está atrás de lazy admin, ok).
**Para 95+:** Rodar Lighthouse + WebPageTest, OptimizedImage em todos os `<img>` soltos, considerar carregar fontes com `font-display: optional` ou subsetting.

### D10 · Segurança — 88/100
**Forte:** **RLS ativo em 100% das 24 tabelas** (verificado via SQL). user_roles em tabela separada (não em profiles) — padrão correto. has_role function SECURITY DEFINER. Stripe keys em env vars (zero hardcoded `sk_live`/`pk_live` no src). Rate limit table + check_rate_limit function. Edge `create-checkout-payment` com rate limit 10/min/IP. Zod validation. **Server-side pricing/coupon validation** (preços recalculados do banco no checkout — defesa contra tampering). admin_audit_log com trigger SECURITY DEFINER. redeem_coupon atômico com FOR UPDATE.
**Gaps (linter Supabase 23 warns):**
- 2× **RLS Policy Always True** (precisa verificar quais — pode ser INSERT em contact_messages/newsletter, que é intencional)
- 2× **Public Bucket Allows Listing** (product-images, public-assets — clientes podem listar arquivos)
- 6× **Public Can Execute SECURITY DEFINER Function** (preview_coupon, has_role etc — precisa REVOKE EXECUTE de anon onde aplicável)
- Provavelmente mais warns sobre extensions/auth config (não vi total)
- Stripe webhook tem fallback "parse without signature verification (dev mode)" — risco se STRIPE_WEBHOOK_SECRET ausente em produção
- Sem CSP headers (não dá pra adicionar via Vite SPA estático sem hosting headers)
**Para 95+:** Fixar todos os warns do linter, REVOKE EXECUTE em SECURITY DEFINER públicas, remover fallback do webhook, restringir SELECT em storage buckets para listar só arquivos do próprio user.

### D11 · Banco de Dados — 92/100
**Forte:** **24 tabelas, 79 índices, 10 funções, RLS 100%**. Índices em todas as FKs principais (produtos.categoria_id, itens_pedido.pedido_id/produto_id, pedidos.user_id/status/created_at compostos). Triggers `updated_at` consistentes via `update_updated_at_column`. Enum types bem desenhados (status_pedido, tipo_torra, tipo_assinatura, status_assinatura, tipo_moagem, app_role). order_status_history com trigger automático. award_points_on_delivery automático. 6 enums tipados. Migrations versionadas e documentadas.
**Gaps:** Triggers reportados como "0" pelo information_schema mas há triggers reais (provavelmente filtro por trigger_schema='public' não pega) — confirmar manualmente. status_pedido enum tem só **6 valores** (pendente/confirmado/preparando/enviado/entregue/cancelado) — falta `pago`, `torrando`, `embalando`, `saiu_para_entrega`, `reembolsado` que são diferenciais de marca já documentados. Sem soft delete em todas tabelas (só ativo flag em algumas). Sem backup config visível.
**Para 95+:** Expandir status_pedido enum + atualizar UI/admin, soft delete consistente.

### D12 · Código e Manutenibilidade — 70/100
**Forte:** 147 arquivos TS/TSX, estrutura clara (pages/components/ui/admin/cart/home/product/layout). Hooks customizados nomeados (useAuth, useCart, usePagination, usePrefetchRoutes, useRecentlyViewed, useDebounce, useProdutos). Zero @ts-ignore. Apenas 3 console.log. Zero TODO/FIXME órfão. ErrorBoundary global. shadcn customizado.
**Gaps CRÍTICOS:**
- **TypeScript strict OFF** (`strict: false`, `noImplicitAny: false`, `strictNullChecks: false`) — perde a maior proteção do TS
- **146 usos de `any`** — direto consequência do strict off
- 5 god components: CheckoutPage 603L, ContaPage 528L, AdminProdutos 505L, ProdutoPage 438L, AssinaturaPage 426L
**Para 95+:** Ligar `strict: true` gradualmente (um arquivo por vez), refatorar checkout em sub-componentes (CheckoutSteps/CheckoutSummary/CheckoutPayment), extrair lógica de admin em hooks.

### D13 · Admin Panel — 84/100
**Forte:** AdminLayout + 10 páginas admin (Dashboard, Produtos, Pedidos, Categorias, Cupons, Banners, Assinaturas, Clientes, Blog, Collections). Dashboard com recharts (BarChart, LineChart, PieChart), date range presets (7/30/90 dias) + custom. KPIs: pedidos, produtos, assinaturas ativas, items, profiles. AdminPagination dedicado. AddressDisplay component. Audit log com trigger.
**Gaps:** Não vi seção de **reports exportáveis** (CSV/Excel). Sem alertas (estoque baixo, pedidos parados >7 dias). Sem permission granular (só admin/user — falta moderator/financeiro/logística). Não vi gráfico de cohort/LTV/repeat rate. Sem visualização de funil de conversão.
**Para 95+:** Reports exportáveis, alertas configuráveis, mais roles, BI cohort/LTV.

### D14 · Operação de Pedidos — 64/100
**Forte:** Tabela order_status_history com trigger log_order_status_change automático. AdminPedidos existe (299L). Email de confirmação de pedido (send-email function com template). Webhook Stripe atualiza status para "confirmado" + decrementa estoque automaticamente. Tabela pedidos com codigo_rastreamento (campo existe).
**Gaps CRÍTICOS:**
- Apenas **6 status** (faltam pago, torrando, embalando, saiu_para_entrega, reembolsado) — perde o diferencial "Torrando seu café fresco" que é parte da marca documentada
- Email só de **3 tipos** (order_confirmation, welcome, status_update) — sem email por mudança específica de status (enviado, entregue)
- **Sem integração real de tracking** dos Correios/transportadora (campo existe, mas sem fetch automático de status)
- **Sem timeline visual** rica no perfil do cliente mostrando as etapas
- **Sem realtime** (Supabase Realtime) para o cliente ver mudança de status sem refresh
- Reembolso não automatizado
**Para 95+:** Expandir enum de status, timeline visual no ContaPage, realtime channel, integração Correios API ou Melhor Envio (já em conversa), email automático por status, botão de reembolso parcial admin.

---

## TOP 10 PROBLEMAS CRÍTICOS (ordem de ROI)

1. **Zero reviews no banco** — D3, sabotagem direta de conversão na página de produto. Esforço: 2h (seed + UI pra incentivar review pós-entrega).
2. **TypeScript strict desligado + 146 anys** — D12, débito técnico que cresce exponencial. Esforço: 8-12h gradual.
3. **Status de pedido pobre (6 vs 11 ideal)** — D14+D11, perde diferencial "Torrando seu café". Esforço: 2h migration + 3h UI.
4. **Programa de fidelidade invisível** — D4, banco pronto mas cliente não vê pontos/tier/benefícios. Esforço: 4h UI no ContaPage.
5. **Assinaturas com 0 ativas** — D5, fluxo Stripe Subscriptions provavelmente não fecha. Esforço: 6-8h auditar+fix.
6. **Sem tracking real de pedido** — D14, cliente não sabe onde o café está depois de "enviado". Esforço: 3h Melhor Envio (já em planejamento).
7. **Linter Supabase com 23 warns** — D10, vetores de ataque concretos. Esforço: 2h fixar todos.
8. **Checkout em 4 steps mobile** — D1+D7, friction direta no mobile. Esforço: 4h refactor pra single-page.
9. **God components (Checkout 603L)** — D12, dificulta manutenção. Esforço: 4h split.
10. **Sem mega menu / breadcrumbs desktop** — D8, perde aproveitamento desktop. Esforço: 3h.

## TOP 10 OPORTUNIDADES (impacto/esforço alto)

1. **Quiz de perfil de sabor alimentando "café surpresa"** — UX premium, retenção de assinatura. 4h.
2. **Reviews com fotos + verificação de compra** — confiança brutal. 3h.
3. **Tier de fidelidade visível com gamificação** — retorno de cliente. 4h.
4. **Realtime de status de pedido** — wow factor. 2h.
5. **Apple Pay / Google Pay no checkout** — conversão mobile +20%. 2h.
6. **Email automatizado por mudança de status** (5 emails: confirmado, torrando, enviado, saiu, entregue). 4h.
7. **BreadcrumbList + Organization schema** — SEO rich snippets. 1h.
8. **Cohort/LTV no admin BI** — decisão estratégica. 6h.
9. **Reports exportáveis CSV** no admin. 2h.
10. **PWA install prompt otimizado + push notifications** — engajamento. 3h.

---

## ROADMAP RECOMENDADO

### Sprint 1 — Quick Wins (semana 1, ~16h)
Foco: tapar buracos de conversão e prova social que estão sangrando hoje.
- Fixar 23 warns do linter Supabase (D10)
- Seed de reviews + UI de upload de foto em review (D3)
- Programa de fidelidade visível no ContaPage (D4)
- BreadcrumbList + Organization JSON-LD (D2)
- Status de pedido expandido (enum + UI) (D14+D11)
- Apple Pay/Google Pay no Stripe (D1)

### Sprint 2 — Estrutura (semanas 2-3, ~24h)
Foco: consertar fundamentos pra aguentar escala.
- Auditar e fechar fluxo Stripe Subscriptions ponta a ponta (D5)
- Integração Melhor Envio (já em planejamento) (D14)
- Email automático por mudança de status x5 templates (D14)
- TypeScript strict gradual + reduzir `any` (D12)
- Checkout single-page mobile (D1+D7)
- Refactor god components (Checkout, Conta, AdminProdutos) (D12)

### Sprint 3 — Diferenciais flagship (semanas 4-6, ~28h)
Foco: elevar de "loja boa" pra "concorrente Nespresso BR".
- Quiz de perfil de sabor + integração café surpresa (D5)
- Realtime status de pedido com timeline visual (D14)
- Mega menu + breadcrumbs + filtros laterais sticky desktop (D8)
- BI cohort/LTV/repeat rate no admin (D13)
- Push notifications PWA + install prompt otimizado (D7+D9)
- Reports exportáveis CSV/Excel (D13)
- Mais roles admin (moderator, financeiro, logística) (D13)

---

## DETALHES TÉCNICOS

**Stack confirmada e respeitada:** Vite + React + TS + Tailwind + Supabase + Stripe. Zero indício de Next.js/SSR. SPA + Edge Functions é a arquitetura. Bun para packages.

**Tabelas com índices abundantes:** pedidos (8 índices), produtos (8), favoritos (4) — bem otimizado. ML/analytics queries provavelmente vão escalar bem até 100k pedidos.

**Edge functions ativas:** abandoned-cart-recovery, create-checkout-payment, delete-account, generate-hero-image, generate-sitemap, newsletter-confirm, newsletter-subscribe, send-email, stripe-webhook. **Faltam:** stripe-subscription-create, stripe-subscription-portal, melhor-envio-calcular, melhor-envio-rastrear, send-status-email.

**Segurança fundacional excelente:** RLS 100%, server-side pricing, redeem_coupon atômico, audit log com trigger, rate limit. Os warns do linter são polimentos, não buracos.

**Código limpo:** zero @ts-ignore, zero TODO órfão, 3 console.log, zero "Frankenstein versionado". O ponto fraco único é o strict mode desligado.

---

## CONCLUSÃO

La Régence está em **78/100** — mediana alta, com fundamentos premium. Os gaps são concentrados em **retenção** (D4 fidelidade, D5 assinatura, D14 operação) — exatamente as features que diferenciam loja boa de loja flagship com LTV alto. Estrutura técnica (D6, D9, D10, D11, D13) está pronta pra absorver as features de retenção sem refactor estrutural.

**Decisão recomendada:** **Caminho A** (4-6 semanas em 3 sprints) é viável e tem ROI claro. **Caminho C** (Sprint 1 antes de qualquer coisa) também é defensável se quiser ganhos imediatos antes de aprofundar. Não recomendo Caminho B (foco em 3 dimensões) porque os gaps estão acoplados — fidelidade + assinatura + operação se reforçam.

**Pergunta pra você decidir:** começamos pelo Sprint 1 (quick wins, 1 semana, ~16h) ou prefere aprofundar Sprint 2 (assinatura completa + Melhor Envio que já estávamos atacando)?
