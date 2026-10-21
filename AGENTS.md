# Architecture rules

- Keep Deno dependency resolution configured in `supabase/functions/deno.json` with automatic npm installation so function checks resolve their pinned dependencies independently of the frontend package versions.
- Treat existing commerce database/cart/shipping amounts as BRL major units; use the shared money module for display and validation, with centavos conversion only at an explicitly named Stripe boundary. This prevents double conversion and fictitious zero prices.
- Use the generated Lovable Cloud OAuth helper for Google and a public same-origin callback; resume sanitized destinations only after session hydration. The helper handles editor popups without custom Safari/iframe hacks.
- Preserve canonical fonts and color identity; use separate readable gold-ink and focus tokens for contrast rather than changing brand gold.