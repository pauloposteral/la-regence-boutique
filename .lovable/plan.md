

## Plano: Integrar Stripe Checkout com Pix + Cartão

O Stripe suporta Pix nativamente no Brasil. Vamos criar uma edge function que cria uma sessão de checkout do Stripe com os métodos de pagamento `card` e `pix`, e conectar isso ao fluxo de checkout existente.

---

### O que será feito

1. **Edge Function `create-checkout-payment`**
   - Recebe os itens do carrinho, dados do cliente, endereço de entrega, e info de frete/presente
   - Cria o pedido na tabela `pedidos` + `itens_pedido` com status "pendente"
   - Cria uma sessão Stripe Checkout com `mode: "payment"` e `payment_method_types: ["card", "pix"]`
   - Usa `line_items` dinâmicos com `price_data` baseado nos itens do carrinho (já que são produtos variados, não preços fixos do Stripe)
   - Salva o `stripe_session_id` no pedido
   - Retorna a URL do Stripe Checkout para redirecionamento

2. **Atualizar `CheckoutPage.tsx` (Step 3 - Pagamento)**
   - Adicionar seleção visual do método: **Cartão** ou **Pix**
   - Ao selecionar Pix, mostrar desconto de 10% aplicado ao total
   - O botão "Confirmar e Pagar" na etapa de confirmação chama a edge function e redireciona ao Stripe Checkout

3. **Página de sucesso `/pagamento-sucesso`**
   - Nova página simples confirmando o pagamento
   - Limpa o carrinho após sucesso

4. **Atualizar `form` state** para incluir `metodo_pagamento: "card" | "pix"`

5. **Registrar rota** no `App.tsx` para `/pagamento-sucesso`

### Arquivos

| Ação | Arquivo |
|------|---------|
| Criar | `supabase/functions/create-checkout-payment/index.ts` |
| Criar | `src/pages/PagamentoSucessoPage.tsx` |
| Editar | `src/pages/CheckoutPage.tsx` |
| Editar | `src/App.tsx` |
| Editar | `supabase/config.toml` (verify_jwt = false) |

### Fluxo

```text
Checkout Step 3 (seleciona Cartão ou Pix)
  → Step 4 (Confirmação com resumo)
  → Clica "Confirmar e Pagar"
  → Edge function cria pedido + sessão Stripe
  → Redireciona ao Stripe Checkout (Pix ou Cartão)
  → Stripe processa pagamento
  → Redireciona para /pagamento-sucesso
  → Carrinho limpo, pedido registrado
```

### Notas
- STRIPE_SECRET_KEY já está configurado nos secrets
- Stripe Checkout lida com QR Code do Pix automaticamente
- O desconto de 10% para Pix será aplicado no `line_items` da sessão Stripe
- Não precisa de webhook — o pedido é criado antes do pagamento e pode ser verificado depois

