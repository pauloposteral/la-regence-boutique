# BAM-181 readiness — La Régence Boutique

## Scope and revision
- Repository: pauloposteral/la-regence-boutique; domain: cafelaregence.com.br.
- User-confirmed base: `d7745461e50d58a6fc1a34c2f5fd3e52e54b75c4`.
- Observed repository HEAD before this report: `24d76d0bcfe20ad6477749c5e03462ac55b3923b` (automatic editor revision; no manual commit/push).
- No frontend publication, function deployment, CI mutation, commercial data change, credential/provider change or real transaction. TV/player/PDV and other projects unchanged.
- **Not fully ready**: unresolved security advisories, existing lint failures, independent frontend typecheck and production initial-byte comparison unverified.

## Commands and objective outcomes
| Check | Outcome / exit code |
|---|---|
| Initial `npm audit --registry=https://registry.npmjs.org --json` | 1: 42 dependency findings; 2 critical, 32 high, 7 moderate, 1 low |
| Initial audit with `--omit=dev` | 1: 21 findings; 18 high, 3 moderate |
| Final full official audit | 1: 17 findings; 2 critical, 6 high, 9 moderate |
| Final official audit with `--omit=dev` | 1: 10 findings; 5 high, 5 moderate; no critical |
| Default registry audit retry | 1: sandbox registry does not support audit (404); official-registry retry above succeeded in returning findings |
| `npm ci --audit=false` | 0; independently audited above |
| `npm ls --all --json` after npm ci | 0 |
| `bun install --lockfile-only --ignore-scripts` | 0: migrated validated package-lock.json |
| `bun install --frozen-lockfile --ignore-scripts` | 0 |
| npm/Bun package-name and version-set comparison, normalizing npm aliases | 0 mismatches |
| `npm test` final | 0: 21 files / 209 tests passing |
| `npm run lint` full, before and after | 1: unchanged 324 findings = 304 errors / 20 warnings; no rules disabled |
| `deno check --config supabase/functions/deno.json supabase/functions/create-checkout-payment/index.ts supabase/functions/calcular-frete/index.ts` | 0: both checked |
| Preview automatic build diagnostics | `build OK` at 2026-10-22T00:03:17Z; no manual build rerun |
| Independent frontend typecheck | Not run: sandbox instructions prohibit manual project typechecks; external CI result not asserted |
| Fresh Chromium and WebKit public-route smoke check | 0; home, auth, empty-cart checkout and mobile auth; zero page errors, zero blocked write attempts, no mobile horizontal overflow |

Counts are npm dependency findings, **not** 42 unique production vulnerabilities. `--omit=dev` describes the dependency installation tree, not browser reachability. CSS build tools in dependencies appear in that tree but are not automatically browser code. Both full and production-install counts remain nonzero.

## Dependency changes and advisory coverage
Compatible selected upgrades include DOMPurify 3.4.17, React Router DOM 6.30.6, Vite 5.4.21 and Vitest 3.2.7; updated compatible lint/CSS tooling and pinned audited transitive overrides. No `audit fix --force`, suppressed alerts or untested major migration. An attempted unpublished lodash 4.17.24 was rejected by registry; final installed override is 4.18.1, with npm ci passing. The obsolete binary Bun lock was removed so only bun.lock and package-lock.json govern resolution. Bun was migrated from npm because version-qualified overrides previously left incompatible versions in its old lock.

The table records the installed remediation version, not a claimed first-ever fixed release. A disappeared advisory is confirmed by the current official audit; a remaining advisory is not declared fixed.

