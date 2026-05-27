-- Schedule lock-predictions every minute
SELECT cron.schedule(
    'lock-predictions-every-minute',
    '* * * * *',
    $$
    SELECT
      net.http_post(
        url := 'https://oweqrxqawwbcwrwoqsef.supabase.co/functions/v1/lock-predictions',
        headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || 'sb_secret_gwSJX1yQxy5wzUfuxkwJrQ_yyaaeoYN')
      ) as request_id;
    $$
);

-- Schedule score-matches every minute
SELECT cron.schedule(
    'score-matches-every-minute',
    '* * * * *',
    $$
    SELECT
      net.http_post(
        url := 'https://oweqrxqawwbcwrwoqsef.supabase.co/functions/v1/score-matches',
        headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || 'sb_secret_gwSJX1yQxy5wzUfuxkwJrQ_yyaaeoYN')
      ) as request_id;
    $$
);
