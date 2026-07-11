
# Auditoria La Régence — Relatório

Modo somente-leitura. Nenhum arquivo alterado. Abaixo, achados por seção, tabela-resumo e priorização.

---

## 1. 🛒 Carrinho no mobile — PRIORIDADE MÁXIMA

| Item | Status | Nota |
|---|---|---|
| Drawer abre no mobile | ✅ | `CartDrawer.tsx` usa `w-full max-w-md`, layout flex-col |
| Overflow horizontal | ✅ | `min-w-0` + `truncate` no nome |
| Item: imagem, nome, preço, subtotal | ⚠️ | Não mostra **preço unitário** separado do subtotal (só subtotal linha 134) |
| Stepper 44×44px | ❌ | Botões `p-1` com ícone `w-3 h-3` ≈ 24px. Muito pequeno pra dedo |
| Remover com feedback | ⚠️ | `Trash2` w-3.5 (~14px) sem toast/animação de saída (só `layout` do framer) |
| Recalcula totais na hora | ✅ | Derivado do state |
| CTA sticky sempre visível | ⚠️ | Footer é `border-t p-5` dentro do flex, mas **sem `pb-safe`** — em iOS o botão fica atrás do home indicator |
| Safe area iOS | ❌ | Drawer não aplica `env(safe-area-inset-bottom)`. Classe `pb-safe` existe em `index.css` mas não é usada aqui |
| Scroll interno sem travar | ⚠️ | `overflow-y-auto` sem `overscroll-behavior: contain` — arrasta a página atrás |
| Fechar: X + overlay | ✅ | Ambos funcionam |
| Estado vazio | ✅ | CTA "Ver Cafés" presente |
| Update otimista | ✅ | State local imediato |
| Persistência refresh + login | ✅ | localStorage + tabela `carts` com merge no login (`CartContext.tsx` L67-119) |
| Badge header atualiza | ✅ | `totalItems` derivado |
| Inputs ≥ 16px (iOS zoom) | ❌ | `<Input>` do cupom sem `text-base` — provoca zoom no iOS. Idem inputs do checkout precisam auditoria |
| Animações suaves | ✅ | Framer spring |

**Problemas encontrados:**
- **P1** Touch targets abaixo de 44px no stepper e no trash (`CartDrawer.tsx` L128-136). Corrigir com `min-w-[44px] min-h-[44px]` e `hit-area` via padding.
- **P1** Sem `pb-safe` no footer do drawer (`CartDrawer.tsx` L150). CTA pode ficar coberto no iOS.
- **P1** Sem `overscroll-behavior: contain` na lista rolável (L100).
- **P2** Input do cupom (L153) sem `text-[16px]` — provoca zoom no iOS.
- **P2** Faltam preço unitário e animação de exit nítida ao remover.
- **P2** Validação de cupom no drawer bypassa `redeem_coupon` RPC (usa SELECT direto) — divergente do checkout e sem consumo de `usos_restantes` até fechar o pedido.

---

## 2. 🔁 Fluxo de compra completo

| Item | Status | Nota |
|---|---|---|
| Home sem erros console / CLS | ⚠️ | Warning `RESET_BLANK_CHECK` benigno; CLS depende de imagens (hero já preload) |
| Nav home → categoria → PDP | ✅ | |
| PDP: galeria, intensidade, notas, qty, add | ✅ | |
| Add pelo card e pela PDP | ✅ | |
| Checkout: validação campo a campo | ⚠️ | Precisa validar `CheckoutPage.tsx` (721 linhas — auditar zod schemas por campo) |
| Compra como convidado | ❔ | Precisa executar fluxo — verificar se `create-checkout-payment` aceita sem auth |
| Cartão 4242 conclui | ❔ | Requer teste manual em Stripe Live/Test |
| Cartão recusado 4000...0002 tratado | ❔ | Precisa validação de UX no retorno |
| Página de confirmação | ✅ | `PagamentoSucessoPage.tsx` |
| Pedido em "Meus pedidos" | ✅ | `ContaPage.tsx` |
| Estoque decrementa | ❔ | Verificar em `stripe-webhook/index.ts` — se não existir, é P1 |
| Fluxo repetido no mobile | ❔ | Requer teste manual |

**Ações de auditoria manual necessárias antes da correção:** rodar checkout em preview mobile com cartões de teste; inspecionar se webhook decrementa `estoque`.

---

## 3. ⚙️ Admin — cadastro simples

