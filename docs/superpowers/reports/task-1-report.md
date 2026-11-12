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

---

## Fix round 1/5 — independent review (base 37f85ae20640982a31b3b2685b5fcb016bf068ed)

Scope: the seven review findings only. No deploy, no Task 2, no row updates, no new migration, no dependency or lock changes, no subagents.

| # | Finding | Correction |
|---|---------|------------|
| 1 | Protected QR/text cropped | `resolveFit()` in the shared policy returns `contain` when `protect_qr`/`protect_text`; FileDeck uses it; `VideoThumbnail` uses `object-contain` for protected rows. Stored `fit` untouched. |
| 2 | Light over protected/YouTube outgoing | `resolvePairPresentation(incoming, outgoing)` suppresses the full-stage light when the outgoing participant is protected or YouTube; saved profile/duration kept. Stage and `AdjacentPreview` both use it. |
| 3 | First promotion seeked to 0 | FileDeck tracks `everSelected`; first promotion of a prepared deck keeps its position (e.g. `#t=10` → 10); later reselection/restart still seeks 0. Fragment stays in `src`, ignored only for dedup identity. |
| 4 | 30s blanket cooldown clear | Removed the all-failed 30s `clear()`; the existing next-expiry effect re-enables each source at its own expiry. Operator refresh still clears explicitly. |
| 5 | rVFC/timer survived whole-stage unmount | `cancelReady()` invalidates the token, clears the 250ms timer and calls `cancelVideoFrameCallback` when supported; runs on unmount, source change, deselection and pause. Confirmed defect was whole-stage unmount; ordinary replacement already passed and keeps a regression test. |
| 6 | Inherited enum names accepted | `isProfile`/`isPalette` use own-property membership; `constructor`/`toString`/`__proto__`/`hasOwnProperty` fall back to clean/neutral/700ms. |
| 7 | Unrelated auth change | `src/integrations/supabase/previewAuthStorage.ts` restored byte-exact to 85847ef (`git diff 85847ef -- <file>` empty). |

Modified files: `src/lib/tvPlaybackPolicy.ts`, `src/components/tv/CinematicStage.tsx`, `src/components/tv/TVPlayer.tsx`, `src/components/tv/AdjacentPreview.tsx`, `src/components/tv/VideoThumbnail.tsx`, `src/integrations/supabase/previewAuthStorage.ts` (revert), tests `src/lib/tvPlaybackPolicy.test.ts`, `src/components/tv/CinematicStage.test.tsx`, `src/components/tv/TVPlayer.test.tsx`, `src/components/tv/VideoManager.test.tsx`, this report.

Checks actually run (exit 0 for all):
- `bunx vitest run <9 TV test files>` → 9 files, 153 tests passed (13 new regression tests in this round).
- `bunx vitest run` → 26 files, 288 tests passed.
- `npx tsc --noEmit -p tsconfig.app.json` → 0.
- `npx vite build` → 0 (existing chunk-size notice only).
- `npx eslint src/components/tv/ src/lib/tvPlaybackPolicy.ts src/lib/tvPlaybackPolicy.test.ts` → 0 errors, 0 warnings.

Migration status: unchanged; no new migration; no data reads/writes performed.

Limitations: mocked DOM tests only; no Chromium/WebKit playback or physical-TV verification; the existing "retries after the playlist is exhausted" test now passes because each source's own 60s cooldown expires, not because of a blanket reset.
