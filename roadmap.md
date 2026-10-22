# La Régence — corrections, 2026-10-21
- [x] Centralize BRL display; preserve existing database reais and Stripe cents boundary; expose invalid money.
- [x] Correct promotional/Pix display, selected variant price and shipping presentation.
- [x] Harden existing Google initiation, callback, loading/session and checkout return.
- [x] Improve existing typography, accessible controls, focus and mobile layouts without rebranding.
- [x] Run unit tests, lint, preview build diagnostics and Chromium/WebKit checks; record evidence and limitations.
- [x] Record diff and revision; no publication, backend price changes or manual Git state changes.
- [ ] Complete Google consent/session and real Stripe payment validation: requires authorized provider interaction/test environment; no real payment performed.
- [ ] Resolve existing lint debt (304 errors/20 warnings): unchanged in this readiness batch; requires a separately scoped cleanup. Latest public-route WebKit smoke check passed.

## BAM-181 readiness — 2026-10-21
- [x] Audit full/production dependencies, compatible fixes, synchronize both locks and validate npm ci.
- [x] Reduce eager catalog/product/auth imports; preserve TV behavior. Initial production byte comparison remains unverified because harness build sizes are unavailable.
- [x] Reproduce storage getter and Pix rounding bugs; integrated mocked auth/checkout regression tests.
- [x] Full tests, lint, available build diagnostics, incognito Chromium/WebKit; record failed lint and unverified independent frontend typecheck.
- [x] Read-only Stripe/webhook availability; live webhook enabled, dedicated test environment not established; no configuration changes.
- [x] Save readiness evidence, revision and blockers; no frontend publication or CI changes.
- [x] Migrate Vite 6.4.5, Vitest 4.1.12, React Router 7.18.4, selector-parser 7.1.7; only braces (no upstream fix) remains, documented.
- [x] Changed-file lint clean; legacy debt listed in evidence.
- [ ] Measure production initial JS bytes and confirm independent frontend typecheck: harness exposes build OK, not a size/typecheck report; external CI validation required.