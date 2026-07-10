## Plano de ativação 100% — Resend + Melhor Envio + Stripe Live

Objetivo: deixar a loja pronta para receber pagamentos reais, calcular frete real e enviar e-mails transacionais.

---

### Bloco 1 — Resend (e-mails transacionais)

**O que faço:**
1. Conectar Resend via connector (`standard_connectors--connect` com connector_id `resend`) — você escolhe/autoriza a conta.
2. Criar edge function `send-email` (já existe stub — refatoro para usar Resend via gateway).
3. Criar 4 templates HTML on-brand (cream/gold/brown):
   - `order-confirmation` — pedido recebido
   - `order-shipped` — enviado (com código de rastreio)
   - `order-delivered` — entregue (+ CTA de review)
   - `welcome` — boas-vindas ao cadastrar
4. Disparar automaticamente:
   - `stripe-webhook` on `checkout.session.completed` → order-confirmation
   - `AdminPedidos` ao mudar status para `shipped`/`entregue` → e-mail correspondente
   - `handle_new_user` trigger → welcome (via edge function chamada pelo trigger ou pelo AuthPage)
5. Contato (ContatoPage) já salva em `contact_messages` — adiciono e-mail de auto-resposta ao cliente.

**Precisa de você:**
- Autorizar a conexão Resend
- **Domínio verificado no Resend** — precisa ter `cafelaregence.com.br` (ou subdomínio tipo `notify.cafelaregence.com.br`) verificado no painel Resend com DNS já configurado. Sem isso o envio falha para qualquer e-mail diferente do dono da conta.
- Confirmar o remetente: `contato@cafelaregence.com.br` ou outro?

---

### Bloco 2 — Melhor Envio (frete real)

**O que faço:**
1. Criar edge function `calcular-frete` que chama a API do Melhor Envio (sandbox ou produção conforme flag) com CEP origem fixo `16901100` (Andradina-SP).
2. Retorna cotações reais de PAC, SEDEX, Jadlog etc. — cliente escolhe no checkout.
3. Manter regra atual: grátis SP acima de R$100, grátis geral acima de R$150 (aplicado por cima da cotação).
4. Cachear cotação por CEP+peso por 1h em tabela `shipping_quotes` para reduzir chamadas.
5. Substituir os valores fixos no `CheckoutPage` e `create-checkout-payment` pelo valor cotado real (com validação server-side — cliente não pode fraudar).
6. Peso: usar `peso_gramas` da tabela `produtos` (adiciono coluna se não existir, default 250g).

**Precisa de você:**
- **Token JWT do Melhor Envio** (guardo em `MELHOR_ENVIO_TOKEN`)
- Confirmar: sandbox (testes) ou produção (real)?
- User-Agent com seu e-mail (exigência da API): `LaRegence (contato@cafelaregence.com.br)` — ok?

---

### Bloco 3 — Stripe Live (pagamento real)

**O que faço:**
1. Substituir `STRIPE_SECRET_KEY` (test) por live (`sk_live_...`) via `update_stripe_secret_key`.
2. Substituir `STRIPE_WEBHOOK_SECRET` pelo signing secret **live** do endpoint de produção.
3. Criar os 3 preços recorrentes de assinatura no Stripe (Explorador R$59/mês, Connoisseur R$109/mês, Sommelier R$189/mês) e colar os `price_id` no código da `AssinaturaPage` (hoje pode ter placeholders).
4. Ativar PIX no Stripe (a API já aceita — só precisa estar habilitado na conta).
5. Verificar Customer Portal ativado no Stripe Dashboard (aviso — não posso ativar por você).

**Precisa de você:**
- Conta Stripe verificada em modo live (CNPJ, dados bancários OK)
- Fornecer via secure form: `sk_live_...` e `whsec_...` (live)
- Ativar Customer Portal em `dashboard.stripe.com/settings/billing/portal` (1 clique)
- Configurar webhook em produção apontando para a edge function `stripe-webhook`, eventos: `checkout.session.completed`, `customer.subscription.created/updated/deleted`, `invoice.paid`, `invoice.payment_failed`

---

### Ordem de execução

1. **Resend primeiro** (destrava e-mails de pedido antes das compras acontecerem)
2. **Melhor Envio** (frete correto antes de vender)
3. **Stripe Live por último** (só ativa quando 1 e 2 estão testados)

Cada bloco eu testo antes de passar pro próximo. Total ~1 sessão longa se você me passar os secrets em sequência.

---

### O que já está pronto (não mexo)

- Checkout server-side validado ✅
- Rate limiting ✅
- Analytics GA4/Pixel ✅
- JSON-LD, sitemap, SEO ✅
- Painel admin ✅
- Pontos de fidelidade + tiers ✅
- Reviews ✅

---

**Pergunta antes de aprovar:** posso começar pelo **Bloco 1 (Resend)** agora? Se sim, autorizo a conexão Resend na primeira ação. Você precisa apenas ter o domínio verificado no painel Resend (ou verificamos depois se o envio falhar).