ALTER TABLE public.advertisements ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS ad_image_url text;
CREATE OR REPLACE VIEW public.advertised_vendors_public AS
 SELECT id, name, type, ad_tagline AS tagline,
    COALESCE(ad_image_url, image_url) AS image_url,
    logo_initials, neighborhood, city, ad_priority
   FROM public.vendors v
  WHERE is_advertised AND verification_status = 'approved'::vendor_status;