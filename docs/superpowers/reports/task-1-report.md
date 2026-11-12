# Task 1 report — TV player continuity, cinematic transitions and editing (2026-11-12)

Status: implemented and committed in the Lovable project (no production publish; Task 2 not started; no subagents).
Baseline: 85847ef36f123d1a9157f5f6ecaaa485785921d9 (working tree started at f11e69e "Work in progress").

## Migration
- `drizzle/migrations/0000_tv_videos_presentation.sql` — applied to the project's database (Lovable Cloud, shared by preview and published app).
- Additive only: nullable `transition_profile`, `transition_ms`, `palette`; `protect_qr`, `protect_text`, `protect_zoom` boolean NOT NULL DEFAULT false; CHECK constraints for allowed values and 600–1100 ms. No UPDATE/INSERT/DELETE, no RLS/grant change (existing admin policies govern writes).
- Post-check (read-only SQL): 33 rows, 18 active, 13 archived, all 33 with default/NULL presentation values; ids/order listed in the query result. No pre-migration snapshot was taken, so "unchanged" relies on the migration being ADD COLUMN only.
- The migration tool added drizzle-kit/drizzle-orm/postgres to package.json/bun.lock; these were reverted (npm lock regeneration produced ~10k-line churn) so both locks stay coherent with `npm ci`. `drizzle.config.ts`/`drizzle/` remain (not part of the app build).

## Modified/added files
- added `src/lib/tvPlaybackPolicy.ts` (+ test), `src/components/tv/AdjacentPreview.tsx`, `src/hooks/usePrefersReducedMotion.ts`
- modified `src/components/tv/{CinematicStage,TVPlayer,VideoManager}.tsx`, `cinema.css`, `src/lib/tvPlaylist.ts`, `src/integrations/supabase/types.ts` (regenerated)
- tests: `CinematicStage.test.tsx`, `TVPlayer.test.tsx`, `VideoManager.test.tsx`, `src/pages/VideoPage.sync.test.tsx` (two load/play assertions now count calls on the current element, because a prepared deck legitimately loads)
- docs: spec, plan, this report, `docs/tv-player.md`, `AGENTS.md`

## Validation (executed in sandbox)
- TV set: `bunx vitest run src/components/tv src/lib/tvPlaybackPolicy.test.ts src/lib/tvPlaylist.test.ts src/hooks/useTVVideos.test.tsx src/pages/VideoPage.sync.test.tsx src/pages/VideoUploadPage.test.tsx src/lib/tvUpload.test.ts src/lib/tvWorkerUpdate.test.ts` → 11 files, 146 tests passed.
- Full suite: `bunx vitest run` → 26 files, 275 tests passed, exit 0.
- TypeScript: `npx tsc -p tsconfig.app.json --noEmit` → exit 0.
- Production build: `npx vite build` → exit 0.
- ESLint on changed TV/policy files → 0 problems.

## Not performed
- No browser (Chromium/WebKit) playback run and no physical TV check in this task.
- No publish/deploy. Real devices' rVFC/getVideoPlaybackQuality behavior is untested beyond feature detection; pressure detection is measured-only and has not been observed on a TV.

## Concerns
- Default transition for existing rows changes from the previous 1200 ms scale+light reveal to the safe clean 700 ms dissolve (spec: unknown clips default safely).
- Prepared deck downloads the next MP4 in advance (bandwidth).