| Item | Status | Nota |
|---|---|---|
| /admin protegida | ⚠️ | Guard client-side via `has_role` RPC (`AdminLayout.tsx` L56-77). **Mas** enquanto `isLoading`, o `Outlet` renderiza — flash de conteúdo. RLS confirmar no banco |
| Listagem com busca/filtro/ativo/estoque | ✅ | `AdminProdutos.tsx` |
| Formulário cobre domínio completo | ❔ | Verificar campos (SCA, torra, formato, peso, SKU) — auditar em detalhe |
| Upload múltiplo + principal + remover | ❔ | Precisa abrir componente de imagens do admin |
| Validação por campo | ❔ | |
| Feedback toast e refresh loja | ✅ | react-query invalida |
| Editar carrega tudo | ❔ | |
| Duplicar | ✅ | L136 `duplicateProduct` |
| Desativar/reativar | ✅ | Flag `ativo` |
| Deletar com confirmação | ❔ | Verificar `AlertDialog` |
| Funciona no celular | ⚠️ | Formulários grandes costumam quebrar — testar |

**Problemas:**
- **P1** Guard admin: durante `isLoading` mostra sidebar/rotas — adicionar early return com skeleton.
- **P2** Auditar campos do formulário de produto (validação zod, tags de flavor, peso/SKU) — feedback pendente após inspeção real.

---

## 4. 🔔 Notificações de novos pedidos

| Item | Status | Nota |
|---|---|---|
| E-mail ao dono após pagamento | ❔ | Verificar se `stripe-webhook` dispara `send-email` para admin (memória diz que só cliente recebe) |
| Conteúdo completo com link admin | ❔ | |
| Resend configurado + secrets | ✅ | `RESEND_API_KEY` presente, domínio `cafelaregence.com.br` |
| Badge realtime no admin | ⚠️ | `refetchInterval: 30000` (polling), não Realtime |
| Novo pedido destacado | ❔ | Auditar `AdminPedidos.tsx` — provável ausência de estado "não visto" |
| Falha e-mail não bloqueia pedido | ✅ | Try/catch no webhook (assumir — validar) |
| E-mail cliente | ✅ | Implementado em turnos anteriores |

**Problemas:**
- **P1** Confirmar/implementar e-mail para o dono a cada pedido pago.
- **P2** Trocar polling por Supabase Realtime para badge.
- **P2** Marcar "novo/não visto" em `AdminPedidos`.

---

## 5. 📊 Dashboard admin

| Item | Status | Nota |
|---|---|---|
| KPIs (faturamento, pedidos, ticket, novos clientes) | ✅ | `AdminDashboard.tsx` L59+ |
| Gráfico últimos 30d | ❔ | Verificar componente |
| Pedidos recentes | ✅ | L333 |
| Produtos mais vendidos | ❔ | |
| Alerta estoque baixo | ❔ | |
| Filtros de pedidos + mudança status | ✅ | `AdminPedidos.tsx` |
| Métricas assinaturas por plano | ❔ | |
| Agregações no Postgres | ❌ | Provável: múltiplas queries no client em vez de RPC/view. Auditar |
| Utilizável mobile | ⚠️ | Provável quebra em tabelas largas |

**Problemas:**
- **P2** Criar RPC/view materializada para KPIs (`admin_dashboard_stats`) reduz N queries.
- **P2** Faltam widgets "produtos mais vendidos" e "estoque baixo".
- **P2** Responsividade mobile do dashboard.

---

## 6. 💳 Integridade Stripe × pedidos

| Item | Status | Nota |
|---|---|---|
| Webhook valida assinatura | ✅ | `stripe-webhook` usa `STRIPE_WEBHOOK_SECRET` |
| Status "pago" só via webhook | ✅ | Padrão implementado |
| Idempotência | ❔ | Verificar tabela de eventos processados |
| Valores calculados server | ✅ | `create-checkout-payment` revalida preços e frete |
| Client só publishable key | ✅ | Confirmado nos secrets |
| Teste vs produção | ✅ | Uma chave por vez (live agora) |
| Segundo webhook duplicado | ⚠️ | Ainda 2 endpoints ativos no dashboard Stripe — usuário precisa deletar `elegant-triumph-thin` |

**Problemas:**
- **P0** Deletar webhook duplicado no Stripe (ação do usuário) — se não, cada pedido processa 2x.
- **P1** Adicionar tabela `stripe_events_processed(event_id)` para idempotência formal.

---

