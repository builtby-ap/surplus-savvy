CREATE TABLE public.customer_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'Home',
  recipient_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  address_line text NOT NULL DEFAULT '',
  township text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  building_floor text,
  delivery_note text,
  latitude double precision,
  longitude double precision,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_addresses TO authenticated;
GRANT ALL ON public.customer_addresses TO service_role;

ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers manage own addresses"
  ON public.customer_addresses FOR ALL TO authenticated
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

CREATE TRIGGER customer_addresses_updated_at
  BEFORE UPDATE ON public.customer_addresses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.enforce_single_default_address()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.is_default THEN
    UPDATE public.customer_addresses
       SET is_default = false
     WHERE customer_id = NEW.customer_id
       AND id <> NEW.id
       AND is_default;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER customer_addresses_single_default
  AFTER INSERT OR UPDATE OF is_default ON public.customer_addresses
  FOR EACH ROW WHEN (NEW.is_default) EXECUTE FUNCTION public.enforce_single_default_address();

CREATE INDEX customer_addresses_customer_idx ON public.customer_addresses(customer_id);

ALTER TABLE public.orders
  ADD COLUMN delivery_method order_method NOT NULL DEFAULT 'pickup',
  ADD COLUMN delivery_address_id uuid REFERENCES public.customer_addresses(id) ON DELETE SET NULL,
  ADD COLUMN delivery_recipient_name text,
  ADD COLUMN delivery_phone text,
  ADD COLUMN delivery_township text,
  ADD COLUMN delivery_city text,
  ADD COLUMN delivery_building_floor text,
  ADD COLUMN delivery_note text,
  ADD COLUMN delivery_latitude double precision,
  ADD COLUMN delivery_longitude double precision;

UPDATE public.orders SET delivery_method = method;