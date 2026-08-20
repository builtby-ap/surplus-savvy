CREATE TYPE public.ad_status AS ENUM ('pending','active','rejected','expired');

CREATE TABLE public.advertisements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  requested_start_date date NOT NULL,
  requested_end_date date NOT NULL,
  start_date date,
  end_date date,
  tagline text,
  cost numeric,
  status public.ad_status NOT NULL DEFAULT 'pending',
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.advertisements TO authenticated;
GRANT ALL ON public.advertisements TO service_role;

ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors read own advertisements" ON public.advertisements
  FOR SELECT TO authenticated
  USING (public.owns_vendor(auth.uid(), vendor_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Vendors request advertisements" ON public.advertisements
  FOR INSERT TO authenticated
  WITH CHECK (public.owns_vendor(auth.uid(), vendor_id));

CREATE POLICY "Admins manage advertisements" ON public.advertisements
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete advertisements" ON public.advertisements
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER advertisements_updated_at BEFORE UPDATE ON public.advertisements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX advertisements_vendor_idx ON public.advertisements(vendor_id, created_at DESC);