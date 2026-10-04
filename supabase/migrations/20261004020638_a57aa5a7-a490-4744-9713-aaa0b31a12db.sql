ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS reward_code text, ADD COLUMN IF NOT EXISTS reward_discount numeric NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.apply_reward_code()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE red public.reward_redemptions; amt numeric;
BEGIN
  NEW.reward_discount := 0;
  IF NEW.reward_code IS NULL OR btrim(NEW.reward_code) = '' THEN
    NEW.reward_code := NULL; RETURN NEW;
  END IF;
  NEW.reward_code := upper(btrim(NEW.reward_code));
  SELECT * INTO red FROM public.reward_redemptions
    WHERE code = NEW.reward_code AND customer_id = NEW.customer_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'This reward code is not valid for your account'; END IF;
  IF red.status = 'used' THEN RAISE EXCEPTION 'This reward code has already been used'; END IF;
  SELECT discount_mmk INTO amt FROM public.rewards WHERE id = red.reward_id;
  amt := LEAST(COALESCE(amt,0), NEW.item_price);
  NEW.reward_discount := amt;
  NEW.total := GREATEST(NEW.item_price - amt, 0) + NEW.delivery_fee;
  UPDATE public.reward_redemptions SET status = 'used' WHERE id = red.id;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.apply_reward_code() FROM anon, public, authenticated;
CREATE TRIGGER orders_apply_reward_code BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.apply_reward_code();

-- Give the code back if the order is cancelled or rejected.
CREATE OR REPLACE FUNCTION public.release_reward_code()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.reward_code IS NOT NULL AND NEW.status IN ('cancelled','rejected')
     AND OLD.status NOT IN ('cancelled','rejected') THEN
    UPDATE public.reward_redemptions SET status = 'active'
      WHERE code = NEW.reward_code AND customer_id = NEW.customer_id;
  END IF;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.release_reward_code() FROM anon, public, authenticated;
CREATE TRIGGER orders_release_reward_code AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.release_reward_code();

-- Customers may not change reward fields after placing an order.
CREATE OR REPLACE FUNCTION public.lock_reward_fields()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.reward_code := OLD.reward_code;
  NEW.reward_discount := OLD.reward_discount;
  RETURN NEW;
END; $$;
CREATE TRIGGER orders_lock_reward_fields BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.lock_reward_fields();