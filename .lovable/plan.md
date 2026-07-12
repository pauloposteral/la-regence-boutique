
# Auditoria 0→100 — Checklist Loja Virtual (La Régence)

Legenda: ✅ existe · 🟡 parcial · ❌ falta

---

## 1. Fundação
✅ Domínio + HTTPS · ✅ Identidade · ✅ Home · ✅ Sobre · ✅ Contato · ✅ Favicon/OG · ✅ FAQ · 🟡 404 (existe mas simples) · ❌ B2B

## 2. Jurídico
🟡 CNPJ/endereço no rodapé (verificar) · ✅ Termos · ✅ Privacidade · ✅ Trocas · ✅ Envio · ❌ **Cookie consent com opt-in real bloqueando GA/Pixel** · 🟡 Canal LGPD (usa contato) · ❌ NF-e automática · ❌ Reclame Aqui

## 3. Catálogo
✅ Grid · ✅ Card · ✅ PDP · ✅ Atributos · ✅ Variantes · 🟡 3+ fotos (nem todos) · ✅ Relacionados · ✅ Badges · ❌ **"Avise-me quando chegar"** · ✅ Reviews · 🟡 Guia de preparo · 🟡 Conteúdo rico

## 4. Busca/Navegação
✅ Menu · ✅ Busca · ✅ Filtros · ✅ Breadcrumbs · ❌ Autocomplete · ❌ Quiz de sabor

## 5. Carrinho
✅ CRUD · ✅ Drawer + badge · ✅ Persistência · ✅ Mobile (44px + safe-area) · ✅ Vazio · ✅ Cupom · ✅ Estimativa CEP · ✅ Barra frete grátis · ❌ Cross-sell

## 6. Checkout
✅ Etapas · ✅ Guest/conta · ✅ ViaCEP · ✅ CPF/CNPJ · ✅ Validação · ✅ Resumo · ✅ Frete · ✅ Confirmação · ✅ Endereços salvos · ❌ Checkout expresso

## 7. Pagamentos
✅ Cartão · ✅ PIX · ✅ Webhook (assinatura verificada) · 🟡 **Idempotência do webhook** (verificar) · ✅ Server-side · ✅ Fallback · ✅ Parcelamento · 🟡 Reembolso (manual) · ❌ Boleto · ❌ Apple/Google Pay

## 8. Frete
✅ Melhor Envio · ✅ Prazo · ✅ Frete grátis dinâmico (CRUD) · 🟡 **Rastreio no e-mail** (falta e-mail "enviado") · 🟡 CEP não atendido · ❌ Retirada local · 🟡 Unboxing

## 9. Conta
✅ Login · ✅ Recuperação · 🟡 Verificação e-mail (Supabase confirm) · ✅ Histórico · ✅ Perfil/endereços · ✅ Google · ✅ Timeline · 🟡 Wishlist (base) · ❌ "Comprar de novo" 1-clique · ✅ Fidelidade

## 10. Pós-venda
✅ Ciclo status completo · ✅ Cliente/admin sincronizados · 🟡 Cancelamento cliente · ❌ Troca/devolução self-service · ❌ **E-mail pedindo review** · ❌ NPS

## 11. E-mails
🟡 **SPF/DKIM Resend** (depende de você verificar) · ✅ Confirmação · ✅ Pagamento · ❌ **Pedido enviado + rastreio** · ✅ Dono notificado · 🟡 Boas-vindas · ✅ Reset senha (Supabase) · ❌ Entregue+review · ❌ **Carrinho abandonado ativo** (function existe, sem cron) · ✅ Templates com identidade

## 12. Assinaturas
✅ 3 planos Stripe · ✅ Página comparativa · ✅ Portal · ❌ **Pausar/pular entrega inline** · 🟡 Dunning (Stripe faz sozinho, sem e-mail próprio) · ❌ Personalizar caixa · 🟡 Benefícios exclusivos

## 13. Admin
✅ Guard + RLS · ✅ CRUD produtos · ✅ Categorias · ✅ Pedidos · ✅ Estoque · ✅ Dashboard · ❌ **Notificação realtime novo pedido** · ✅ Cupons · ✅ Clientes · ✅ Moderação reviews · ✅ Banners · ✅ Assinantes · ❌ **Exportar CSV** · ✅ Audit log

## 14. Marketing
✅ Newsletter · ✅ Cupom 1ª compra · ✅ Reviews · 🟡 Recuperação carrinho (function sem trigger) · ✅ Depoimentos · ✅ Social · ❌ Indicação · ❌ Landing sazonal · ✅ (sem popup, por design)

