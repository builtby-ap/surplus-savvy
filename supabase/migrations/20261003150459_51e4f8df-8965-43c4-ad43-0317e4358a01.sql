REVOKE EXECUTE ON FUNCTION public.validate_review() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.flag_reported_review() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.limit_review_photos() FROM PUBLIC, anon, authenticated;