| Package | GHSA | Before installed | After installed / remediation | Reach / status |
|---|---|---|---|---|
| minimatch | GHSA-23c5-xmqv-rm74 | 3.1.2, 9.0.5 | 10.2.6, 3.1.5, 9.0.7 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| flatted | GHSA-25h7-pfq9-p65f | 3.3.1 | 3.4.2 | Development-install only in baseline audit; No longer reported in final official audit |
| js-yaml | GHSA-2883-xcg3-v3hh | 4.1.0 | 4.3.2 | Development-install only in baseline audit; No longer reported in final official audit |
| nanoid | GHSA-28wg-ghj8-5hjv | 3.3.11 | 3.3.20 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| ajv | GHSA-2g4f-4pwh-qvx6 | 6.12.6 | 6.15.0 | Development-install only in baseline audit; No longer reported in final official audit |
| react-router | GHSA-2j2x-hqr9-3h42 | 6.30.1 | 6.30.6 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| nanoid | GHSA-2v37-7h3g-55p8 | 3.3.11 | 3.3.20 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| @remix-run/router | GHSA-2w69-qvjg-hvjx | 1.23.0 | 1.23.4 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| react-router | GHSA-337j-9hxr-rhxg | 6.30.1 | 6.30.6 | Production-install dependency (runtime/build reach depends on use); REMAINS; affected range >=6.4.0 <7.18.0 |
| dompurify | GHSA-39q2-94rc-95cp | 3.3.1 | 3.4.17 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| brace-expansion | GHSA-3jxr-9vmj-r5cp | 1.1.12, 2.0.2 | 1.1.21, 5.0.12 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| minimatch | GHSA-3ppc-4f35-3m26 | 3.1.2, 9.0.5 | 10.2.6, 3.1.5, 9.0.7 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| picomatch | GHSA-3v7f-55p6-f55p | 2.3.1, 4.0.3 | 2.3.2, 4.0.4 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| yaml | GHSA-48c2-rrv3-qjmp | 2.6.0 | 2.8.3 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| vite | GHSA-4w7w-66w2-5vf9 | 5.4.19 | 5.4.21 | Development-install only in baseline audit; REMAINS; affected range <=6.4.1 |
| js-yaml | GHSA-52cp-r559-cp3m | 4.1.0 | 4.3.2 | Development-install only in baseline audit; No longer reported in final official audit |
| dompurify | GHSA-55q2-fjhq-7xh7 | 3.3.1 | 3.4.17 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| vite | GHSA-587h-7wmj-h5pm | 5.4.19 | 5.4.21 | Development-install only in baseline audit; REMAINS; affected range <=6.4.3 |
| ws | GHSA-58qx-3vcg-4xpx | 8.19.0 | 8.21.0 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| tinypool | GHSA-5gmw-xhrv-c9v3 | 1.1.1 | 1.1.1 | Development-install only in baseline audit; REMAINS; affected range <=2.1.0 |
| glob | GHSA-5j98-mcp5-4vw2 | 10.4.5 | 10.5.0 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| js-yaml | GHSA-5p4m-2wfm-xmqj | 4.1.0 | 4.3.2 | Development-install only in baseline audit; No longer reported in final official audit |
| vitest | GHSA-5xrq-8626-4rwp | 3.2.4 | 3.2.7 | Development-install only in baseline audit; No longer reported in final official audit |
| dompurify | GHSA-6688-9rhm-gjv2 | 3.3.1 | 3.4.17 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| esbuild | GHSA-67mh-4wv8-2f99 | 0.21.5, 0.25.0 | 0.21.5, 0.25.0 | Development-install only in baseline audit; REMAINS; affected range <=0.24.2 |
| source-map-js | GHSA-68fv-2mgg-jv7q | 1.2.1 | 1.2.2 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| vite | GHSA-698v-4r3x-3vcv | 5.4.19 | 5.4.21 | Development-install only in baseline audit; REMAINS; affected range <=6.4.3 |
| postcss | GHSA-6g55-p6wh-862q | 8.5.6 | 8.5.31 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| brace-expansion | GHSA-6j4f-fj2g-mc7p | 1.1.12, 2.0.2 | 1.1.21, 5.0.12 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| browserslist | GHSA-73wf-gq98-2v4g | 4.25.1 | 4.29.4 | Development-install only in baseline audit; No longer reported in final official audit |
| dompurify | GHSA-76mc-f452-cxcm | 3.3.1 | 3.4.17 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| minimatch | GHSA-7r86-cg39-jmmj | 3.1.2, 9.0.5 | 10.2.6, 3.1.5, 9.0.7 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| vitest | GHSA-82fw-gwwq-j7x9 | 3.2.4 | 3.2.7 | Development-install only in baseline audit; REMAINS; affected range >=2.1.0 <4.1.11 |
| tinypool | GHSA-85c8-ppgw-ccpr | 1.1.1 | 1.1.1 | Development-install only in baseline audit; REMAINS; affected range <2.1.2 |
| vite | GHSA-93m4-6634-74q7 | 5.4.19 | 5.4.21 | Development-install only in baseline audit; No longer reported in final official audit |
| ws | GHSA-96hv-2xvq-fx4p | 8.19.0 | 8.21.0 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| react-router | GHSA-9jcx-v3wj-wh4m | 6.30.1 | 6.30.6 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| vite | GHSA-9jrq-w75r-8gcw | 5.4.19 | 5.4.21 | Development-install only in baseline audit; REMAINS; affected range <=6.4.3 |
| picomatch | GHSA-c2c7-rcm5-vvqj | 2.3.1, 4.0.3 | 2.3.2, 4.0.4 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| dompurify | GHSA-c2j3-45gr-mqc4 | 3.3.1 | 3.4.17 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| browserslist | GHSA-c83g-rgw3-j3cx | 4.25.1 | 4.29.4 | Development-install only in baseline audit; No longer reported in final official audit |
| dompurify | GHSA-cj63-jhhr-wcxv | 3.3.1 | 3.4.17 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| dompurify | GHSA-cjmm-f4jc-qw8r | 3.3.1 | 3.4.17 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| dompurify | GHSA-cmwh-pvxp-8882 | 3.3.1 | 3.4.17 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| dompurify | GHSA-crv5-9vww-q3g8 | 3.3.1 | 3.4.17 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| lodash | GHSA-f23m-r3pf-42rh | 4.17.21 | 4.18.1 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| brace-expansion | GHSA-f886-m6hf-6m8v | 1.1.12, 2.0.2 | 1.1.21, 5.0.12 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| vite | GHSA-fx2h-pf6j-xcff | 5.4.19 | 5.4.21 | Development-install only in baseline audit; REMAINS; affected range <=6.4.2 |
| postcss | GHSA-fxqj-rqcc-2cmp | 8.5.6 | 8.5.31 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| vite | GHSA-g4jq-h2w9-997c | 5.4.19 | 5.4.21 | Development-install only in baseline audit; No longer reported in final official audit |
| dompurify | GHSA-gvmj-g25r-r7wr | 3.3.1 | 3.4.17 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| js-yaml | GHSA-h67p-54hq-rp68 | 4.1.0 | 4.3.2 | Development-install only in baseline audit; No longer reported in final official audit |
| dompurify | GHSA-h7mw-gpvr-xq4m | 3.3.1 | 3.4.17 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| dompurify | GHSA-h8r8-wccr-v5f2 | 3.3.1 | 3.4.17 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| form-data | GHSA-hmw2-7cc7-3qxx | 4.0.5 | 4.0.6 | Development-install only in baseline audit; No longer reported in final official audit |
| dompurify | GHSA-hpcv-96wg-7vj8 | 3.3.1 | 3.4.17 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| vite | GHSA-jqfw-vq24-v9c3 | 5.4.19 | 5.4.21 | Development-install only in baseline audit; No longer reported in final official audit |
| js-yaml | GHSA-mh29-5h37-fv8m | 4.1.0 | 4.3.2 | Development-install only in baseline audit; No longer reported in final official audit |
| brace-expansion | GHSA-mh99-v99m-4gvg | 1.1.12, 2.0.2 | 1.1.21, 5.0.12 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| rollup | GHSA-mw96-cpmx-2vgc | 4.24.0 | 4.59.0 | Development-install only in baseline audit; No longer reported in final official audit |
| @humanfs/node | GHSA-p498-v437-472g | 0.16.6 | 0.16.8 | Development-install only in baseline audit; No longer reported in final official audit |
| brace-expansion | GHSA-q2hr-2g5m-vwhr | 1.1.12, 2.0.2 | 1.1.21, 5.0.12 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| brace-expansion | GHSA-qhr7-859c-m2p7 | 1.1.12, 2.0.2 | 1.1.21, 5.0.12 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| postcss | GHSA-qx2v-qp2m-jg93 | 8.5.6 | 8.5.31 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| @vitest/mocker | GHSA-qxg6-89mg-rqv8 | 3.2.4 | 3.2.7 | Development-install only in baseline audit; REMAINS; affected range >=2.1.0-beta.7 <4.1.12 |
| postcss | GHSA-r28c-9q8g-f849 | 8.5.6 | 8.5.31 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| dompurify | GHSA-r47g-fvhr-h676 | 3.3.1 | 3.4.17 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| lodash | GHSA-r5fr-rjxr-66jc | 4.17.21 | 4.18.1 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| vite | GHSA-r825-w8mm-5pxw | 5.4.19 | 5.4.21 | Development-install only in baseline audit; REMAINS; affected range <=6.4.3 |
| flatted | GHSA-rf6f-7fwh-wjgh | 3.3.1 | 3.4.2 | Development-install only in baseline audit; No longer reported in final official audit |
| brace-expansion | GHSA-rgw5-rvv9-x895 | 1.1.12, 2.0.2 | 1.1.21, 5.0.12 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| postcss-selector-parser | GHSA-rj75-hqrm-r3gf | 6.0.10, 6.1.2 | 6.1.5 | Production-install dependency (runtime/build reach depends on use); REMAINS; affected range <7.1.6 |
| dompurify | GHSA-rp9w-3fw7-7cwq | 3.3.1 | 3.4.17 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| vite | GHSA-rq7h-c2jc-7f22 | 5.4.19 | 5.4.21 | Development-install only in baseline audit; REMAINS; affected range <=6.4.3 |
| dompurify | GHSA-v2wj-7wpq-c8vv | 3.3.1 | 3.4.17 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| vite | GHSA-v6wh-96g9-6wx3 | 5.4.19 | 5.4.21 | Development-install only in baseline audit; REMAINS; affected range <=6.4.2 |
| dompurify | GHSA-v9jr-rg53-9pgp | 3.3.1 | 3.4.17 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| braces | GHSA-vfj7-8cjw-p6xm | 3.0.3 | 3.0.3 | Production-install dependency (runtime/build reach depends on use); REMAINS; affected range <=3.0.3 |
| @tootallnate/once | GHSA-vpq2-c234-7xj6 | 2.0.0 | 2.0.1 | Development-install only in baseline audit; No longer reported in final official audit |
| dompurify | GHSA-vxr8-fq34-vvx9 | 3.3.1 | 3.4.17 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| postcss-selector-parser | GHSA-w9m9-85wc-3x92 | 6.0.10, 6.1.2 | 6.1.5 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| react-router | GHSA-wrjc-x8rr-h8h6 | 6.30.1 | 6.30.6 | Production-install dependency (runtime/build reach depends on use); REMAINS; affected range >=6.0.0 <7.18.0 |
| dompurify | GHSA-x4vx-rjvf-j5p4 | 3.3.1 | 3.4.17 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| nanoid | GHSA-xwg4-73v4-xw9w | 3.3.11 | 3.3.20 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |
| lodash | GHSA-xxjr-mmjv-4gpg | 4.17.21 | 4.18.1 | Production-install dependency (runtime/build reach depends on use); No longer reported in final official audit |

