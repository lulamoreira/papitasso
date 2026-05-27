-- Unschedule old jobs to stop using the leaked key
SELECT cron.unschedule('lock-predictions-every-minute');
SELECT cron.unschedule('score-matches-every-minute');
SELECT cron.unschedule('assign-prize-winners-cron');
SELECT cron.unschedule('lock-props-daily');
SELECT cron.unschedule('generate-mural-posts-daily');
SELECT cron.unschedule('lock-props-cron');

-- Re-schedule using the secure vault pattern
-- Note: This assumes 'service_role_key' is stored in vault.secrets
-- Use 'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')

SELECT cron.schedule(
    'lock-predictions-every-minute',
    '* * * * *',
    $$
    SELECT
      net.http_post(
        url := 'https://oweqrxqawwbcwrwoqsef.supabase.co/functions/v1/lock-predictions',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1)
        )
      ) as request_id;
    $$
);

SELECT cron.schedule(
    'score-matches-every-minute',
    '* * * * *',
    $$
    SELECT
      net.http_post(
        url := 'https://oweqrxqawwbcwrwoqsef.supabase.co/functions/v1/score-matches',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1)
        )
      ) as request_id;
    $$
);

SELECT cron.schedule(
    'assign-prize-winners-cron',
    '0 2 * * *',
    $$
    SELECT
      net.http_post(
        url := 'https://oweqrxqawwbcwrwoqsef.supabase.co/functions/v1/assign-prize-winners',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1)
        )
      ) as request_id;
    $$
);

SELECT cron.schedule(
    'lock-props-daily',
    '0 0 * * *',
    $$
    SELECT
      net.http_post(
        url := 'https://oweqrxqawwbcwrwoqsef.supabase.co/functions/v1/lock-props',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1)
        )
      ) as request_id;
    $$
);

SELECT cron.schedule(
    'generate-mural-posts-daily',
    '0 22 * * *',
    $$
    SELECT
      net.http_post(
        url := 'https://oweqrxqawwbcwrwoqsef.supabase.co/functions/v1/generate-mural-posts',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1)
        )
      ) as request_id;
    $$
);
