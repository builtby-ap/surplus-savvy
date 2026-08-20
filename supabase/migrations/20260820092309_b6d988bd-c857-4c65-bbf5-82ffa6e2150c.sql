ALTER TABLE public.vendors
  ALTER COLUMN owner_id DROP NOT NULL,
  ADD COLUMN legacy_id TEXT UNIQUE,
  ADD COLUMN meals_rescued INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN verified BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.food_posts
  ADD COLUMN legacy_id TEXT UNIQUE,
  ADD COLUMN rating NUMERIC(2,1) NOT NULL DEFAULT 0;

-- ===== Demo auth accounts =====
DO $$
DECLARE
  admin_uid UUID := '33333333-3333-4333-8333-333333333333';
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT * FROM (VALUES
      ('11111111-1111-4111-8111-111111111111'::uuid, 'customer@example.com', 'customer123', 'Aye Pyae', '09123456789', 'customer'),
      ('22222222-2222-4222-8222-222222222222'::uuid, 'vendor@example.com', 'vendor123', 'Golden Crust Bakery', '09123456789', 'food_vendor'),
      ('33333333-3333-4333-8333-333333333333'::uuid, 'admin@phoelamin.com', 'admin123', 'Platform Administrator', NULL, 'admin')
    ) AS t(uid, email, pwd, full_name, phone, role)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = rec.uid) THEN
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000000', rec.uid, 'authenticated', 'authenticated',
        rec.email, crypt(rec.pwd, gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', rec.full_name, 'phone', rec.phone, 'role', rec.role),
        now(), now()
      );

      INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
      VALUES (
        rec.uid::text, rec.uid,
        jsonb_build_object('sub', rec.uid::text, 'email', rec.email, 'email_verified', true, 'phone_verified', false),
        'email', now(), now(), now()
      );
    END IF;
  END LOOP;

  INSERT INTO public.user_roles (user_id, role) VALUES (admin_uid, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  DELETE FROM public.user_roles WHERE user_id = admin_uid AND role <> 'admin';
END $$;

-- ===== Vendors =====
INSERT INTO public.vendors (legacy_id, owner_id, name, type, description, address, neighborhood, city, latitude, longitude, logo_initials, rating, review_count, fulfillment, delivery_fee, delivery_minimum, verification_status, meals_rescued, verified)
VALUES
  ('b1', '22222222-2222-4222-8222-222222222222', 'Golden Crust Bakery', 'bakery', 'Family bakery baking sourdough, croissants and cakes fresh every morning since 1998.', '18 Maple Street', 'Old Town', 'Old Town', 51.5121, -0.1230, 'GC', 4.8, 412, 'both', 2.50, 10, 'approved', 3120, true),
  ('b2', NULL, 'Saffron House Kitchen', 'restaurant', 'Slow-cooked curries, grilled plates and rice bowls made in small batches.', '44 River Road', 'Riverside', 'Riverside', 51.5052, -0.1108, 'SH', 4.6, 289, 'both', 2.50, 10, 'approved', 2480, true),
  ('b3', NULL, 'Cloud & Bean Cafe', 'cafe', 'Neighbourhood coffee bar with pastries, sandwiches and cold brew on tap.', '7 Lantern Lane', 'Midtown', 'Midtown', 51.5194, -0.1370, 'CB', 4.7, 356, 'pickup', 0, 0, 'approved', 1890, true),
  ('b4', NULL, 'Greenfield Grocers', 'grocery', 'Independent grocery with pantry staples, dairy and chilled goods.', '120 Harvest Avenue', 'Northgate', 'Northgate', 51.5285, -0.1180, 'GG', 4.4, 198, 'both', 2.50, 10, 'approved', 4210, true),
  ('b5', NULL, 'Sunrise Fresh Market', 'fresh_market', 'Open-air market stalls with seasonal fruit, vegetables and herbs.', '3 Market Square', 'Old Town', 'Old Town', 51.5142, -0.1300, 'SF', 4.5, 233, 'pickup', 0, 0, 'approved', 2760, false),
  ('b6', NULL, 'Crunch Corner', 'snack_shop', 'Crisps, nuts, dried fruit and sweet treats by weight.', '51 Beacon Street', 'Midtown', 'Midtown', 51.5170, -0.1420, 'CC', 4.2, 96, 'pickup', 0, 0, 'approved', 640, false),
  ('b7', NULL, 'NightOwl Convenience', 'convenience', 'Late-night shop for drinks, ready meals and everyday essentials.', '88 Station Way', 'Station District', 'Station District', 51.5300, -0.1250, 'NO', 4.1, 141, 'both', 2.50, 10, 'approved', 1120, true),
  ('b8', NULL, 'Meadowmilk Dairy Co.', 'producer', 'Small-batch yoghurt, butter and cheese from a family dairy outside the city.', 'Unit 4, Meadow Works', 'Southfields', 'Southfields', 51.4950, -0.1180, 'MD', 4.9, 87, 'delivery', 2.50, 10, 'approved', 980, true),
  ('b9', NULL, 'Basil & Fig Trattoria', 'restaurant', 'Wood-fired pizza and handmade pasta served in a tiny 20-seat dining room.', '22 Olive Court', 'Riverside', 'Riverside', 51.5030, -0.1200, 'BF', 4.7, 302, 'both', 2.50, 10, 'approved', 1740, true),
  ('b10', NULL, 'Sweet Thistle Patisserie', 'bakery', 'Layer cakes, tarts and macarons made fresh daily, never sold the next day.', '9 Rosewood Place', 'Northgate', 'Northgate', 51.5320, -0.1050, 'ST', 4.8, 214, 'pickup', 0, 0, 'approved', 1330, true)
ON CONFLICT (legacy_id) DO NOTHING;

-- ===== Food posts =====
INSERT INTO public.food_posts (legacy_id, vendor_id, title, description, category, original_price, discounted_price, quantity_left, total_quantity, available_from, available_until, fulfillment, pickup_instructions, is_available, rating)
SELECT s.legacy_id, v.id, s.title, s.description, s.category::public.bag_category, s.original_price, s.discounted_price,
       s.quantity_left, s.total_quantity, s.available_from::time, s.available_until::time, s.fulfillment::public.fulfillment_type,
       'Come to the counter and give your receipt number to a staff member.', true, s.rating
FROM (VALUES
  ('m1','b1','Morning Bakers'' Bag','A mix of croissants, rolls and yesterday''s sourdough loaves.','bakery',24,7.5,3,12,'17:30','19:00','both',4.8),
  ('m2','b1','Sweet Pastry Surprise','Danishes, cinnamon buns and fruit tarts from the afternoon tray.','desserts',18,6,1,8,'18:00','19:30','pickup',4.7),
  ('m3','b2','Chef''s Dinner Rescue','Two to three portions of the day''s curries, rice and sides.','mixed_meals',32,11,5,10,'20:30','22:00','both',4.6),
  ('m4','b2','Lunch Box Bundle','Assorted lunch boxes left from the midday service.','mixed_meals',21,8,0,6,'14:30','15:30','pickup',4.4),
  ('m5','b3','Cafe Counter Bag','Sandwiches, muffins and a pastry or two from the counter.','bakery',19,6.5,4,9,'16:30','18:00','pickup',4.7),
  ('m6','b3','Cold Brew Rescue Pack','Bottled cold brew, iced teas and juices close to date.','beverages',15,5,6,10,'17:00','18:30','pickup',4.3),
  ('m7','b4','Pantry Staples Box','Pasta, sauces, tinned goods and cereal near best-before.','grocery',30,10,8,15,'18:00','20:30','both',4.5),
  ('m8','b4','Chilled Dairy Bag','Yoghurt, milk, cheese and butter from the chilled aisle.','grocery',26,9,2,10,'19:00','20:30','delivery',4.4),
  ('m9','b5','Market Veg Haul','A generous mix of seasonal vegetables from closing stalls.','produce',22,6,7,14,'15:30','17:00','pickup',4.6),
  ('m10','b5','Ripe & Ready Fruit Bag','Very ripe fruit, perfect for smoothies and baking today.','produce',16,4.5,3,12,'15:30','17:00','pickup',4.5),
  ('m11','b6','Snack Attack Bag','Crisps, popcorn, nuts and chocolate bars near date.','snacks',14,4,9,12,'17:00','19:00','pickup',4.2),
  ('m12','b6','Dried Fruit & Nut Mix','Mixed bags of dried mango, apricots, almonds and cashews.','snacks',18,6,2,6,'17:30','19:00','pickup',4.1),
  ('m13','b7','Late Night Essentials','Ready meals, bread, drinks and small essentials.','grocery',20,7,5,10,'21:30','23:30','both',4.0),
  ('m14','b7','Fridge Drinks Bundle','Soft drinks, energy drinks and iced coffee near date.','beverages',13,4,4,8,'21:00','23:00','pickup',4.1),
  ('m15','b8','Dairy Producer Crate','Yoghurt pots, butter blocks and a wedge of cheese.','grocery',34,12,3,8,'10:00','13:00','delivery',4.9),
  ('m16','b9','Trattoria Family Bag','Pizza slices, pasta portions and garlic bread for two.','mixed_meals',36,12.5,2,8,'21:00','22:30','both',4.7),
  ('m17','b9','Fresh Pasta Rescue','Handmade pasta and sauces made this morning.','grocery',24,8.5,6,10,'20:00','21:30','pickup',4.6),
  ('m18','b10','Patisserie Cake Box','Two or three cake slices plus macarons from the display.','desserts',28,9.5,1,6,'18:30','19:30','pickup',4.9),
  ('m19','b10','Tart & Treats Bag','Fruit tarts, brownies and eclairs from today''s bake.','desserts',22,7,4,8,'18:30','19:30','pickup',4.8),
  ('m20','b1','Bread Basket Bundle','Assorted loaves: rye, seeded, focaccia and baguettes.','bakery',20,6,5,10,'18:30','19:30','both',4.7)
) AS s(legacy_id, vendor_legacy, title, description, category, original_price, discounted_price, quantity_left, total_quantity, available_from, available_until, fulfillment, rating)
JOIN public.vendors v ON v.legacy_id = s.vendor_legacy
ON CONFLICT (legacy_id) DO NOTHING;