### Remaining blockers and applicability
- Router GHSA-wrjc-x8rr-h8h6 and GHSA-337j-9hxr-rhxg remain. Advisory fixed boundary is 7.18.0; npm suggests 7.18.4 (major). SPA has no SSR hydration, limiting the SSR-specific path; generic router open redirect remains a dependency finding. App `safeNext` is covered, but does not certify every router use safe.
- braces GHSA-vfj7-8cjw-p6xm: no npm-reported fix; Tailwind/glob build chains propagate findings. Untrusted-pattern denial of service is not dismissed.
- postcss-selector-parser GHSA-rj75-hqrm-r3gf: audit affected range <7.1.6; compatible 6.1.5 fixes a separate advisory but not this one. No compatible patch confirmed.
- Vite 5.4.21 still has dev-server/editor advisories; esbuild remains affected. npm recommends Vite 8.3.5, a major change not tested here. These are not automatically deployed static-app exploits, but development tooling is not clean.
- Vitest/mocker and tinypool advisories remain, including two critical dependency findings; npm recommends Vitest 5.0.5. Worker-option injection and mock-server exposure require separate assessed upgrade; no untrusted worker inputs or public test server were introduced.
- Dependency-scanner and npm reports differ in counting/coverage. Official npm results are retained rather than claiming a clean dependency tree.

