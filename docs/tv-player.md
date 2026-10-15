# TV La Régence

User request, 15 October 2026: continuous horizontal product videos on the store's TV,
with server uploads controlled from a phone or computer.

- Player: `/video`; manager: `/video/enviar` (also linked in Admin).
- Existing Supabase login plus `has_role(auth.uid(), 'admin')` controls management.
- Storage: public `tv-videos`, MP4/WebM, 50 MiB per file, server-enforced MIME/size limit.
- Catalog: `tv_videos`, public SELECT only for active, unarchived rows; admin INSERT/UPDATE.
- The actual existing brand video seeds the playlist. All uploaded files are stored remotely.
- Ordering uses `sort_order`, then ID for deterministic ties. Playlist refreshes every 15 seconds.
- Archiving removes a video from the playlist but preserves the source object.
- Video framing defaults to contain. Cover intentionally crops and never stretches.
- Muted autoplay and viewport fill work immediately. Browser fullscreen and audio may need
  a user gesture. Enter/F requests fullscreen; Space pauses, Right skips, M toggles sound.
- Controls hide after 4.5 seconds. Playback errors skip the broken item; a 30-second
  progress watchdog skips stalled media; exhausted playlists retry after 30 seconds.
- Wake lock is best effort, depending on the browser and TV power settings.
- No offline media-download guarantee: playback requires connectivity.

## Implementation and verification

1. Read the actual routes, admin guard, Storage policies and brand asset.
2. Test playlist ordering, looping, errors and upload limits before implementing helpers/player.
3. Add server RLS, Storage rules, manager and lazy routes; retain commerce behavior.
4. Run full tests, TypeScript, production build, focused lint and browser checks.
5. Push reviewed changes to GitHub and publish the same revision through Lovable.

TV-specific components inherit runtime design tokens documented in `DESIGN.md`.
Use the shared Sonner/AlertDialog primitives for feedback and archive confirmation.
Permission and data lifecycle rules originate in the migration, not client-side UI checks.

## Verified state — 2026-10-15

- 23 unit/component tests pass, including playback looping, media failures, stall recovery,
  pause/resume, upload constraints, loading, signed-out redirect and customer access denial.
- TypeScript app check, feature-scoped ESLint, `git diff --check`, and production build pass.
- Public playlist read returns HTTP 200 with the existing brand film.
- Anonymous Storage upload is rejected by row-level security.
- Database transactions verify admin INSERT/read/UPDATE and deny customer INSERT/UPDATE;
  all test changes were rolled back. RLS and the real Storage bucket are configured.
- Public browser playback was verified after deployment: 1920×1080 brand film,
  muted autoplay, readyState 4, no media errors, no page scrolling, repeated looping
  beyond the 8-second film duration, and pause/resume preserving position.
- `/video/enviar` correctly redirects signed-out visitors to
  `/auth?next=%2Fvideo%2Fenviar`. No real administrative video upload or physical
  television test has been performed. The cloud browser declined native fullscreen;
  the player displayed its fallback instruction to use browser fullscreen.
- Full-repository lint reports 304 existing errors and 20 existing warnings; the new
  feature code is clean. Existing build warnings concern the old Browserslist dataset
  and large unrelated app bundles.
- The premium UI static scan reports pre-existing global form/ownership inconsistencies;
  the new routes use shared dialogs, localized status/error states and deliberate native select ownership.
- Implementation is committed on `feat/tv-video-player`. On 15 October 2026 at 08:53
  (America/Sao_Paulo), the user approved publishing the code to the public GitHub
  repository and deploying through Lovable. The GitHub connector confirms admin/push
  access for account `pauloposteral`.

## Published release

- Public player: https://cafelaregence.com.br/video
- Upload entry point: https://cafelaregence.com.br/video/enviar
- GitHub pull request: https://github.com/pauloposteral/la-regence-boutique/pull/1 (merged)
- Deployed source revision: `d272ab99e4324cef2b8e5fa20a95d69a2a9bdccf`.
- Lovable deployment: `5e08f309-bfc8-40bc-98c0-784922cfd703`, confirmed by the
  custom domain's `x-deployment-id` response header and live route behavior.
