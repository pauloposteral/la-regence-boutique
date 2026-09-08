# Auditoria 0–100 — La Régence Boutique

Estado verificado hoje (08/09, 01h UTC): 13 cafés ativos (3 sem estoque), 3 pedidos, 1 assinatura ativa (Vitor) já com endereço e pronta para despachar, 0 falhas de e-mail registradas, 0 cupons ativos.

## Nota atual: 88/100

| Área | Nota | Situação verificada |
|---|---|---|
| Loja e catálogo | 92 | 13 cafés ativos, filtros, comparador, favoritos, quiz |
| Checkout e pagamento | 90 | Stripe ao vivo, frete dinâmico, cupons por RPC |
| Assinaturas | 92 | Endereço obrigatório antes do pagamento, ciclos, link por token, conferência diária |
| E-mails e avisos | 88 | Registro de envios, novas tentativas, aviso ao admin |
| Painel admin | 85 | 11 telas, exportação, aviso de pedido novo em tempo real |
| Segurança | 82 | 7 alertas do verificador do banco (funções internas abertas demais) |
| SEO e conteúdo | 86 | Sitemap, dados estruturados, blog; falta conteúdo novo |
| Confiança na loja | 70 | Falta 1 café sem estoque com aviso claro, avaliações reais, cupom de boas-vindas |

## O que tira pontos (ordem de correção)

1. **Funções internas do banco abertas** — 7 avisos: rotinas administrativas podem ser chamadas por visitantes ou por qualquer pessoa logada. Fechar o acesso, mantendo só as que o site precisa (`preview_coupon`, `redeem_coupon`, `has_role`, `get_user_points`).
2. **Três cafés ativos sem estoque** — hoje ainda entram no carrinho até o passo final. Marcar "Esgotado" no card e na página, desabilitar o botão e exibir o aviso de reposição.
3. **Nenhum cupom ativo** — criar cupom de boas-vindas para quem assina a newsletter (a captura existe, a recompensa não).
4. **Ciclo pronto para despachar sem lembrete** — hoje só o resumo diário avisa. Enviar aviso ao admin na véspera do prazo e destacar em vermelho no painel quando vencer.
5. **Sem aviso de envio ao cliente** — o modelo de e-mail existe, mas o botão "Marcar como despachado" não pede código de rastreio de forma obrigatória. Tornar rastreio obrigatório e disparar o e-mail no mesmo clique.
6. **Estoque não baixa automaticamente** — confirmar e, se faltar, descontar estoque quando o pagamento é confirmado, com registro.
7. **Avaliações vazias** — pedir avaliação já existe por e-mail; falta exibir "seja o primeiro a avaliar" e média por café na listagem.
8. **Página de rastreio pública** — cliente sem conta não consegue acompanhar o pedido por número + e-mail.
9. **Conteúdo do blog parado** — publicar 3 textos base (origem, moagem, métodos) ajuda busca orgânica.
10. **Sem página de status/erro amigável para pagamento recusado** — hoje volta ao carrinho sem explicação.

## O que já está impecável (não mexer)

- Fluxo de assinatura completo: endereço obrigatório, ciclos, link por token, conferência diária às 12h, resumo ao admin.
- Idempotência do webhook, limite de tentativas por minuto, registro de e-mails com novas tentativas.
- Identidade visual creme/dourado/marrom, botões arredondados, tipografia.
- Consentimento de cookies, sitemap automático, dados estruturados.

## Como eu executaria

Fase A (segurança e vendas travadas): itens 1, 2, 3, 6.
Fase B (operação de pedidos): itens 4, 5, 8, 10.
Fase C (conteúdo e conversão): itens 7, 9.

### Detalhes técnicos

- Item 1: migração com `REVOKE EXECUTE ... FROM anon, authenticated` nas funções de gatilho/auditoria (`audit_table_changes`, `award_points_on_delivery`, `handle_new_user`, `log_order_status_change`, `update_*`, `check_rate_limit`, `calculate_loyalty_tier`), mantendo `service_role`.
- Item 2: `estoque <= 0` desabilita `ProductCard`/`ProdutoPage`/`QuickViewModal` e mostra `BackInStockNotify`.
- Item 5: `AdminAssinaturas` e `AdminPedidos` — diálogo exigindo transportadora + código, gravando em `assinatura_ciclos`/`pedidos` e chamando `notify` com `subscription_shipped`/`order_shipped`.
- Item 6: verificar `stripe-webhook` em `checkout.session.completed`; se não houver baixa, aplicar decremento por item em transação e registrar em `admin_audit_log`.
- Item 8: rota `/rastreio` consultando `pedidos` por `order_number` + e-mail via edge function (sem expor dados por RLS).

Confirme a fase por onde começar, ou aprove para eu executar a Fase A.
