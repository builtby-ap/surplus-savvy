
CREATE TABLE public.points_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  points_per_1000_mmk integer NOT NULL DEFAULT 1,
  first_order_bonus integer NOT NULL DEFAULT 100,
  review_points integer NOT NULL DEFAULT 20,
  bags_5_bonus integer NOT NULL DEFAULT 100,
  bags_10_bonus integer NOT NULL DEFAULT 250,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.points_settings TO authenticated;
GRANT ALL ON public.points_settings TO service_role;
ALTER TABLE public.points_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users read point rules" ON public.points_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins update point rules" ON public.points_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER points_settings_updated_at BEFORE UPDATE ON public.points_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.points_settings (id) VALUES (true);

CREATE TABLE public.rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  points_cost integer NOT NULL CHECK (points_cost > 0),
  discount_mmk numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rewards TO authenticated;
GRANT ALL ON public.rewards TO service_role;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users read active rewards" ON public.rewards FOR SELECT TO authenticated USING (is_active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage rewards" ON public.rewards FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER rewards_updated_at BEFORE UPDATE ON public.rewards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.rewards (title, description, points_cost, discount_mmk) VALUES
 ('1,000 MMK OFF','1,000 MMK off your next surprise bag',100,1000),
 ('3,000 MMK OFF','3,000 MMK off your next surprise bag',250,3000),
 ('7,000 MMK OFF','7,000 MMK off your next surprise bag',500,7000);

CREATE TABLE public.point_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  points integer NOT NULL,
  kind text NOT NULL,
  reason text NOT NULL,
  ref text NOT NULL,
  order_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (customer_id, ref)
);
CREATE INDEX point_transactions_customer_idx ON public.point_transactions (customer_id, created_at DESC);
GRANT SELECT ON public.point_transactions TO authenticated;
GRANT ALL ON public.point_transactions TO service_role;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers read own points" ON public.point_transactions FOR SELECT TO authenticated USING (customer_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.reward_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  reward_id uuid NOT NULL REFERENCES public.rewards(id),
  reward_title text NOT NULL,
  points_spent integer NOT NULL,
  code text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reward_redemptions TO authenticated;
GRANT ALL ON public.reward_redemptions TO service_role;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers read own redemptions" ON public.reward_redemptions FOR SELECT TO authenticated USING (customer_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- Award / reverse order points
CREATE OR REPLACE FUNCTION public.award_order_points()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.points_settings; pts int; done_count int; bags int; earned int;
BEGIN
  SELECT * INTO s FROM public.points_settings LIMIT 1;
  IF NEW.status IN ('picked_up','delivered') AND OLD.status NOT IN ('picked_up','delivered') THEN
    pts := floor(NEW.total / 1000) * s.points_per_1000_mmk;
    IF pts > 0 THEN
      INSERT INTO public.point_transactions (customer_id, points, kind, reason, ref, order_id)
      VALUES (NEW.customer_id, pts, 'order', 'Completed Order #' || NEW.receipt_number, 'order:' || NEW.id, NEW.id)
      ON CONFLICT DO NOTHING;
    END IF;
    SELECT count(*) INTO done_count FROM public.orders WHERE customer_id = NEW.customer_id AND status IN ('picked_up','delivered');
    IF done_count >= 1 AND s.first_order_bonus > 0 THEN
      INSERT INTO public.point_transactions (customer_id, points, kind, reason, ref, order_id)
      VALUES (NEW.customer_id, s.first_order_bonus, 'bonus', 'First Order Bonus', 'first_order', NEW.id) ON CONFLICT DO NOTHING;
    END IF;
    SELECT COALESCE(sum(oi.quantity),0) INTO bags FROM public.order_items oi JOIN public.orders o ON o.id = oi.order_id
      WHERE o.customer_id = NEW.customer_id AND o.status IN ('picked_up','delivered');
    IF bags >= 5 AND s.bags_5_bonus > 0 THEN
      INSERT INTO public.point_transactions (customer_id, points, kind, reason, ref, order_id)
      VALUES (NEW.customer_id, s.bags_5_bonus, 'bonus', '5 Bags Rescued Bonus', 'bags5', NEW.id) ON CONFLICT DO NOTHING;
    END IF;
    IF bags >= 10 AND s.bags_10_bonus > 0 THEN
      INSERT INTO public.point_transactions (customer_id, points, kind, reason, ref, order_id)
      VALUES (NEW.customer_id, s.bags_10_bonus, 'bonus', '10 Bags Rescued Bonus', 'bags10', NEW.id) ON CONFLICT DO NOTHING;
    END IF;
  ELSIF OLD.status IN ('picked_up','delivered') AND NEW.status IN ('cancelled','rejected') THEN
    SELECT points INTO earned FROM public.point_transactions WHERE customer_id = NEW.customer_id AND ref = 'order:' || NEW.id;
    IF earned IS NOT NULL THEN
      INSERT INTO public.point_transactions (customer_id, points, kind, reason, ref, order_id)
      VALUES (NEW.customer_id, -earned, 'reversal', 'Refunded Order #' || NEW.receipt_number, 'reversal:' || NEW.id, NEW.id)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER orders_award_points AFTER UPDATE OF status ON public.orders FOR EACH ROW EXECUTE FUNCTION public.award_order_points();

CREATE OR REPLACE FUNCTION public.award_review_points()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p int;
BEGIN
  SELECT review_points INTO p FROM public.points_settings LIMIT 1;
  IF p > 0 THEN
    INSERT INTO public.point_transactions (customer_id, points, kind, reason, ref, order_id)
    VALUES (NEW.customer_id, p, 'review', 'Review Submitted', 'review:' || NEW.id, NEW.order_id) ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER reviews_award_points AFTER INSERT ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.award_review_points();

CREATE OR REPLACE FUNCTION public.redeem_reward(_reward_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.rewards; bal int; new_code text; rid uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Please sign in'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(auth.uid()::text));
  SELECT * INTO r FROM public.rewards WHERE id = _reward_id AND is_active;
  IF NOT FOUND THEN RAISE EXCEPTION 'This reward is not available'; END IF;
  SELECT COALESCE(sum(points),0) INTO bal FROM public.point_transactions WHERE customer_id = auth.uid();
  IF bal < r.points_cost THEN RAISE EXCEPTION 'Not enough points'; END IF;
  new_code := 'PLM-' || upper(substr(md5(gen_random_uuid()::text),1,8));
  INSERT INTO public.reward_redemptions (customer_id, reward_id, reward_title, points_spent, code)
  VALUES (auth.uid(), r.id, r.title, r.points_cost, new_code) RETURNING id INTO rid;
  INSERT INTO public.point_transactions (customer_id, points, kind, reason, ref)
  VALUES (auth.uid(), -r.points_cost, 'redeem', 'Reward Redeemed: ' || r.title, 'redeem:' || rid);
  RETURN new_code;
END; $$;
REVOKE EXECUTE ON FUNCTION public.redeem_reward(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.redeem_reward(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.award_order_points() FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.award_review_points() FROM anon, public, authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.point_transactions;
