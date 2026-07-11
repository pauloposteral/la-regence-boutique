# Auditoria 0-100 + CRUD de Frete Grátis + Cupom de Frete

## Parte 1 — Admin Dashboard (link)

**URL:** `https://www.cafelaregence.com.br/admin`
Login: `pauloposteral@hotmail.com` / senha atual.
Após aprovar este plano deixo botão direto no card ao final.

---

## Parte 2 — CRUD de Regras de Frete Grátis + Cupom de Frete

### Backend
Nova tabela `regras_frete_gratis`:
- `nome` (ex: "Frete grátis SP acima de R$100")
- `uf` (texto, ou `NULL` = todas UFs)
- `valor_minimo` (numeric)
- `ativa` (boolean)
- `prioridade` (int, menor valor mínimo ganha)

RLS: leitura pública das ativas, escrita só admin. GRANT completo.

Extensão em `cupons`:
- Nova coluna `tipo` enum: `desconto` | `frete_gratis` (default `desconto`)
- `preview_coupon` / `redeem_coupon` retornam também `tipo` para o front decidir se zera frete

Edge Function `calcular-frete`:
- Remove valores hardcoded (R$150 / R$100 SP)
- Consulta `regras_frete_gratis` ativas, aplica a mais vantajosa que o pedido atenda
- Fallback seguro: se tabela vazia, mantém R$150 nacional

### Admin — nova página `/admin/frete-gratis`
- Lista com nome / UF / valor mínimo / status / ações
- Modal criar/editar (form validado com zod)
- Toggle ativar/desativar inline
- Botão excluir com confirmação
- Mesmo padrão visual das outras telas admin (cream/gold/brown)

### Cupom de frete grátis
- Admin de cupons ganha seletor "Tipo: Desconto | Frete grátis"
- `CartDrawer` e `CheckoutPage`: quando cupom aplicado tem `tipo=frete_gratis`, frete exibido = R$ 0,00 e badge "Frete grátis pelo cupom"
- Total recalcula sem o frete

### Seed inicial
Migra as regras atuais para o banco (não perde comportamento):
- "Frete grátis Brasil" — UF: todas, mínimo R$ 150, ativa
- "Frete grátis SP" — UF: SP, mínimo R$ 100, ativa

---

## Parte 3 — Auditoria Full Stack 0-100 (relatório, sem código)

Cobertura em 12 dimensões, cada item com nota 0-10, status ✅/⚠️/❌ e ação sugerida (P0/P1/P2):

1. **Segurança & RLS** — revalidar após hardening (cupons, storage, tabelas sensíveis, security definer)
2. **Fluxo de compra ponta-a-ponta** — carrinho → checkout → Stripe → webhook → estoque → e-mail cliente → e-mail dono
3. **Mobile UX** — touch targets, safe-area, iOS zoom, drawer, scroll, PDP mobile
4. **Admin** — guard, CRUDs, dashboard, pedidos, cupons, produtos, nova tela frete
5. **Stripe live** — checkout, subscriptions, portal, webhook único, PIX, idempotência
6. **Notificações** — Resend (welcome / confirmação / envio / entrega / admin_new_order), domínio verificado
7. **Frete** — Melhor Envio token live, CEP origem, cache, novas regras dinâmicas
8. **Performance / LCP** — hero `<img>` + preload, WebP, skeletons, code-split, fontes
9. **SEO** — title/description/OG por rota, JSON-LD Product/Review/Organization/BreadcrumbList, sitemap.xml, robots.txt, canonical
10. **Analytics** — GA4 + Pixel via env vars, eventos e-commerce (view_item, add_to_cart, begin_checkout, purchase)
11. **Legal / LGPD** — Privacidade, Termos, Trocas, cookies banner, exclusão de conta
12. **Qualidade geral** — TypeScript strict, error boundaries, empty states, loading states, 404, monitoramento

Entrego relatório priorizado com score global (0-100) e roadmap dos gaps.

---

## Ordem de execução

```text
1. Migration: tabela regras_frete_gratis + coluna tipo em cupons + seed
2. Atualiza RPC preview_coupon/redeem_coupon para retornar tipo
3. Refatora Edge Function calcular-frete
4. Cria página /admin/frete-gratis + rota + item no menu
5. Adiciona seletor de tipo no admin de cupons
6. Ajusta CartDrawer + CheckoutPage para cupom frete_gratis
7. Redeploy edge functions
8. Roda auditoria 0-100 e entrega relatório
```

## Detalhes técnicos

- Novos arquivos: `src/pages/admin/FreteGratisPage.tsx`, formulário em `src/components/admin/RegraFreteForm.tsx`
- Edições: `supabase/functions/calcular-frete/index.ts`, `src/components/cart/CartDrawer.tsx`, `src/pages/CheckoutPage.tsx`, admin de cupons (`src/pages/admin/CuponsPage.tsx`), `src/components/admin/AdminLayout.tsx` (novo item de menu)
- Sem breaking change: fallback preserva comportamento atual se tabela vazia
- Zero regressão visual — reuso 100% dos componentes/tokens existentes
