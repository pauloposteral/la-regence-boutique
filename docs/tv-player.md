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
- No real administrative video upload has been performed, and no physical TV/browser
  playback was verified. Local Chromium installation failed; the cloud browser cannot
  reach localhost. These are explicit verification limits, not claims of success.
- Full-repository lint reports 304 existing errors and 20 existing warnings; the new
  feature code is clean. Existing build warnings concern the old Browserslist dataset
  and large unrelated app bundles.
- The premium UI static scan reports pre-existing global form/ownership inconsistencies;
  the new routes use shared dialogs, localized status/error states and deliberate native select ownership.
- Implementation is committed on `feat/tv-video-player`. On 15 October 2026 at 08:53
  (America/Sao_Paulo), the user approved publishing the code to the public GitHub
  repository and deploying through Lovable. The GitHub connector confirms admin/push
  access for account `pauloposteral`.