## Loading changes and honest measurement
- Before: Index, CafesPage, ProdutoPage and NotFound imported eagerly in App; OAuth adapter statically imported by AuthPage; route prefetch used delayed document prefetch.
- After: catalog/product pages use actual dynamic imports; managed cloud-auth adapter loads only on Google action; route chunks warm on pointer/keyboard navigation intent, not idle startup.
- TV routes/player behavior unchanged; TV tests are included in the passing suite.
- Baseline 917 kB / 275 kB gzip was supplied by the user, not reproduced here. The harness supplies build status but no accessible production artifact/size report. **After initial loaded JS bytes and percentage reduction are unverified**; no chunk-warning limit was raised and chunk fragmentation is not reported as measured savings.

## Reproduced and corrected regressions
- Failing-first simulated AuthPage session event reproduced `window.sessionStorage` getter throwing before the helper call. Getter closures now resolve storage inside the guarded helper; confirmed-session event returns to /checkout without requiring storage.
- Failing-first Pix test reproduced 0.05 reais displaying 0.05 rather than server-policy 0.04 (round the 10% discount once then subtract). Shared integer-cent totals now drive browser, checkout server and shipping variant rounding; R$69.90 → R$62.91 remains exact.
- Checkout mock integration accepts matching R$62.91 and refuses R$62.92 before following the mock gateway URL. All integration tests are explicitly simulated, with mocked auth/payment services and no real network credentials, orders or Stripe sessions.
- `validated.total` remains reais; frontend and backend compare via explicit cent conversion. JSON/API units, catalog values, actual discounts and shipping rules preserved.

