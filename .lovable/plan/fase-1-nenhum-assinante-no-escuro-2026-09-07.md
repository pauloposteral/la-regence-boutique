# Fase 1 — Nenhum assinante no escuro

## Diagnóstico confirmado (li o código)

- **DP-01 resolvido:** quem está no ar em `cafelaregence.com.br` é **este app** (Vite + React + Supabase), não um projeto Next.js. Todo o trabalho acontece aqui.
- `create-subscription-checkout` cria a sessão de pagamento **sem nenhuma etapa de endereço** — confirmado no código. Foi exatamente o que aconteceu com o Vitor.
- O webhook do Stripe cria/atualiza a assinatura no banco, mas **não dispara nenhum e-mail** — nem para o cliente, nem para você.
- A tabela de assinaturas **não tem campo de endereço** nem histórico de entregas (ciclos).
- A página de retorno após o pagamento leva para a conta, sem tela de sucesso real da assinatura.
- Já existe base reaproveitável: envio de e-mails com layout da loja, endereços do cliente, idempotência de webhook e painel admin de assinaturas.

## O que vou construir

### 1. Banco de dados
- Endereço de entrega e telefone de contato na assinatura.
- Nova tabela de **ciclos de entrega**: um por mês pago, com cópia congelada do endereço e das preferências, prazo-limite de despacho, transportadora, rastreio e situação (aguardando endereço / pronto para enviar / enviado / com problema).
- Nova tabela de **registro de avisos**: cada e-mail enviado, para quem, situação, tentativas e erro.
- Nova tabela de **links de ação** (token de uso único, com validade de 7 dias) para o cliente informar o endereço sem precisar entrar na conta.
- Regras de acesso: cliente vê só o que é dele; você vê tudo.

### 2. Assinar agora → passo "Onde entregar" (obrigatório)
- Antes de ir para o pagamento: escolher um endereço salvo ou cadastrar um novo, com busca automática por CEP, número obrigatório, telefone e destinatário.
- O pagamento só é criado com endereço válido. O endereço vai junto para o Stripe (aparece no recibo), mas o dono da verdade é o nosso banco.

### 3. Ativação e avisos automáticos
- Quando o pagamento é confirmado: a assinatura fica ativa, o ciclo do mês é criado com o prazo calculado em **3 dias úteis** (pulando fins de semana e feriados nacionais, inclusive os móveis, no horário de São Paulo) e saem dois e-mails em até 2 minutos:
  - Cliente: "Sua assinatura La Régence está confirmada ☕" com plano, café, moagem, endereço, próxima cobrança e a data por extenso ("sai daqui até quinta-feira, 10/09").
  - Você: "[NOVA ASSINATURA] nome · plano · valor" com tudo que precisa para torrar e despachar, e aviso em destaque quando faltar endereço.
- Reenvio automático em caso de falha (até 5 tentativas) e registro de tudo.
- Nada duplica se o Stripe reenviar o mesmo evento (a proteção já existe e será estendida aos ciclos e e-mails).

### 4. Resgate das assinaturas já pagas sem endereço (caso do Vitor)
- E-mail "Falta só o endereço" com link direto para uma página pública onde ele preenche em um minuto.
- Ao salvar: entra na fila de torra, prazo recalculado, confirmação para ele e aviso para você.
- Lembretes em D+1 e D+3; em D+7 sem resposta o ciclo é marcado como problema e você é avisado.
- Uma varredura única marca todas as assinaturas antigas sem endereço.

### 5. Página de sucesso de verdade
- Após pagar: mostra a situação real (confirmado / aguardando pagamento / falhou), o resumo, o endereço e a data-limite de despacho. Se o aviso do Stripe atrasar, ela mostra "confirmando pagamento" e se atualiza sozinha.
- Se por algum motivo faltar endereço, o formulário aparece ali mesmo.

