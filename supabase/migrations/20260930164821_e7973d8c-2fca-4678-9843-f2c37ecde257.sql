CREATE OR REPLACE VIEW public.vendors_public AS
SELECT id,
    legacy_id,
    name,
    display_alias,
    type,
    description,
    address,
    neighborhood,
    city,
    latitude,
    longitude,
    rating,
    review_count,
    fulfillment,
    delivery_fee,
    delivery_minimum,
    meals_rescued,
    verified,
    verification_status,
    created_at,
    phone,
    image_url
   FROM vendors;

GRANT SELECT ON public.vendors_public TO anon, authenticated;
GRANT ALL ON public.vendors_public TO service_role;

ALTER VIEW public.vendors_public SET (security_invoker = true);