- Browser verification: 15 October 2026, approximately 09:00 America/Sao_Paulo.
- Screenshot of the actual published player: `evidence/tv-live-1792065651745.jpg`.

## YouTube e transições — 15/10/2026

O painel `/video/enviar` agora aceita arquivos e links do YouTube na mesma programação. Links watch, youtu.be, Shorts, embed e live são normalizados para um ID de 11 caracteres; playlists e outros domínios são recusados. A migração `20261015122324_tv_youtube_sources.sql` mantém os vídeos antigos como `file`, valida as fontes no banco e preserva as políticas administrativas existentes.

O player usa a IFrame API oficial do YouTube, com origem do site, som inicialmente desligado, término/erro e bloqueio de autoplay tratados. Não baixa vídeos do YouTube. Conteúdo indisponível, incorporação bloqueada ou sem progresso é pulado; anúncios e controles pertencem ao YouTube. Vídeos ao vivo continuam até terminar ou o operador avançar. O enquadramento do YouTube permanece inteiro.

A troca mantém o quadro anterior até o próximo conteúdo começar e faz uma fusão de 900 ms. Arquivos têm aproximação discreta de 1,8%; a preferência por movimento reduzido remove a animação. O watchdog de 30 segundos, recuperação, controles e proteção administrativa permanecem.

Mídias de teste: os dois MP4 enviados pelo proprietário foram importados para `tv-videos/importados/`, ordens 10 e 20. O anúncio Tornado Del Leche foi composto em Higgsedit com imagem ilustrativa baseada no cardápio, título Playfair Display, ingredientes DM Sans, fundo espresso/dourado, entrada do produto/texto e saída suave. Exportação: 10,000 s, 1920×1080, 30 fps, H.264/yuv420p, sem áudio, MP4 faststart (~3,7 MB). Ingredientes: blend de sorvetes, doce de leite e Ovomaltine. Sem preço.

Validação local: parser de URLs, cadastro/salvamento/repetição após erro, mistura das fontes, contrato da API oficial, manutenção do quadro anterior, descarte de eventos antigos, loop, erro, autoplay, pausa e watchdog. A validação física do navegador da televisão continua sendo necessária para suas restrições específicas de fullscreen/autoplay.

Publicação confirmada em 15/10/2026: PR #2 integrado, commit `dd20d634274e331043bfb2c700cdeec7e8f875a8`, deployment `5f3df00d-404a-4f1d-afba-63ec17122c5d`. O domínio retornou HTTP200 com esse x-deployment-id e entry `index-CqN5GEL5.js`, correspondente ao build testado. Suite final: 43 testes aprovados; TypeScript, lint do escopo e build aprovados. Leitura pública anônima confirmou os quatro itens ativos.

No navegador público, os decks cinematográficos foram observados: arquivo anterior pausado e invisível, Tornado reproduzindo com readyState4, duração10s e sem scroll. Pausa/reprodução e avanço manual foram exercitados. Screenshot `TV-Tornado-publicado.jpg` registra o anúncio no player publicado. Vídeo exportado também foi decodificado integralmente pelo FFmpeg sem erros. Os testes do contrato YouTube usam um adaptador simulado; nenhum link do proprietário foi fornecido para validação de incorporação real. A revisão independente encontrou retomada de timestamp, pausa oficial e metadados desatualizados; os três foram corrigidos e cobertos por regressões, incluindo seek0 sem autoplay enquanto pausado.

## Auditoria de sequência e painel — 15/10/2026

Novos testes reproduziram duas falhas de recuperação: sem o evento `ended`, o código anterior não avançava ao atingir a duração; `timeupdate` repetido na mesma posição renovava indevidamente o watchdog. O player agora verifica posição/fim por evento e por sondagem de 500 ms, ignora falso progresso e emite término uma única vez. O autoplay nativo e a retomada ao ficar pronto estão explícitos. Isso corrige as fragilidades reproduzidas, sem presumir que já se reproduziu o problema no aparelho físico do proprietário.

Cada item pode limitar sua janela na TV (`max_duration_seconds`,1..3600, nulo=inteiro). O limite usa tempo realmente reproduzido e respeita pausa; não depende de esperar o fim do arquivo. A origem e os créditos dos clipes externos ficam visíveis no painel. `fallback_url` oferece uma versão compatível quando o arquivo principal falha ou para de avançar; apenas uma tentativa de fallback precede o descarte. Os limites e URLs HTTPS são validados no banco, sem alteração da RLS.