### 6. Painel admin de assinaturas (evolução da tela atual)
- Colunas novas: situação do ciclo, tem endereço?, prazo com semáforo (no prazo / hoje / vencido).
- Filtros: a despachar, sem endereço, com problema.
- Tela de detalhe: cliente, preferências, endereço (editável), histórico de ciclos, e-mails enviados com botão de reenviar, e botão **"Marcar como despachado"** exigindo transportadora e rastreio — que dispara o e-mail "Seu café saiu pra entrega 📦".
- Exportar CSV da lista filtrada.

### 7. Minha assinatura (área do cliente)
- Dentro da conta: situação, plano, próxima cobrança, endereço editável, preferências editáveis (valem para o próximo ciclo não despachado) e histórico de entregas com rastreio. Link em todos os e-mails.

### 8. Conferência diária automática
- Uma vez por dia o sistema compara Stripe × banco e procura: assinatura ativa sem endereço, sem e-mail de confirmação, ou ciclo com prazo vencido. Toma a ação cabível e te manda um resumo. Você descobre o problema antes do cliente.

### 9. Texto da página de assinatura
- Trocar "primeira entrega em até 7 dias" por "despacho em até 3 dias úteis + prazo dos Correios", que é verdade para qualquer região (DP-10).

## Ordem de execução

1. Banco (campos, ciclos, avisos, tokens, permissões).
2. Cálculo de dias úteis/feriados + serviço único de envio com registro e reenvio.
3. Webhook: ativação, criação do ciclo, os dois e-mails.
4. Passo de endereço no checkout da assinatura.
5. Página de sucesso real.
6. Resgate de endereço (e-mail + página com link) e varredura das antigas.
7. Painel admin (lista, detalhe, despacho, reenvio) + e-mail de despacho.
8. Minha assinatura.
9. Conferência diária agendada.
10. Testes ponta a ponta: com endereço, sem endereço, evento repetido, feriado.

## Detalhes técnicos

- Novas tabelas `assinatura_ciclos`, `notification_log`, `action_tokens`; colunas `endereco_entrega jsonb`, `endereco_id`, `telefone_contato` em `assinaturas`. GRANTs + RLS em todas.
- Utilitário `src/lib/businessDays.ts` (feriados fixos + móveis por Gauss/Butcher) com testes unitários; mesma lógica espelhada em `supabase/functions/_shared/businessDays.ts`.
- `_shared/notify.ts`: envelopa `send-email`, grava em `notification_log`, retry com backoff.
- Novos templates em `send-email`: `subscription_confirmed`, `subscription_address_needed`, `subscription_shipped`, `admin_new_subscription`, `admin_reconciliation`.
- Novas edge functions: `subscription-address-token` (validar/gravar via token, com rate limit) e `subscriptions-reconcile` (cron diário via pg_cron).
- `create-subscription-checkout` passa a exigir `enderecoId` e envia `shipping_address` ao Stripe.
- Stripe webhook: em `customer.subscription.created` e `invoice.paid`, cria o ciclo (único por período) e chama `notify`.
- Frontend: `SubscriptionAddressStep` em `AssinaturaPage`, `/assinatura/sucesso`, `/assinatura/endereco?token=`, aba "Minha assinatura" em `ContaPage`, detalhe em `AdminAssinaturas`.

## Fora desta entrega

Fase 2 (renovação, falha de cobrança, WhatsApp, Sentry, self-service completo) e Fase 3 (rastreio automático, NPS, conteúdo do café do mês) ficam para depois — mas a estrutura de avisos já nasce pronta para elas.

## Ações de hoje, fora do código

1. Mandar agora a mensagem para o Vitor (o texto que você escreveu está ótimo; prazo quinta, 10/09, está correto pelo cálculo de dias úteis com o feriado de hoje).
2. No painel do Stripe: ligar o recibo por e-mail ao cliente e o aviso de nova assinatura para o seu Hotmail, como paliativo.
3. Conferir no Stripe se há outros assinantes na mesma situação — a varredura do item 4 também vai encontrá-los.
4. Separar o WhatsApp da loja online do bot do delivery (ou criar regra no bot).