## Browser and service limitations
- Fresh anonymous Chromium/WebKit contexts on localhost; screenshots inspected for auth and empty checkout. This is a public-route smoke check, **not** a real Google sign-in, consent flow or populated real checkout end-to-end.
- Stripe read-only inventory: this project's webhook is enabled in **live** mode, API version 2020-08-27, 26 configured events. Stripe key/webhook-secret names are present; values were not inspected, logged or included. A dedicated test environment was not established by available evidence. No key migration or test transaction.
- OAuth managed provider was preserved, not reconfigured. Complete Google session/consent is unverified.
- Backend source rounding changed but was **not deployed** during this readiness round. Consolidated validation/deployment must keep browser and these two functions on the same reviewed arithmetic revision.
- REA guidance shaped read-only scope and evidence limits; no REA download/CLI execution or MCP registration was needed or claimed. Brand-reference-first guidance preserved existing identity; no generated brand assets.

## Changed paths
- `AGENTS.md`
- `bun.lock`
- `bun.lockb`
- `package-lock.json`
- `package.json`
- `roadmap.md`
- `src/App.tsx`
- `src/hooks/usePrefetchRoutes.ts`
- `src/lib/checkoutAmounts.test.ts`
- `src/lib/money.ts`
- `src/lib/oauth.ts`
- `src/lib/readiness.regression.test.ts`
- `src/pages/AuthPage.readiness.test.tsx`
- `src/pages/AuthPage.tsx`
- `src/pages/CheckoutPage.readiness.test.tsx`
- `src/pages/CheckoutPage.tsx`
- `supabase/functions/_shared/checkoutAmounts.ts`
- `supabase/functions/calcular-frete/index.ts`
- `supabase/functions/create-checkout-payment/index.ts`
- `docs/evidence/bam181-readiness.md` (this report)


---

## Etapa final de segurança — 2026-10-22

Base: revisão `4224a38` (após o complemento Pix/checkout). Nada publicado no frontend; nenhuma credencial, preço, dado ou transação alterado.

### Migrações (verificadas)
| Pacote | Antes | Depois | Motivo |
|---|---|---|---|
| vite | 5.4.21 | 6.4.5 | Linha 5 sem suporte; 6.4 recebe segurança (vite.dev/releases). `@vitejs/plugin-react-swc` 3.11 e `lovable-tagger` (peer vite >=5 <8) compatíveis. |
| vitest | 3.2.7 | 4.1.12 | Remove `tinypool`/`vite-node` da árvore; Node v22.22.0 (engines `^22`). 5.x não necessário. |
| react-router-dom | 6.30.6 | 7.18.4 | Advisories de redirect por barra invertida/SSR só corrigidos na 7. API declarativa (`BrowserRouter`/`Routes`) mantida; apenas removidas as props `future` v6 obsoletas em 2 testes de TV (sem mudança no player). |
| postcss-selector-parser (override) | 6.1.5 | 7.1.7 | Usado por Tailwind 3/typography/postcss-nested; build e comparação visual OK. |

`package-lock.json` regenerado (npm arborist falhava com `edgesOut` ao aplicar o override sobre o lock antigo); `bun.lock` migrado do lock npm. Diferença entre os locks: apenas os aliases `*-cjs` (string-width/strip-ansi/wrap-ansi), mesmas versões.

