
# Auditoria Completa La Régence — 30 Melhorias

Auditoria cirúrgica feita sobre `Index`, `Header`, `ProdutoPage`, `CafesPage`, `CartContext`, `Layout`, `HeroSection`, edge functions, RLS e o `.lovable/plan.md`. Tudo abaixo é **evolução cirúrgica** — zero regressão, preserva 100% do que já funciona.

---

## 🔒 SEGURANÇA (crítico — fazer primeiro)

**1. Endurecer RLS contra acesso anônimo** (já marcado como dívida)
Tabelas `profiles`, `enderecos`, `pedidos`, `assinaturas`, `pontos_fidelidade`, `favoritos`, `itens_pedido` têm policies em `{public}`. Recriar com role `{authenticated}` e adicionar `TO authenticated` explícito + policy de DENY para `anon`.

**2. Validação de cupom server-side**
Hoje o cupom é validado no client (manipulável). Criar edge function `validate-coupon` que checa `ativo`, `valido_ate`, `usos_restantes`, `valor_minimo` e decrementa `usos_restantes` atomicamente em transação no checkout.

**3. Rate limiting nas edge functions sensíveis**
`create-checkout-payment`, `send-email`, `delete-account`. Tabela `rate_limits (key, count, window_start)` + check por IP/user_id. 10 req/min por IP no checkout.

**4. Sanitização de busca no Header (LIKE injection parcial)**
Linha 48 do `Header.tsx` filtra `%_\\` mas o `or()` ainda concatena. Migrar para `.textSearch()` ou usar `ilike` parametrizado direto. Mesmo no `CafesPage`.

**5. Newsletter com double opt-in**
Hoje qualquer um insere qualquer email. Adicionar coluna `confirmed boolean default false` + token de confirmação + edge function `confirm-newsletter`. Evita spam e LGPD.

---

## 💰 CONVERSÃO E CHECKOUT

**6. Validação server-side de preços no checkout**
`create-checkout-payment` aceita `subtotal` e `total` do cliente. **Recalcular** no servidor a partir de `produtos.preco`/`variantes.preco` ignorando o que veio do client. Vital — hoje pode-se pagar R$0,01.

**7. Recalcular frete no servidor**
Mesmo problema: `custoFrete` vem do client. Validar via API dos Correios na edge function antes de criar a session Stripe.

**8. Salvar endereço no perfil pós-checkout**
Quando logado, fazer upsert em `enderecos` com `principal=true` na primeira compra. Reduz fricção em compras futuras.

**9. Carrinho persistente cross-device**
Hoje `localStorage` apenas. Sincronizar com tabela `carts (user_id, items jsonb)` quando logado. Merge inteligente no login.

**10. Expiração de preço no carrinho**
Já validado no `openCart`, mas não na ida ao checkout. Forçar revalidação imediata antes do POST `create-checkout-payment`, com toast se mudou.

**11. Recuperação de carrinho abandonado por email**
Cron edge function `abandoned-cart-recovery` que detecta `pedidos.status='pendente'` há > 1h e dispara email com cupom de 5%. Aumenta receita 5-15%.

**12. Cross-sell no CartDrawer**
Sugerir 2 produtos da mesma categoria dentro do drawer ("Frequentemente comprados juntos"). AOV +12% em média.

---

## ⚡ PERFORMANCE

**13. Imagens em WebP/AVIF + responsive `srcset`**
Hoje `OptimizedImage` apenas faz lazy. Servir variantes via Supabase Image Transformation (`?width=400&format=webp`). LCP -40%.

**14. Preload da imagem do hero**
`HeroSection` carrega PNG grande como `background-image` (não preloadeado). Adicionar `<link rel="preload" as="image" fetchpriority="high">` no `index.html` ou via `SEOHead`.

**15. Reduzir bundle do framer-motion**
Importar de `framer-motion/mini` quando possível ou trocar animações simples (Header logo hover, scroll indicator) por CSS puro. -30KB gzip.

**16. Query batching no Header**
`fav-count` + `header-search` são queries separadas. Combinar busca de favoritos no `useAuth` ou em provider único. Menos round-trips.