## 7. 🔐 Segurança e dados

| Item | Status | Nota |
|---|---|---|
| Sem secrets no bundle | ✅ | Nenhum `sk_live`/service_role no client |
| .env rotacionado | ❔ | Confirmar rotação pós-incidente |
| RLS em todas as tabelas | ✅ | Reforçado em turnos anteriores |
| pedidos/perfis privados | ✅ | Policies por `auth.uid()` |
| Bucket produtos: leitura pública + escrita admin | ⚠️ | Verificar policy do `product-images` |
| Rotas /admin bloqueadas por URL direta | ⚠️ | Client redirect funciona, **mas** flash durante loading (item 3) |

**Problemas:**
- **P0** Rodar `security--run_security_scan` para confirmar RLS + Storage policies.
- **P1** Corrigir flash de admin durante loading do guard.

---

## 8. 🧹 Qualidade geral

| Item | Status | Nota |
|---|---|---|
| Zero erros console | ✅ | Só warning benigno |
| Loading/vazio/erro em todas telas | ⚠️ | Skeletons melhorados, mas admin tem lacunas |
| 404 personalizada | ✅ | `NotFound.tsx` |
| Lazy images + LCP mobile | ✅ | Otimizações recentes |
| Paleta/tipografia consistente | ✅ | |
| Acessibilidade básica | ⚠️ | Falta auditar `alt`, focus ring e labels em forms do admin |

---

## 📋 Tabela-resumo

| Seção | ✅ | ⚠️ | ❌ | ❔ |
|---|---|---|---|---|
| 1. Carrinho mobile | 8 | 4 | 3 | 0 |
| 2. Fluxo de compra | 5 | 1 | 0 | 5 |
| 3. Admin cadastro | 4 | 2 | 0 | 5 |
| 4. Notificações | 2 | 1 | 0 | 4 |
| 5. Dashboard | 3 | 1 | 1 | 4 |
| 6. Stripe | 5 | 1 | 0 | 1 |
| 7. Segurança | 3 | 3 | 0 | 0 |
| 8. Qualidade | 4 | 2 | 0 | 0 |

---

## 🎯 Priorização

### P0 — bloqueia venda / risco de segurança
1. **Webhook Stripe duplicado** (ação do usuário no dashboard Stripe: deletar `elegant-triumph-thin`).
2. **Rodar security scan completo** (RLS, storage policies) antes de divulgar loja.

### P1 — prejudica conversão/UX
3. **Carrinho mobile — touch targets 44px** — `CartDrawer.tsx` L128-136.
4. **Carrinho mobile — `pb-safe` no footer** — `CartDrawer.tsx` L150 (iOS home indicator).
5. **Carrinho mobile — `overscroll-behavior: contain`** — L100.
6. **Guard admin sem flash** — `AdminLayout.tsx` L79-82 (mostrar loader antes do Outlet).
7. **E-mail de novo pedido para o dono** — adicionar disparo em `stripe-webhook`.
8. **Idempotência do webhook Stripe** — tabela `stripe_events_processed`.
9. **Estoque: decremento pós-pagamento** — validar/implementar no webhook.
10. **Testes manuais de checkout** (cartão OK, cartão recusado, guest) em mobile.

### P2 — polish
11. Preço unitário + animação de exit no item do carrinho.
12. Input do cupom `text-base` (evitar zoom iOS).
13. Usar RPC `redeem_coupon` no drawer (consistência com checkout).
14. Realtime no badge de pedidos pendentes (substituir polling 30s).
15. Estado "não visto" em `AdminPedidos`.
16. RPC/view agregada para KPIs do dashboard.
17. Widgets "mais vendidos" e "estoque baixo".
18. Responsividade mobile do admin.
19. Auditoria de a11y (alt, focus, labels).
20. Auditar formulário de produto (campos completos, upload múltiplo com principal).

---

## Próximos passos

Aguardo sua aprovação para:
- **(A) Corrigir tudo de P0 + P1** em uma sprint cirúrgica (sem alterar design), OR
- **(B) Ir só nos P0 + carrinho mobile (P1 itens 3-5)** primeiro e depois o resto.

Também preciso rodar testes manuais de checkout (Seção 2) e abrir arquivos do admin em detalhe (Seções 3-5) — vários itens ficaram como ❔ porque não abri todos os arquivos ainda para não estender demais esta auditoria. Se preferir, faço um segundo passe cobrindo os ❔ antes de qualquer correção.