### Comandos e resultados
| Comando | Resultado |
|---|---|
| `npm audit --json --registry=https://registry.npmjs.org` | exit 1 — **8 high** (antes 17: 2 critical/6 high/9 moderate) |
| `npm audit --omit=dev --json …` | exit 1 — **6 high** (antes 10: 5 high/5 moderate) |
| Scanner de dependências do projeto (bun.lock, produção) | 0 vulnerabilidades em 54 pacotes |
| `npm ci` | exit 0 (duas vezes, após alterações finais) |
| `bunx vitest run` | exit 0 — 23 arquivos, **218 testes** |
| `npx tsc --noEmit -p tsconfig.app.json` | exit 0 |
| `deno check` checkout + frete | exit 0 |
| `npx eslint` nos 16 arquivos alterados desde d774546 + novos | **0 problemas** |
| Playwright Chromium+WebKit (home, /auth?next=/checkout, checkout vazio, mobile) | exit 0, sem erros JS, escritas bloqueadas, sem overflow |
| Varredura de 41 rotas (Chromium, escritas abortadas, incl. rota inexistente) | 0 erros de página |
| Comparação visual home antes/depois (1280×1800) | 0,2% dos pixels diferem, todos na faixa y=1457–1556 (faixa animada); resto idêntico |

### Advisory residual: braces (GHSA-vfj7-8cjw-p6xm, <=3.0.3, sem release corrigido)
Cadeia única: `tailwindcss@3.4.19 → micromatch@4.0.8 / chokidar@3.6.0 → braces@3.0.3` (+ `fast-glob`, `tailwindcss-animate`, `@tailwindcss/typography`, `lovable-tagger` reportados por dependerem de tailwind). Alcance: só build/dev, expandindo os globs estáticos de `tailwind.config.ts` (`content`) e caminhos observados pelo watcher; nada é enviado ao navegador e nenhuma entrada de usuário chega ao braces. Dev server roda isolado no sandbox. Mitigação testável: `src/lib/tailwindContentGlobs.test.ts` exige globs literais, profundidade de chaves <=1 e tamanho <80. **O advisory continua reportado pelo npm**; não migrado Tailwind 4 só para o contador.

### Lint
Total do repositório: 304 erros/20 avisos → **263 erros/20 avisos em 69 arquivos** (regras: no-explicit-any 258, only-export-components 12, exhaustive-deps 8, no-empty 2, no-empty-object-type 2, no-control-regex 1). Nenhuma regra desativada. Corrigidos 41 `any` em `create-checkout-payment`, `calcular-frete` e `CheckoutPage` com tipos explícitos (removidas também as 2 supressões `deno-lint-ignore`). Dívida legada por arquivo:

