ALTER TABLE public.orders ADD COLUMN status_timestamps jsonb NOT NULL DEFAULT '{}'::jsonb;
CREATE FUNCTION public.record_order_status_times() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.status_timestamps := jsonb_build_object(NEW.status::text, clock_timestamp());
  ELSE
    NEW.status_timestamps := OLD.status_timestamps;
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      NEW.status_timestamps := NEW.status_timestamps || jsonb_build_object(NEW.status::text, clock_timestamp());
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.record_order_status_times() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER orders_record_status_times BEFORE INSERT OR UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.record_order_status_times();