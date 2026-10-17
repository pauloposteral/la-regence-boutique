# TV Playlist Order and Sync Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for implementation and an independent final review. The hook task is delegated in parallel with exclusive file ownership.

**Goal:** Organizar visualmente a programação e atualizar automaticamente as TVs conectadas.

**Architecture:** Um editor de sequência chama uma função transacional de ordenação. O hook existente reconcilia eventos, polling e reconexões sem substituir o player.

**Tech Stack:** React 18, TypeScript, Supabase JS 2, TanStack Query 5, Framer Motion, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-17-tv-playlist-order-sync-design.md`

## Global Constraints

- Nenhuma dependência de produto nova; preservar tokens, RLS, arquivos e dados comerciais.
- Atualização periódica de 15 segundos; agrupamento de eventos de 250 ms.
- Ordenar todos os não arquivados, incluindo pausados; alterar somente `sort_order`.
- Manter o vídeo atual e o histórico de fontes no player existente.

## Review Focus

- Upload ou reordenação concorrente deve invalidar snapshots antigos sem gravação parcial.
- Um editor de metadados aberto deve preservar o rascunho e não desfazer outra ordem.
- Busca e paginação não podem omitir vídeos da ordem salva.
- Reconexão curta e evento ausente devem reconciliar a lista, mesmo com cache fresco.
- A confirmação do cadastro não deve prometer início imediato de reprodução.

### Task 1: Ordenação visual e transacional

**Files:** criar `src/components/tv/PlaylistOrderEditor.tsx` e migração `tv_playlist_order_sync`; alterar `VideoManager.tsx`, seus testes e `src/integrations/supabase/types.ts`.

**Interfaces:** `PlaylistOrderEditor({videos, refresh, onClose})`; RPC `reorder_tv_videos({p_ordered_ids, p_expected_ids})` retorna void ou erro `40001` para snapshot desatualizado.

- [x] Escrever regressões do painel para ordenação completa, persistência única, cancelamento/falha/conflito e rascunhos preservados; confirmar falhas.
- [x] Implementar editor com arrastar, setas e seleção de posição; salvar via RPC e não incluir `sort_order` na edição comum.
- [x] Implementar função invoker administrativa, validação do snapshot, gravação atômica e publicação Realtime aditiva.
- [x] Rodar testes do painel e verificação transacional da função com rollback.

### Task 2: Sincronização e recuperação

**Files:** `src/hooks/useTVVideos.ts` e `src/hooks/useTVVideos.test.tsx` (agente delegado).

**Interfaces:** conservar `useTVVideos(admin = false, enabled = true)` e chaves `['tv-videos', 'public'|'admin']`.

- [x] Reproduzir ausência de eventos, assinatura e reconexão imediata em testes com QueryClient real.
- [x] Implementar invalidation exata, assinatura, polling, focus/reconnect e limpeza; preservar dados anteriores.
- [x] Rodar testes específicos e integrar sem alterar as instâncias do player.

### Task 3: Verificação e entrega

**Files:** documentação do fluxo em `docs/tv-player.md`; apenas correções do escopo após revisão.

- [x] Executar suíte completa, TypeScript, ESLint do escopo, diff-check e build de produção.
- [x] Conferir interação e layout do editor e fluxo de reprodução; revisar o diff independentemente.
- [ ] Registrar evidências, enviar a branch e entregar a alteração pelo GitHub; aplicar/publicar somente a revisão validada.

Gate anterior ao envio: 122 testes / 12 arquivos, TypeScript, lint do escopo, build e diff-check aprovados. QA local com 20 verificações em desktop/celular, revisão independente sem findings restantes e teste SQL transacional aprovado. A migração foi aplicada com o catálogo intacto. A entrega e a publicação são registradas no PR correspondente.
