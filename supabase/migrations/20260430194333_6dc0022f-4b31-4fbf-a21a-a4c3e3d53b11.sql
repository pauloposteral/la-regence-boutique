SELECT cron.schedule(
  'regenerate-sitemap-daily',
  '0 3 * * *',
  $$ SELECT net.http_post(
    url := 'https://uuuaylqjllxqjjmvdybm.supabase.co/functions/v1/generate-sitemap',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dWF5bHFqbGx4cWpqbXZkeWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1ODE0ODMsImV4cCI6MjA4ODE1NzQ4M30.02Qya7I5m8HVaCReSE1dCfJgI9IOs2z9CR2wvhScjfU"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id; $$
);

SELECT cron.schedule(
  'abandoned-cart-hourly',
  '15 * * * *',
  $$ SELECT net.http_post(
    url := 'https://uuuaylqjllxqjjmvdybm.supabase.co/functions/v1/abandoned-cart-recovery',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dWF5bHFqbGx4cWpqbXZkeWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1ODE0ODMsImV4cCI6MjA4ODE1NzQ4M30.02Qya7I5m8HVaCReSE1dCfJgI9IOs2z9CR2wvhScjfU"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id; $$
);