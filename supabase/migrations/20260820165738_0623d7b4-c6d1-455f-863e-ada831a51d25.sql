CREATE OR REPLACE FUNCTION public.expire_food_posts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected integer;
BEGIN
  UPDATE public.food_posts
  SET is_available = false, updated_at = now()
  WHERE is_available
    AND (((created_at AT TIME ZONE 'Asia/Yangon')::date + available_until)
         < (now() AT TIME ZONE 'Asia/Yangon'));
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_food_posts() FROM public;
GRANT EXECUTE ON FUNCTION public.expire_food_posts() TO service_role;

DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron;
  PERFORM cron.unschedule('expire-food-posts')
  FROM cron.job WHERE jobname = 'expire-food-posts';
  PERFORM cron.schedule('expire-food-posts', '*/10 * * * *', 'SELECT public.expire_food_posts();');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron unavailable: %', SQLERRM;
END;
$$;

SELECT public.expire_food_posts();