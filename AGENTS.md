# Architecture rules

- Keep Deno dependency resolution configured in `supabase/functions/deno.json` with automatic npm installation so function checks resolve their pinned dependencies independently of the frontend package versions.