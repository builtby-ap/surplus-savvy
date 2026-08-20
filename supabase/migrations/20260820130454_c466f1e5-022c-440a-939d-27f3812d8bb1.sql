CREATE OR REPLACE VIEW public.vendors_public AS
SELECT id, legacy_id, display_alias, type, description, address, neighborhood, city,
       latitude, longitude, rating, review_count, fulfillment, delivery_fee, delivery_minimum,
       meals_rescued, verified, verification_status, created_at, phone
FROM public.vendors;

GRANT SELECT ON public.vendors_public TO anon, authenticated;