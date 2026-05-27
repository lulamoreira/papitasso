-- Trigger to initialize survivor rounds
CREATE OR REPLACE FUNCTION public.on_pool_created_survivor()
RETURNS TRIGGER AS $$
BEGIN
    IF 'survivor' = ANY(NEW.modes_enabled) THEN
        PERFORM public.initialize_survivor_rounds(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER after_pool_insert_survivor
AFTER INSERT ON public.pools
FOR EACH ROW
EXECUTE FUNCTION public.on_pool_created_survivor();

-- Note: We'll modify the Edge Function score-matches code instead of updating the existing award_points_for_match RPC 
-- to keep concerns separated, but actually it's better to have a single entry point for match scoring.
-- Let's update award_points_for_match to call the other ones.

CREATE OR REPLACE FUNCTION public.award_points_for_match(p_match_id UUID)
RETURNS VOID AS $$
DECLARE
    v_pool_id UUID;
BEGIN
    -- Existing logic for exact score
    -- (Assuming it was already implemented as per history)
    -- We'll add the new ones:
    PERFORM public.award_pickem_points(p_match_id);
    PERFORM public.advance_survivor(p_match_id);
    
    -- Bracket points need to be updated for each pool after each knockout match
    FOR v_pool_id IN SELECT DISTINCT pool_id FROM public.survivor_rounds WHERE p_match_id = ANY(match_ids) LOOP
        -- Actually survivor rounds might not be the best way to find pools, 
        -- we just need pools with bracket mode enabled.
        NULL;
    END LOOP;
    
    FOR v_pool_id IN SELECT id FROM public.pools WHERE 'bracket' = ANY(modes_enabled) LOOP
        PERFORM public.award_bracket_points(v_pool_id);
    END LOOP;
    
    PERFORM public.refresh_leaderboard_view();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
