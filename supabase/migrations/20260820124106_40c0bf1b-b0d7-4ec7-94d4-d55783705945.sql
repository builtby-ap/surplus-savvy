ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS is_advertised boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ad_tagline text,
  ADD COLUMN IF NOT EXISTS ad_priority integer NOT NULL DEFAULT 0;

CREATE OR REPLACE VIEW public.advertised_vendors_public
WITH (security_invoker = true) AS
SELECT v.id,
       v.name,
       v.type,
       v.ad_tagline AS tagline,
       v.image_url,
       v.logo_initials,
       v.neighborhood,
       v.city,
       v.ad_priority
FROM public.vendors v
WHERE v.is_advertised
  AND v.verification_status = 'approved';

GRANT SELECT ON public.advertised_vendors_public TO anon, authenticated;
GRANT ALL ON public.advertised_vendors_public TO service_role;

UPDATE public.vendors
SET is_advertised = true,
    ad_tagline = COALESCE(ad_tagline, 'Rescuing good food in ' || NULLIF(neighborhood, '') || ' every day'),
    ad_priority = 10
WHERE verification_status = 'approved'
  AND id IN (SELECT id FROM public.vendors WHERE verification_status = 'approved' ORDER BY created_at LIMIT 6);