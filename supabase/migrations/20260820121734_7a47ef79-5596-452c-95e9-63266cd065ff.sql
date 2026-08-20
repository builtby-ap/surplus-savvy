
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS display_alias text;

CREATE OR REPLACE FUNCTION public.alias_label(_type public.business_type)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE _type
    WHEN 'bakery' THEN '🥐 Mystery Bakery'
    WHEN 'cafe' THEN '☕ Mystery Café'
    WHEN 'restaurant' THEN '🍱 Secret Kitchen'
    WHEN 'grocery' THEN '🛒 Hidden Market'
    WHEN 'fresh_market' THEN '🥬 Hidden Fresh Market'
    WHEN 'producer' THEN '🏭 Mystery Food Maker'
    WHEN 'convenience' THEN '🛍️ Secret Store'
    WHEN 'snack_shop' THEN '🍩 Mystery Sweets'
    ELSE '🍱 Secret Kitchen'
  END;
$$;

CREATE OR REPLACE FUNCTION public.assign_vendor_alias()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  label text;
  next_num int;
BEGIN
  IF NEW.display_alias IS NULL OR NEW.display_alias = '' THEN
    label := public.alias_label(NEW.type);
    SELECT COALESCE(MAX(NULLIF(regexp_replace(display_alias, '^.*#', ''), '')::int), 0) + 1
      INTO next_num
      FROM public.vendors
     WHERE display_alias LIKE label || ' #%';
    NEW.display_alias := label || ' #' || lpad(next_num::text, 2, '0');
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS vendors_assign_alias ON public.vendors;
CREATE TRIGGER vendors_assign_alias
BEFORE INSERT ON public.vendors
FOR EACH ROW EXECUTE FUNCTION public.assign_vendor_alias();

DO $$
DECLARE r record; label text; next_num int;
BEGIN
  FOR r IN SELECT id, type FROM public.vendors WHERE display_alias IS NULL OR display_alias = '' ORDER BY created_at LOOP
    label := public.alias_label(r.type);
    SELECT COALESCE(MAX(NULLIF(regexp_replace(display_alias, '^.*#', ''), '')::int), 0) + 1
      INTO next_num FROM public.vendors WHERE display_alias LIKE label || ' #%';
    UPDATE public.vendors SET display_alias = label || ' #' || lpad(next_num::text, 2, '0') WHERE id = r.id;
  END LOOP;
END $$;

CREATE OR REPLACE VIEW public.vendors_public
WITH (security_invoker = on) AS
SELECT id, legacy_id, display_alias, type, description, address, neighborhood, city,
       latitude, longitude, rating, review_count, fulfillment, delivery_fee,
       delivery_minimum, meals_rescued, verified, verification_status, created_at
FROM public.vendors;

GRANT SELECT ON public.vendors_public TO anon, authenticated;
GRANT ALL ON public.vendors_public TO service_role;