O painel oferece busca local sem acentos, filtros Todos/Ativos/Pausados/Arquivados,12itens por página, prévias sob demanda, arquivamento com confirmação, restauração sempre pausada e link `/video?iniciar=<id>` para testar um item ativo. Itens pausados permanecem fora do player público. O player mostra posição na sequência, tempo e estado automático/pausado, barra discreta e botão Atualizar programação. A consulta pública atualiza a cada15segundos, inclusive em segundo plano.

Contrato de UI do escopo: forms seguem campos nativos com validação inline/noValidate; enquadramento e filtros usam select nativo; confirmação pertence a AlertDialog; feedback pertence a Sonner; CRUD administra somente `tv_videos` com a autorização existente; arquivar preserva o arquivo e restaurar não reativa automaticamente. Scroll fica no documento do painel e no viewport exclusivo da TV. Cores/tipografia continuam nos tokens existentes de DESIGN.md,src/index.css,tailwind.config.ts. A busca e os filtros do painel são transitórios nesta ferramenta de uma página.

O proprietário escolheu "4K automático" para os dez novos clipes. A origem escolhida é Pexels com arquivos MP4 públicos e referência/crédito por item; não são apresentados como vídeos virais nem como downloads do Instagram. A resolução real foi verificada com ffprobe, porque alguns URLs chamados4K entregaram1440p e foram rejeitados. Os originais têm15segundos ou mais; a janela programada será15s por item. O Tornado arquivado pelo proprietário permanece arquivado.

## Publicação e conferência da auditoria — 15/10/2026

PR #3 integrado em `ffc4130569557cb7757458cb25a154ea2642791d`. Publicação única no Lovable: `c8f7088b-0a80-4f4a-9ac8-21a8294ac47f`. O domínio retornou HTTP200, esse deployment no cabeçalho e entry `index-CiiqbgOW.js`, igual ao build validado. São64 testes aprovados; TypeScript, lint do escopo e build aprovados.

Os dez itens novos foram ativados após publicar, todos com janela15s, origem/crédito Pexels e fallback1080p. Total:14ativos e1arquivado; o Tornado arquivado pelo proprietário não foi reativado.

No navegador público, a sequência avançou sem interação do filme da marca para os arquivos enviados e para os novos clipes. O primeiro novo vídeo reproduziu4096×2160; foi pausado em15,002s (duração original15,516s), entrando o próximo3840×2160. Mais adiante, o clipe de extração original22,856s foi pausado em15,046s e entrou o seguinte4096×2160, ordinal11de14. Os decks mostraram opacidades0/1 e fusão CSS900ms. Screenshot de evidência: `TV-4K-auditoria.jpg`. A sessão administrativa autenticada e o aparelho físico da televisão não foram exercitados; cobertura administrativa por testes de componentes e autorização existente preservada.

## Correções complementares da revisão — 15/10/2026

A revisão automática do PR3 apontou dois casos reproduzidos por cinco regressões: ordem999999 em item arquivado podia gerar upload com ordem inválida, e atualização manual podia anunciar sucesso antes de terminar ou mesmo após falhar. Arquivos e YouTube agora calculam a próxima ordem ignorando arquivados e limitando ao máximo permitido; a atualização manual aguarda a promessa do refetch (throwOnError), bloqueia duplicatas e mostra falhas mantendo o vídeo atual. Suite completa:69testes aprovados; TypeScript, lint do escopo, build e revisão independente aprovados. Sem novas alterações no banco nem na programação.

## Auditoria de repetição — 15/10/2026

Leitura em produção:14cadastros ativos com14URLs distintas;1arquivado preservado. A sequência estável já fazia loop, mas não havia identidade de fonte nem memória do ciclo: duas linhas com a mesma mídia passavam duas vezes, reordenar podia antecipar um vídeo já visto, remover o atual podia voltar ao primeiro e inserir um item antes do primeiro selecionado podia reiniciar a reprodução. Trocar o cadastro representante de uma fonte duplicada também remontava o deck. Esses casos foram reproduzidos antes das correções.

