# Programação da TV: ordem visual e atualização automática

## Objetivo

O proprietário quer mudar facilmente a ordem dos vídeos do Café La Regence e fazer a TV receber novos envios automaticamente. O painel existente é `/video/enviar`; a TV usa `/video`. A alteração amplia esse fluxo existente, com uma operação transacional nova para salvar a sequência completa.

## Experiência

O botão **Organizar ordem** abre a sequência completa dos vídeos não arquivados, com capas, posições, nomes e identificação dos pausados. Arrastar pela alça, usar setas ou escolher uma posição produz um rascunho local. **Salvar ordem** confirma todas as posições de uma vez; **Cancelar** descarta o rascunho. Busca, filtro e paginação não recortam a sequência organizada.

Uploads ativos entram na programação automaticamente após a confirmação do cadastro. A TV conectada recebe a lista e mantém o vídeo atual até o próximo avanço normal. O novo vídeo toca quando chegar sua vez. Alterações de ordem conservam o histórico de fontes já selecionadas no ciclo. Pausar/arquivar mantém a semântica existente de retirar o item da TV.

## Persistência e concorrência

`reorder_tv_videos(p_ordered_ids uuid[], p_expected_ids uuid[])` executa como o chamador, exige o papel administrativo existente e bloqueia brevemente escritas na tabela para validar o snapshot e salvar posições inteiras de 1 a N numa transação. A lista deve conter exatamente uma vez todos os IDs não arquivados, incluindo pausados. Um snapshot desatualizado falha sem gravar nenhuma posição. Somente `sort_order` muda. RLS, arquivos e dados comerciais permanecem sob as regras existentes.

O editor detecta alterações remotas de membros/ordem, preserva o rascunho e oferece **Recarregar ordem**. Edição de nome, enquadramento e duração não envia mais `sort_order`; rascunhos abertos não são substituídos pelo refresh automático.

## Sincronização

O hook mantém as queries pública e administrativa separadas. Eventos `postgres_changes` de `public.tv_videos` invalidam a consulta ordenada com agrupamento de 250 ms; `SUBSCRIBED` reconcilia conexão inicial e reconexões. A migração habilita a tabela na publicação existente `supabase_realtime`.

Ambas as consultas usam recuperação periódica a cada 15 segundos, inclusive em segundo plano, e atualização forçada ao reconectar ou retornar à aba. O polling continua necessário para eventos perdidos e linhas que deixam de ser legíveis pela RLS pública. Falhas de consulta preservam a última lista válida. A sincronização não desmonta o player e não aplica payloads de eventos diretamente na sequência.

## Restrições

- Reutilizar React 18, TanStack Query 5, Supabase JS 2, Framer Motion e componentes existentes; nenhuma dependência de produto nova.
- Manter cores e tipografia de `DESIGN.md`, texto em português e controles utilizáveis por toque e teclado.
- Não prometer confirmação de reprodução remota nem prazo absoluto enquanto a TV estiver sem conexão ou suspensa.
- Não modificar a programação real durante a verificação; testes de escrita no banco ficam em transações revertidas.

## Verificação

Cobrir organização além da página 12, cancelamento, falha e conflito, proteção do rascunho, isolamento da ordem em edições, eventos/reconexão/polling/cleanup, preservação de dados em erro e invariantes existentes do player. Verificar transação e autorização da função com rollback, executar suíte, TypeScript, lint do escopo e build, revisar independentemente e conferir o painel em tamanhos de celular e computador.