## 15. SEO
✅ Title/desc · ✅ URLs · ✅ Sitemap/robots · ❌ **SPA sem pré-render** (produtos não indexam bem) · ✅ Schema Product · ✅ OG por produto · 🟡 Alt text (parcial) · ❌ Blog ativo · 🟡 Canonical

## 16. Analytics
🟡 **GA4 depende de IDs em .env** · ❌ Search Console (você) · 🟡 Meta Pixel · ❌ **Scripts sem gate de consentimento** · ❌ Funil · ❌ Clarity

## 17. Performance
✅ Mobile · ✅ WebP · 🟡 LCP (hero OK, falta preload de fonte) · ✅ Loading states · 🟡 Console limpo · ❌ **Sentry** · ❌ **Error boundaries por rota** · 🟡 A11y · ❌ E2E

## 18. Segurança
✅ RLS · ✅ Secrets · 🟡 Rotação de creds (depende de você) · ✅ Validação server · ❌ **Rate-limit em send-email/newsletter/login** · 🟡 Backups (Supabase padrão, sem teste) · ❌ CSP headers

## 19. Atendimento
✅ WhatsApp · ✅ E-mail · ✅ FAQ · 🟡 Horário · ❌ Chat

---

## Score: **82/100** — vendendo, com 4 gaps P0 travando o "10/10"

---

# Plano de correção

## 🔴 P0 — Fechar gate (1 sprint)

1. **Cookie consent LGPD com gate real** — banner que só carrega GA4/Pixel após `accept`. Bloquear `initGA()`/`fbq('init')` em `main.tsx` até `localStorage.cookieConsent === 'accepted'`.
2. **E-mail "pedido enviado" com rastreio** — trigger no update de `pedidos.status='shipped'` (ou botão no admin ao inserir código) → invoca `send-email` tipo `order_shipped` com link Melhor Envio.
3. **Rate-limit** em `send-email`, `newsletter-subscribe` e tentativas de login (usar RPC `check_rate_limit` já existente).
4. **Idempotência webhook Stripe** — garantir tabela `webhook_events(event_id)` com unique constraint; return 200 se duplicado.

## 🟡 P1 — Elevar qualidade (2-3 sprints)

5. **Notificação realtime admin** — subscribe `pedidos` no `AdminLayout`, badge com contador de `status='paid'` não visto + som opcional.
6. **Carrinho abandonado ativo** — cron pg (a cada 2h) invoca `abandoned-cart-recovery` para carrinhos > 4h e < 24h sem pedido.
7. **E-mail pós-entrega pedindo review** — trigger em `status='entregue'` → e-mail com link direto pra `/produto/:slug#review`.
8. **Boas-vindas + verificação e-mail** — template branded no Supabase confirm + e-mail de boas-vindas via `send-email`.
9. **Avise-me quando chegar** — tabela `notify_restock(user, variante)` + trigger no update de `estoque > 0`.
10. **Exportar CSV pedidos/clientes/assinantes** — botão no admin gerando CSV client-side (papaparse).
11. **Error boundaries por rota** + **Sentry** (DSN via env).
12. **Cross-sell no carrinho** — 2 produtos "harmoniza com" no drawer.
13. **Cancelar pedido pelo cliente** (se `status IN ('pending','paid')`) na página de detalhe.
14. **Pausar/pular assinatura inline** na área do cliente (Stripe API).
15. **Preload Playfair woff2** + `content-visibility:auto` seções abaixo da fold.
16. **Canonical dinâmico por rota** no `SEOHead.tsx`.
17. **Alt text descritivo** em todas imagens (auditar componentes).

## 🟢 P2 — Crescimento (backlog)

18. Autocomplete de busca (Meilisearch/Algolia ou fuse.js local)
19. Quiz de perfil de sabor
20. Pré-render SEO (react-snap ou migrar rotas críticas para SSG)
21. Programa de indicação
22. Landing pages sazonais (CMS mínimo já existe via banners)
23. NPS pós-compra
24. Troca/devolução self-service
25. Comprar de novo 1-clique
26. Blog ativo com CMS
27. Personalizar próxima caixa de assinatura
28. Retirada local
29. CSP headers
30. Testes E2E (Playwright) dos 2 fluxos críticos
31. Clarity (heatmaps, gratuito)
32. Chat no site
33. NF-e automática (Bling/eNotas)
34. Boleto / Apple Pay / Google Pay

---

## Ordem de execução sugerida (após aprovar)

**Sprint 1 (P0):** itens 1→4
**Sprint 2 (P1 crítico):** itens 5, 6, 7, 11
**Sprint 3 (P1 UX):** itens 8, 9, 10, 12, 13, 14
**Sprint 4 (P1 polish):** itens 15, 16, 17

Aprove e eu começo pelo Sprint 1.
