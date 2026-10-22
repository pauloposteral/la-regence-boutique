# Architecture rules

- Keep Deno dependency resolution configured in `supabase/functions/deno.json` with automatic npm installation so function checks resolve their pinned dependencies independently of the frontend package versions.
- Treat existing commerce database/cart/shipping amounts as BRL major units; use the shared money module for display and validation, with centavos conversion only at an explicitly named Stripe boundary. This prevents double conversion and fictitious zero prices.
- Use the generated Lovable Cloud OAuth helper for Google and a public same-origin callback; resume sanitized destinations only after session hydration. The helper handles editor popups without custom Safari/iframe hacks.
- Preserve canonical fonts and color identity; use separate readable gold-ink and focus tokens for contrast rather than changing brand gold.
- Share checkout cent rounding and Pix discount subtraction between browser and Edge Functions so reviewed totals match gateway line totals exactly.
- Keep catalog/product route modules lazy and prefetch their JS only on navigation intent; never eagerly warm secondary routes on page boot.
- Resolve OAuth storage through a callback inside the guarded helper because browser storage getters themselves can throw.
- Keep npm and Bun lock version sets equivalent; migrate Bun from the validated npm lock when version-qualified npm overrides are not honored by Bun, then verify frozen installation and npm ci. Retain only the text Bun lock to avoid an obsolete binary lock taking precedence.- Stay on supported tool lines (Vite 6.4.x, Vitest 4, React Router 7 declarative API); upgrade majors only with full tests, route sweep and visual check. Unsupported lines stop receiving security fixes.
