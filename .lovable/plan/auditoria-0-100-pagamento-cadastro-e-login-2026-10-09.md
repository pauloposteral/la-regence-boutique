# Auditoria 0–100 — Pagamento, Cadastro e Login

Nota atual: **81/100** (pagamento 84, cadastro 78, login 80). Itens abaixo foram conferidos no código hoje.

## O que já está bom (não mexer)
- Preço calculado no servidor (inclui o ajuste recente de promoção por tamanho), cupom validado no servidor, limite de 10 tentativas/minuto.
- Confirmação de pagamento com assinatura verificada, proteção contra evento repetido, baixa de estoque após pagar.
- Páginas de sucesso e de erro, login com Google, recuperação de senha, área da conta protegida.

## Problemas encontrados (ordem de correção)

**Pagamento**
1. **Pix dá desconto mas não oferece Pix** — quem escolhe Pix recebe 10% off, porém a tela do Stripe só aceita cartão. O cliente paga com cartão com desconto de Pix. Correção: ativar Pix no Stripe para pedidos Pix (requer Pix habilitado na conta Stripe; se não estiver, esconder a opção até habilitar).
2. **Pedido marcado como pago sem checar se foi pago** — o retorno do Stripe é aceito sem confirmar o status "pago". Com Pix isso marcaria pedidos ainda não quitados. Correção: só marcar pago quando confirmado, e tratar "Pix pago depois" e "Pix expirado".
3. **Endereço de retorno vem do navegador** — o link de volta após pagar usa o endereço informado pela requisição. Correção: aceitar só os domínios oficiais da loja.

**Cadastro**
4. Senha mínima de 6 caracteres e sem campo "confirmar senha" — subir para 8 e adicionar confirmação.
5. Sem aceite de Termos/Privacidade (LGPD) no cadastro — adicionar caixa obrigatória com links.
6. Mensagens de erro em inglês (ex.: "User already registered") — traduzir todas.
7. Sem opção "reenviar e-mail de confirmação" para quem não recebeu.

**Login / senha**
8. **Redefinição de senha pode falhar** — a página só aceita o link se ele vier num formato antigo; links no formato novo mostram "Link inválido". Correção: reconhecer o evento de recuperação oficial.
9. Login com Google volta direto para a área protegida e pode piscar para o login antes da sessão carregar — voltar para a página inicial do site e então seguir para a conta.
10. Após login, sempre vai para "Minha conta" — deveria voltar para onde o cliente estava (ex.: checkout).
11. Botão da página de nova senha está retangular (fora do padrão de botões arredondados).
12. Verificar no servidor de login: proteção contra senhas vazadas e confirmação de e-mail ligadas.

## Validação
- Teste ponta a ponta no navegador: cadastro, login, senha esquecida, Google, checkout cartão e Pix (modo teste), retorno de sucesso/erro.
- Testes automáticos para as regras: senha mínima 8, desconto Pix 10% só com Pix, pedido só vira "pago" quando o Stripe confirma.
- Boot em janela anônima.

## Sobre as ferramentas citadas
Superpowers, Context7 e Firecrawl: uso Context7 para conferir a documentação atual do Stripe/login durante a execução; Firecrawl não é necessário (nada externo a raspar).

## Detalhes técnicos
- `create-checkout-payment`: `payment_method_types: isPix ? ["pix"] : ["card"]` + `payment_method_options.pix.expires_after_seconds`; whitelist de `origin` (cafelaregence.com.br, www, lojalaregence.lovable.app, preview).
- `stripe-webhook`: em `checkout.session.completed` exigir `session.payment_status === "paid"`; adicionar `checkout.session.async_payment_succeeded` (mesmo fluxo de pago) e `async_payment_failed` (cancelar e devolver nada ao estoque, pois só baixa ao pagar). Eventos novos precisam ser habilitados no webhook do Stripe.
- `AuthPage`: zod (min 8, confirmação, termos), mapa de erros PT-BR, `supabase.auth.resend`, `redirectTo` em `?next=`; Google `redirectTo: window.location.origin` + guardar destino em sessionStorage.
- `ResetPasswordPage`: `onAuthStateChange` com `PASSWORD_RECOVERY` além do hash; botão `rounded-full`.
- `ProtectedRoute`: redirecionar para `/auth?next=<rota>`.
- `configure_auth`: habilitar checagem de senha vazada (HIBP).
