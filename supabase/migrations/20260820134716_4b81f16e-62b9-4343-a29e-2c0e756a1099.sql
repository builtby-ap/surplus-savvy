-- payment status enum
DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM ('not_required','awaiting_verification','verified','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_status public.payment_status NOT NULL DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS payment_screenshot_url text,
  ADD COLUMN IF NOT EXISTS payment_rejection_reason text;

-- platform MMQR payment settings (single row)
CREATE TABLE IF NOT EXISTS public.payment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_image_url text NOT NULL DEFAULT '',
  account_name text NOT NULL DEFAULT '',
  instructions text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.payment_settings TO anon;
GRANT SELECT ON public.payment_settings TO authenticated;
GRANT ALL ON public.payment_settings TO service_role;

ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Payment settings are public" ON public.payment_settings;
CREATE POLICY "Payment settings are public" ON public.payment_settings
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Admins manage payment settings" ON public.payment_settings;
CREATE POLICY "Admins manage payment settings" ON public.payment_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS payment_settings_updated_at ON public.payment_settings;
CREATE TRIGGER payment_settings_updated_at BEFORE UPDATE ON public.payment_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.payment_settings (qr_image_url, account_name, instructions)
SELECT '', 'Surplus Rescue', 'Scan with any MMQR-supporting banking app and pay the exact total.'
WHERE NOT EXISTS (SELECT 1 FROM public.payment_settings);

-- customer re-uploads a payment screenshot after rejection
CREATE OR REPLACE FUNCTION public.resubmit_payment(order_id uuid, screenshot_url text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.orders o
     SET payment_screenshot_url = screenshot_url,
         payment_status = 'awaiting_verification',
         payment_rejection_reason = NULL
   WHERE o.id = resubmit_payment.order_id
     AND o.customer_id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
END; $$;

GRANT EXECUTE ON FUNCTION public.resubmit_payment(uuid, text) TO authenticated;