A sequência agora mantém a ordem do painel e um conjunto de fontes selecionadas no ciclo. Prioriza as ainda não selecionadas; atualizações e inserções preservam o histórico. Quando todas as fontes disponíveis tiveram uma vez, começa outro ciclo. O cadastro do vídeo inicial fica fixado, evitando mudança ao inserir algo antes dele. Remoção ou desativação do atual seleciona uma fonte ainda não vista. Falhas são descartadas e o fallback compatível continua com uma tentativa. Um único vídeo disponível repete para manter a TV ativa.

Identidade: YouTube por youtube_id; arquivo por URL normalizada, sem fragmento e preservando query significativa. Cadastros duplicados ficam intactos; apenas a sequência deduplica, mantendo o primeiro ativo na ordem. O deck também usa essa identidade, preservando posição ao mudar o representante; a fonte efetiva normaliza a URL preservando o fragmento original (por exemplo #t=30). Fragmentos são ignorados apenas na chave de deduplicação. O deck inicializa a fonte uma vez por identidade e mantém a versão compatível selecionada em atualizações de metadados. Não há comparação de conteúdo/hash: arquivos iguais em URLs diferentes continuam distintos. URLs relativas e absolutas não são unificadas. Histórico fica na memória da página e termina ao recarregar/fechar; não sincroniza diferentes televisões.

Regressões cobrem arquivo duplicado, mesmoIDYouTube com links diferentes, queries de arquivos distintos, reordenação sem repetição, remoção do atual, inserção sem reinício, duplicado na fila, troca do representante sem remontar/recarregar, preservação do ciclo no refresh, inserção antes de repetir e recuperação após falhas. Suite completa83testes aprovada; TypeScript, lint do escopo e build aprovados; revisão independente sem bloqueios. Sem alterações de banco ou cadastros nesta auditoria.

Complemento da revisão automática: teste reproduziu perda de #t=30 no src, corrigida preservando o fragmento na reprodução inicial. Teste adicional percorre14fontes e confirma14URLs únicas antes do retorno ao primeiro. Publicação inicial da proteção: PR5, commit46b8c942fe50b48dbc4cde5c76a346128b20f06a, deployment190e4476-6208-4af4-9d68-a4a7eb1b489f, entryindex-Zm2JvMaW.js. Na conferência pública foram observadas trocas automáticas crescentes do4ºao13ºitem e retomada posterior do início, sem erros de mídia nos snapshots. A amostragem não capturou todos os itens na virada; a verificação completa de unicidade do ciclo é coberta pelo teste de componentes. Televisão física não exercitada.


## Capas e lista compacta — 15/10/2026

O painel exibe uma capa 16:9 por vídeo, com título, ordem, duração e estado em linhas compactas. Editar abre somente o formulário daquele item; a prévia de mídia só é montada ao solicitar. Busca, filtros, paginação de12itens, confirmação de arquivamento e restauração pausada permanecem. Salvar fecha o editor apenas após sucesso e devolve o foco ao botão Editar; falhas preservam o rascunho.

Foram extraídos quadros reais dos15arquivos existentes em JPEG320×180, cerca de180KB no total, em public/tv-thumbnails. A coluna opcional poster_url referencia essas capas, inclusive a do Tornado arquivado. A atualização não altera a programação:14ativos e1arquivado. YouTube usa a miniatura oficial porID; capa ausente ou indisponível mostra fallback estável.

Novos uploads capturam a capa localmente pelo navegador, com prazo de10s, e enviam JPEG ao bucket tv-videos com a sessão administrativa existente. O envio tem cancelamento efetivo e timeout15s; limpeza de objetos é best-effort e não prende a interface. Falha da capa permite salvar o vídeo sem capa. A migração20261015174500 adiciona poster_url com validação HTTPS/caminho local e permite image/jpeg no bucket, preservando limite50MB e RLS administrativa.

Validação:95testes aprovados, incluindo lista compacta, imagens com erro, busca/filtros, edição, foco após salvamento assíncrono, geração de JPEG, cancelamento e timeout. TypeScript, lint dos arquivos do escopo e build aprovados. A interface administrativa autenticada não foi exercitada em navegador nesta sessão; comportamento coberto por testes de componentes.
