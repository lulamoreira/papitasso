-- 1. Create CRON_SECRET if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM vault.secrets WHERE name = 'cron_secret'
    ) THEN
        PERFORM vault.create_secret(
            encode(gen_random_bytes(32), 'hex'),
            'cron_secret',
            'Header secret usado pelas edge functions cron-only pra validar requests legítimas'
        );
    END IF;
END $$;

-- 2. Helper function to get headers
CREATE OR REPLACE FUNCTION public.get_cron_headers()
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1),
        'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret' LIMIT 1)
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_cron_headers() TO postgres, service_role, authenticated, anon;

-- 3. Update Cron Jobs safely
DO $$
BEGIN
    -- Unschedule existing jobs only if they exist
    PERFORM cron.unschedule(jobname) FROM cron.job WHERE jobname = 'lock-predictions';
    PERFORM cron.unschedule(jobname) FROM cron.job WHERE jobname = 'score-matches';
    PERFORM cron.unschedule(jobname) FROM cron.job WHERE jobname = 'assign-prize-winners';
    PERFORM cron.unschedule(jobname) FROM cron.job WHERE jobname = 'lock-props';
    PERFORM cron.unschedule(jobname) FROM cron.job WHERE jobname = 'generate-mural-posts';

    -- Re-schedule
    PERFORM cron.schedule(
        'lock-predictions',
        '* * * * *',
        'SELECT net.http_post(url := ''https://oweqrxqawwbcwrwoqsef.supabase.co/functions/v1/lock-predictions'', headers := public.get_cron_headers(), body := ''{}''::jsonb)'
    );

    PERFORM cron.schedule(
        'score-matches',
        '*/5 * * * *',
        'SELECT net.http_post(url := ''https://oweqrxqawwbcwrwoqsef.supabase.co/functions/v1/score-matches'', headers := public.get_cron_headers(), body := ''{}''::jsonb)'
    );

    PERFORM cron.schedule(
        'assign-prize-winners',
        '0 4 * * *',
        'SELECT net.http_post(url := ''https://oweqrxqawwbcwrwoqsef.supabase.co/functions/v1/assign-prize-winners'', headers := public.get_cron_headers(), body := ''{}''::jsonb)'
    );

    PERFORM cron.schedule(
        'lock-props',
        '* * * * *',
        'SELECT net.http_post(url := ''https://oweqrxqawwbcwrwoqsef.supabase.co/functions/v1/lock-props'', headers := public.get_cron_headers(), body := ''{}''::jsonb)'
    );

    PERFORM cron.schedule(
        'generate-mural-posts',
        '0 * * * *',
        'SELECT net.http_post(url := ''https://oweqrxqawwbcwrwoqsef.supabase.co/functions/v1/generate-mural-posts'', headers := public.get_cron_headers(), body := ''{}''::jsonb)'
    );
END $$;
