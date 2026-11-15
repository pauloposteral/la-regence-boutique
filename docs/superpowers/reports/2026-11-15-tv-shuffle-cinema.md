# TV La Régence — sorteio e cinema — 15/11/2026

Pedido de Paulo: conferir a randomicidade, criar transições e publicar por código.
Base: `3840bc7bf75792798fe8602bcba5a6eb6f162cf1`, `pauloposteral/la-regence-boutique`.
Projeto Lovable: `6b4d6b8b-a124-434c-8367-ff1b7d60a9c8`. Rota: `/video`.

## Diagnóstico e solução

- O player anterior selecionava a próxima fonte pela ordem cadastrada. Evitava duplicatas, mas não embaralhava. Leitura pública do catálogo em 15/11: 31 itens ativos.
- Agora a primeira fonte e as próximas são sorteadas entre as fontes ainda não selecionadas na rodada. Uma rodada nova exclui o último item da anterior da primeira escolha, quando há outra fonte saudável. Fonte duplicada continua contando apenas uma vez; item único repete normalmente.
- O sorteio reserva o próximo item por identidade da fonte. Progresso, polling, reordenação e troca do representante não refazem essa escolha. Novos itens entram antes de repetições; removidos/falhos deixam de ser candidatos. Falhas mantêm o cooldown já existente.
- Perfis sem escolha explícita alternam luz de estúdio, profundidade e dissolução. Luz inclui faixa diagonal em movimento; profundidade aproxima 3,5% durante a entrada. Perfis explícitos, pausa, proteção de QR/texto/zoom, YouTube e redução de movimento são respeitados. Sob pressão medida, volta à dissolução simples.
- Mantém somente dois decks e revela o próximo a partir do quadro apresentado. Catálogo, arquivos, duração, estados ativo/pausado e ordem administrativa não são alterados.
- Painel oferece Cinema automático (persistido como NULL, compatível com o schema), além dos perfis manuais. Prévia usa a mesma política e esclarece que a TV sorteia sua própria sequência.
- Worker `v5-tv-shuffle-cinema-20261115`: entrega o update às páginas `/video` pelo mecanismo existente, preservando outros fluxos e caches de mídia.

## Validação antes da integração

- Testes reproduziram a ordem fixa, reserva instável e falta de perfis automáticos antes da correção.
- 293 testes em 27 arquivos passaram. Inclui 100 rodadas com 31 fontes: 3.100 seleções, cada fonte uma vez por rodada, 100 ordens distintas, nenhuma repetição consecutiva na virada.
- Integração cobre promoção do elemento pré-carregado, polling, reordenação, pausa, falhas, aliases e cooldown.
- TypeScript e build de produção passaram. Build mantém aviso preexistente de bundles acima de 500 KB.
- Dois testes antigos do worker falhavam por ignorarem importScripts, já presente na base. O harness agora executa o companion real no mesmo contexto VM. A tipagem preexistente em tvOfflineStore foi corrigida com comparação explícita `ok === false`, sem cast nem alteração de comportamento.
- Chromium local não iniciou por limitação de socket no ambiente. Conferência visual/reprodução via navegador de nuvem, com resultado após integração registrado abaixo. Não representa teste da televisão física.

## Referências técnicas

- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation-play-state
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion

## Publicação

Pendente neste commit: conferir sincronia main/Lovable, publicar e confirmar revisão pública.