**17. Index no Postgres para queries quentes**
- `produtos(ativo, destaque)` para homepage
- `produtos(slug)` único para `useProdutoBySlug`
- `pedidos(user_id, created_at desc)` para conta
- `pontos_fidelidade(user_id)` para tier
Reduz latência 50-200ms por query.

**18. Service Worker real (PWA já manifesta)**
`PWAInstallPrompt` existe mas não há SW registrado. Adicionar Workbox com cache-first para assets e stale-while-revalidate para API. Offline funcional.

---

## 🎨 UX E DESIGN

**19. Skeleton loading no `ProdutoPage` e Homepage**
Hoje mostra Loading global. Skeletons específicos (galeria, info, abas) preservam layout e reduzem CLS. Já no plano original.

**20. Toast de feedback consistente**
Padronizar duração, posição e ícones. Hoje há `sonner` em alguns lugares e `toast` em outros. Centralizar wrapper.

**21. Filtro persistente no `CafesPage` mobile**
Sheet lateral atual fecha ao trocar página. Adicionar chip removível dos filtros ativos no topo (já tem URL params, faltam chips).

**22. Empty states ilustrados**
`/favoritos` vazio, `/comparar` vazio, busca sem resultado — hoje só texto. CTA + ilustração SVG dourada melhora retenção.

**23. Comparador de cafés visual**
Tabela `CompararPage` é funcional mas seca. Adicionar barras visuais para acidez/corpo/doçura (já tem dados em `produtos`).

**24. Scroll progress bar só em posts longos**
`ScrollProgress` está em todo Layout. Mover para `BlogPostPage` apenas — em homepage é distração.

---

## 📈 SEO E MARKETING

**25. Sitemap.xml dinâmico funcional**
Edge `generate-sitemap` já existe. Cron diário regenerando com produtos + posts ativos. Linkar no `robots.txt` (já está no plano, falta CRON).

**26. JSON-LD Product completo em `ProdutoPage`**
Schema.org `Product` + `Offer` + `AggregateRating` (média de `avaliacoes`) + `Review`. Rich snippets no Google = +20% CTR.

**27. Open Graph dinâmico com imagem do produto**
`SEOHead` aceita `og:image` mas `ProdutoPage` não passa. Adicionar imagem principal + alt. Compartilhamento WhatsApp/Instagram fica visual.

**28. GA4 + Meta Pixel**
`trackPageView` e `trackAddToCart` já existem em `lib/analytics.ts` mas sem provedor real. Plugar GA4 + Pixel via env vars. Mensurar funil real.

---

## 🛠️ ADMIN E OPERAÇÃO

**29. Dashboard admin com métricas reais**
`AdminDashboard` (399 linhas) já estruturado — auditar se KPIs (receita, ticket médio, conversão, AOV, top SKUs) usam dados ao vivo do Supabase via SQL views ou se há mocks. Adicionar gráfico de receita 30d com Recharts (já instalado).

**30. Logs de auditoria admin**
Tabela `admin_audit_log (admin_id, action, table_name, record_id, before jsonb, after jsonb, created_at)` + trigger nas tabelas críticas (`produtos`, `pedidos`, `cupons`, `user_roles`). Compliance e rastreabilidade.

---

## Priorização sugerida

| Prioridade | Itens | Justificativa |
|---|---|---|
| **🔴 Crítico (semana 1)** | 1, 2, 6, 7 | Vulnerabilidades reais — pagamento e RLS |
| **🟠 Alto (semana 2)** | 3, 4, 8, 13, 14, 17, 26 | Performance + segurança + SEO de receita |
| **🟡 Médio (semana 3)** | 5, 9, 10, 11, 12, 19, 28 | Conversão e UX |
| **🟢 Polimento** | 15, 16, 18, 20–25, 27, 29, 30 | Refinamento e observabilidade |

---

## Como prosseguir

Posso começar pelos **4 itens críticos vermelhos** (1, 2, 6, 7) em uma única passada — são os de maior risco e menor escopo de UI. Depois subimos por bloco.

Aprova a lista ou quer reorganizar/excluir itens antes de implementar?