| Arquivo | Erros | Avisos |
|---|---|---|
| `src/pages/admin/AdminProdutos.tsx` | 33 | 0 |
| `supabase/functions/stripe-webhook/index.ts` | 25 | 0 |
| `src/pages/admin/AdminPedidos.tsx` | 20 | 0 |
| `src/pages/ContaPage.tsx` | 16 | 0 |
| `src/pages/admin/AdminClientes.tsx` | 13 | 1 |
| `src/pages/ProdutoPage.tsx` | 10 | 3 |
| `src/pages/admin/AdminAssinaturas.tsx` | 12 | 1 |
| `supabase/functions/_shared/subscriptions.ts` | 10 | 0 |
| `src/pages/admin/AdminBanners.tsx` | 7 | 0 |
| `src/pages/admin/AdminCollections.tsx` | 7 | 0 |
| `supabase/functions/subscription-address/index.ts` | 7 | 0 |
| `supabase/functions/subscriptions-reconcile/index.ts` | 6 | 0 |
| `src/components/home/CollectionsSection.tsx` | 5 | 0 |
| `src/hooks/useProdutos.ts` | 5 | 0 |
| `src/pages/CompararPage.tsx` | 4 | 1 |
| `src/pages/QuizPage.tsx` | 5 | 0 |
| `src/pages/admin/AdminCupons.tsx` | 5 | 0 |
| `supabase/functions/subscription-admin/index.ts` | 5 | 0 |
| `src/pages/AssinaturaPage.tsx` | 4 | 0 |
| `src/pages/admin/AdminBlog.tsx` | 4 | 0 |
| `src/pages/admin/AdminCategorias.tsx` | 4 | 0 |
| `src/pages/admin/AdminDashboard.tsx` | 4 | 0 |
| `supabase/functions/create-subscription-checkout/index.ts` | 4 | 0 |
| `supabase/functions/process-restock-notifications/index.ts` | 4 | 0 |
| `src/components/layout/Header.tsx` | 3 | 0 |
| `src/contexts/CartContext.tsx` | 2 | 1 |
| `supabase/functions/send-email/index.ts` | 3 | 0 |
| `src/components/product/ProductReviews.tsx` | 2 | 0 |
| `src/components/product/ShippingCalculator.tsx` | 2 | 0 |
| `src/components/subscription/AddressForm.tsx` | 0 | 2 |
| `src/pages/FavoritosPage.tsx` | 2 | 0 |
| `supabase/functions/order-track/index.ts` | 2 | 0 |
| `supabase/functions/send-review-requests/index.ts` | 2 | 0 |
| `supabase/functions/subscription-status/index.ts` | 2 | 0 |
| `src/components/SEOHead.tsx` | 1 | 0 |
| `src/components/admin/AddressDisplay.tsx` | 1 | 0 |
| `src/components/admin/AdminLayout.tsx` | 1 | 0 |
| `src/components/cart/CrossSellProducts.tsx` | 0 | 1 |
| `src/components/home/DynamicBanners.tsx` | 1 | 0 |
| `src/components/layout/CookieBanner.tsx` | 1 | 0 |
| `src/components/layout/PWAInstallPrompt.tsx` | 1 | 0 |
| `src/components/product/ProductGallery.tsx` | 1 | 0 |
| `src/components/product/PromotionCountdown.tsx` | 0 | 1 |
| `src/components/product/SocialProofToast.tsx` | 1 | 0 |
| `src/components/ui/badge.tsx` | 0 | 1 |
| `src/components/ui/button.tsx` | 0 | 1 |
| `src/components/ui/command.tsx` | 1 | 0 |
| `src/components/ui/form.tsx` | 0 | 1 |
| `src/components/ui/navigation-menu.tsx` | 0 | 1 |
| `src/components/ui/optimized-image.tsx` | 0 | 1 |
| `src/components/ui/sidebar.tsx` | 0 | 1 |
| `src/components/ui/sonner.tsx` | 0 | 1 |
| `src/components/ui/textarea.tsx` | 1 | 0 |
| `src/components/ui/toggle.tsx` | 0 | 1 |
| `src/contexts/CompareContext.tsx` | 0 | 1 |
| `src/lib/analytics.ts` | 1 | 0 |
| `src/lib/businessDays.ts` | 1 | 0 |
| `src/pages/AssinaturaSucessoPage.tsx` | 1 | 0 |
| `src/pages/BlogPage.tsx` | 1 | 0 |
| `src/pages/InstitucionalPages.tsx` | 1 | 0 |
| `src/pages/NewsletterConfirmPage.tsx` | 1 | 0 |
| `src/pages/PagamentoSucessoPage.tsx` | 1 | 0 |
| `src/pages/RastreioPage.tsx` | 1 | 0 |
| `src/pages/admin/AdminFreteGratis.tsx` | 1 | 0 |
| `supabase/functions/_shared/rateLimit.ts` | 1 | 0 |
| `supabase/functions/abandoned-cart-recovery/index.ts` | 1 | 0 |
| `supabase/functions/newsletter-confirm/index.ts` | 1 | 0 |
| `supabase/functions/newsletter-subscribe/index.ts` | 1 | 0 |
| `supabase/functions/order-ship/index.ts` | 1 | 0 |

### Implantação
`create-checkout-payment` reimplantada (somente tipagem; comportamento igual), SHA-256 da fonte `96a6fd6f…88cf5`. `calcular-frete` implantada após `deno check` exit 0 (2026-10-22 ~00:21 UTC), SHA-256 da fonte `8a9fe91d…f5ebad`; POST inválido respondeu 400 `Valor monetário inválido`. Checkout sem mudanças após `96a6fd6f`, não reimplantado. Conta Stripe da chave configurada continua não confirmada.

### Pendências
- 8/6 advisories high de braces sem correção upstream (risco residual documentado acima).
- Medição de bytes do JS inicial e build de produção: validação externa no CI.
