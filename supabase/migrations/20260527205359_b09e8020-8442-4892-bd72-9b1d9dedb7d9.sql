CREATE OR REPLACE FUNCTION public.update_quiz_streak(p_user_id UUID)
RETURNS void AS $$
DECLARE
    v_last_quiz DATE;
    v_current_streak INTEGER;
BEGIN
    SELECT last_quiz_date, quiz_streak INTO v_last_quiz, v_current_streak
    FROM public.profiles
    WHERE id = p_user_id;

    IF v_last_quiz IS NULL OR v_last_quiz < CURRENT_DATE - INTERVAL '1 day' THEN
        -- Streak broken
        UPDATE public.profiles
        SET quiz_streak = 1,
            last_quiz_date = CURRENT_DATE
        WHERE id = p_user_id;
    ELSIF v_last_quiz = CURRENT_DATE - INTERVAL '1 day' THEN
        -- Streak continues
        UPDATE public.profiles
        SET quiz_streak = v_current_streak + 1,
            last_quiz_date = CURRENT_DATE
        WHERE id = p_user_id;
    ELSE
        -- Already answered today, do nothing to streak
        UPDATE public.profiles
        SET last_quiz_date = CURRENT_DATE
        WHERE id = p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
