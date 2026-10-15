# TV La Régence

User request, 15 October 2026: continuous horizontal product videos on the store's TV,
with server uploads controlled from a phone or computer.

- Player: `/video`; manager: `/video/enviar` (also linked in Admin).
- Existing Supabase login plus `has_role(auth.uid(), 'admin')` controls management.
- Storage: public `tv-videos`, MP4/WebM, 50 MiB per file, server-enforced MIME/size limit.
- Catalog: `tv_videos`, public SELECT only for active, unarchived rows; admin INSERT/UPDATE.
- The actual existing brand video seeds the playlist. All uploaded files are stored remotely.
- Ordering uses `sort_order`, then ID for deterministic ties. Playlist refreshes every minute.
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
