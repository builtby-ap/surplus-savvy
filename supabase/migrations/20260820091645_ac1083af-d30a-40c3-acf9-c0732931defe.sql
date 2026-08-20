-- ===== Enums =====
CREATE TYPE public.app_role AS ENUM ('customer', 'food_vendor', 'admin');
CREATE TYPE public.account_status AS ENUM ('active', 'suspended');
CREATE TYPE public.business_type AS ENUM ('restaurant','cafe','bakery','grocery','fresh_market','snack_shop','convenience','producer');
CREATE TYPE public.bag_category AS ENUM ('mixed_meals','bakery','grocery','produce','snacks','beverages','desserts');
CREATE TYPE public.fulfillment_type AS ENUM ('pickup','delivery','both');
CREATE TYPE public.vendor_status AS ENUM ('pending','approved','rejected','deactivated');
CREATE TYPE public.order_method AS ENUM ('pickup','delivery');
CREATE TYPE public.order_status AS ENUM ('pending','confirmed','preparing','ready','out_for_delivery','picked_up','delivered','cancelled','rejected');

-- ===== Shared helpers =====
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ===== Profiles =====
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT,
  status public.account_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ===== Roles =====
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- New signups get a profile + customer role automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.email, ''),
    NEW.raw_user_meta_data ->> 'phone'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    CASE WHEN NEW.raw_user_meta_data ->> 'role' = 'food_vendor'
         THEN 'food_vendor'::public.app_role
         ELSE 'customer'::public.app_role END
  )
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== Vendors =====
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type public.business_type NOT NULL DEFAULT 'cafe',
  description TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  neighborhood TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  phone TEXT,
  email TEXT,
  logo_initials TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  rating NUMERIC(2,1) NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  fulfillment public.fulfillment_type NOT NULL DEFAULT 'pickup',
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_minimum NUMERIC(10,2) NOT NULL DEFAULT 0,
  verification_status public.vendor_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  business_license_name TEXT,
  business_license_url TEXT,
  fda_approval_name TEXT,
  fda_approval_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX vendors_owner_idx ON public.vendors(owner_id);
GRANT SELECT ON public.vendors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendors TO authenticated;
GRANT ALL ON public.vendors TO service_role;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved vendors are public" ON public.vendors FOR SELECT TO anon, authenticated
  USING (verification_status = 'approved');
CREATE POLICY "Owners read own vendor" ON public.vendors FOR SELECT TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners create own vendor" ON public.vendors FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners update own vendor" ON public.vendors FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Admins manage vendors" ON public.vendors FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER vendors_updated_at BEFORE UPDATE ON public.vendors
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.owns_vendor(_user_id UUID, _vendor_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.vendors WHERE id = _vendor_id AND owner_id = _user_id);
$$;

-- ===== Food posts =====
CREATE TABLE public.food_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category public.bag_category NOT NULL DEFAULT 'mixed_meals',
  original_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  discounted_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  quantity_left INTEGER NOT NULL DEFAULT 0,
  total_quantity INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  available_from TIME NOT NULL DEFAULT '09:00',
  available_until TIME NOT NULL DEFAULT '21:00',
  fulfillment public.fulfillment_type NOT NULL DEFAULT 'pickup',
  pickup_instructions TEXT NOT NULL DEFAULT '',
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX food_posts_vendor_idx ON public.food_posts(vendor_id);
GRANT SELECT ON public.food_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.food_posts TO authenticated;
GRANT ALL ON public.food_posts TO service_role;
ALTER TABLE public.food_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Available posts of approved vendors are public" ON public.food_posts FOR SELECT TO anon, authenticated
  USING (
    is_available
    AND EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.verification_status = 'approved')
  );
CREATE POLICY "Vendors read own posts" ON public.food_posts FOR SELECT TO authenticated
  USING (public.owns_vendor(auth.uid(), vendor_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Vendors write own posts" ON public.food_posts FOR INSERT TO authenticated
  WITH CHECK (public.owns_vendor(auth.uid(), vendor_id));
CREATE POLICY "Vendors update own posts" ON public.food_posts FOR UPDATE TO authenticated
  USING (public.owns_vendor(auth.uid(), vendor_id) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.owns_vendor(auth.uid(), vendor_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Vendors delete own posts" ON public.food_posts FOR DELETE TO authenticated
  USING (public.owns_vendor(auth.uid(), vendor_id) OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER food_posts_updated_at BEFORE UPDATE ON public.food_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== Orders =====
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE RESTRICT,
  receipt_number TEXT NOT NULL UNIQUE,
  method public.order_method NOT NULL DEFAULT 'pickup',
  status public.order_status NOT NULL DEFAULT 'pending',
  notes TEXT NOT NULL DEFAULT '',
  delivery_address TEXT,
  pickup_window TEXT,
  original_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  item_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  placed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX orders_customer_idx ON public.orders(customer_id);
CREATE INDEX orders_vendor_idx ON public.orders(vendor_id);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers read own orders" ON public.orders FOR SELECT TO authenticated
  USING (auth.uid() = customer_id OR public.owns_vendor(auth.uid(), vendor_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Customers create own orders" ON public.orders FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers and vendors update orders" ON public.orders FOR UPDATE TO authenticated
  USING (auth.uid() = customer_id OR public.owns_vendor(auth.uid(), vendor_id) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = customer_id OR public.owns_vendor(auth.uid(), vendor_id) OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  food_post_id UUID REFERENCES public.food_posts(id) ON DELETE SET NULL,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  original_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX order_items_order_idx ON public.order_items(order_id);
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read items of visible orders" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_id
      AND (o.customer_id = auth.uid() OR public.owns_vendor(auth.uid(), o.vendor_id) OR public.has_role(auth.uid(), 'admin'))
  ));
CREATE POLICY "Customers add items to own orders" ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.customer_id = auth.uid()));

-- ===== Saved addresses =====
CREATE TABLE public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Home',
  recipient TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  line1 TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  notes TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX addresses_user_idx ON public.addresses(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT ALL ON public.addresses TO service_role;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own addresses" ON public.addresses FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER addresses_updated_at BEFORE UPDATE ON public.addresses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== Preferences =====
CREATE TABLE public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  order_updates BOOLEAN NOT NULL DEFAULT true,
  new_posts_nearby BOOLEAN NOT NULL DEFAULT true,
  marketing_emails BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.user_preferences TO authenticated;
GRANT ALL ON public.user_preferences TO service_role;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own preferences" ON public.user_preferences FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER user_preferences_updated_at BEFORE UPDATE ON public.user_preferences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();