CREATE TYPE public.review_status AS ENUM ('published','reported','hidden','removed');

CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL DEFAULT auth.uid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  overall_rating smallint NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  food_quality_rating smallint CHECK (food_quality_rating BETWEEN 1 AND 5),
  value_rating smallint CHECK (value_rating BETWEEN 1 AND 5),
  portion_rating smallint CHECK (portion_rating BETWEEN 1 AND 5),
  review_text text NOT NULL DEFAULT '',
  reviewer_name text NOT NULL DEFAULT 'Food rescuer',
  bag_title text,
  status public.review_status NOT NULL DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX reviews_vendor_idx ON public.reviews(vendor_id, created_at DESC);
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visible reviews are public" ON public.reviews FOR SELECT
  USING (status IN ('published','reported') OR customer_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Customers create own reviews" ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Owners and admins update reviews" ON public.reviews FOR UPDATE TO authenticated
  USING (customer_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (customer_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Owners and admins delete reviews" ON public.reviews FOR DELETE TO authenticated
  USING (customer_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.validate_review()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o record;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT * INTO o FROM public.orders WHERE id = NEW.order_id;
    IF NOT FOUND OR o.customer_id <> auth.uid() THEN RAISE EXCEPTION 'You can only review your own orders'; END IF;
    IF o.status NOT IN ('picked_up','delivered') THEN RAISE EXCEPTION 'You can review this business after completing an order'; END IF;
    IF o.vendor_id <> NEW.vendor_id THEN RAISE EXCEPTION 'This order is not from this business'; END IF;
    NEW.customer_id := auth.uid();
    NEW.status := 'published';
    SELECT COALESCE(NULLIF(split_part(full_name,' ',1),''),'Food rescuer') INTO NEW.reviewer_name FROM public.profiles WHERE id = auth.uid();
    NEW.reviewer_name := COALESCE(NEW.reviewer_name,'Food rescuer');
    SELECT title INTO NEW.bag_title FROM public.order_items WHERE order_id = NEW.order_id ORDER BY created_at LIMIT 1;
  ELSE
    IF NOT public.has_role(auth.uid(),'admin') THEN
      NEW.status := OLD.status; NEW.customer_id := OLD.customer_id; NEW.order_id := OLD.order_id;
      NEW.vendor_id := OLD.vendor_id; NEW.reviewer_name := OLD.reviewer_name; NEW.bag_title := OLD.bag_title;
    END IF;
    NEW.updated_at := now();
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER reviews_validate BEFORE INSERT OR UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.validate_review();

CREATE TABLE public.review_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.review_photos TO anon;
GRANT SELECT, INSERT, DELETE ON public.review_photos TO authenticated;
GRANT ALL ON public.review_photos TO service_role;
ALTER TABLE public.review_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Photos follow review visibility" ON public.review_photos FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.reviews r WHERE r.id = review_id));
CREATE POLICY "Owners add photos" ON public.review_photos FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.reviews r WHERE r.id = review_id AND r.customer_id = auth.uid()));
CREATE POLICY "Owners and admins remove photos" ON public.review_photos FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.reviews r WHERE r.id = review_id AND r.customer_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.limit_review_photos()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF (SELECT count(*) FROM public.review_photos WHERE review_id = NEW.review_id) >= 3 THEN
    RAISE EXCEPTION 'Maximum 3 photos per review';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER review_photos_limit BEFORE INSERT ON public.review_photos FOR EACH ROW EXECUTE FUNCTION public.limit_review_photos();

CREATE TABLE public.review_helpful (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (review_id, customer_id)
);
GRANT SELECT ON public.review_helpful TO anon;
GRANT SELECT, INSERT, DELETE ON public.review_helpful TO authenticated;
GRANT ALL ON public.review_helpful TO service_role;
ALTER TABLE public.review_helpful ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Helpful votes are public" ON public.review_helpful FOR SELECT USING (true);
CREATE POLICY "Customers vote as themselves" ON public.review_helpful FOR INSERT TO authenticated WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Customers remove own vote" ON public.review_helpful FOR DELETE TO authenticated USING (customer_id = auth.uid());

CREATE TABLE public.review_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL DEFAULT auth.uid(),
  reason text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  UNIQUE (review_id, customer_id)
);
GRANT SELECT, INSERT, UPDATE ON public.review_reports TO authenticated;
GRANT ALL ON public.review_reports TO service_role;
ALTER TABLE public.review_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reporters and admins read reports" ON public.review_reports FOR SELECT TO authenticated
  USING (customer_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Customers report as themselves" ON public.review_reports FOR INSERT TO authenticated WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Admins resolve reports" ON public.review_reports FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.flag_reported_review()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.customer_id := auth.uid();
  NEW.status := 'open';
  UPDATE public.reviews SET status = 'reported' WHERE id = NEW.review_id AND status = 'published';
  RETURN NEW;
END; $$;
CREATE TRIGGER review_reports_flag BEFORE INSERT ON public.review_reports FOR EACH ROW EXECUTE FUNCTION public.flag_reported_review();

CREATE TRIGGER reviews_updated_at_noop AFTER UPDATE ON public.reviews FOR EACH ROW WHEN (false) EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER reviews_updated_at_noop ON public.reviews;