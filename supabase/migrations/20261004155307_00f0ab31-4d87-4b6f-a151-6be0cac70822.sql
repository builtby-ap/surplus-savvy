CREATE TYPE public.bag_category_v2 AS ENUM ('mixed_meals','rice_meals','noodles','fast_food','bbq_grills','bakery','desserts_cakes','cafe_tea','beverages');

ALTER TABLE public.food_posts ALTER COLUMN category DROP DEFAULT;

-- Hide records that no longer fit any category (grocery / produce) so an admin can review them.
UPDATE public.food_posts SET is_available = false WHERE category::text IN ('grocery','produce');

ALTER TABLE public.food_posts ALTER COLUMN category TYPE public.bag_category_v2 USING (
  CASE
    WHEN title ILIKE '%fried chicken%' THEN 'fast_food'
    WHEN title ILIKE '%chicken bowl%' THEN 'rice_meals'
    WHEN title LIKE '%မုန့်ဟင်းခါး%' OR title ILIKE '%pasta%' OR title ILIKE '%noodle%' THEN 'noodles'
    WHEN title ILIKE '%cold brew%' OR title ILIKE '%coffee%' OR title ILIKE '%tea%' THEN 'cafe_tea'
    WHEN category::text = 'desserts' THEN 'desserts_cakes'
    WHEN category::text = 'snacks' AND title ILIKE '%dried fruit%' THEN 'desserts_cakes'
    WHEN category::text = 'snacks' THEN 'fast_food'
    WHEN category::text IN ('grocery','produce') THEN 'mixed_meals'
    ELSE category::text
  END
)::public.bag_category_v2;

DROP TYPE public.bag_category;
ALTER TYPE public.bag_category_v2 RENAME TO bag_category;
ALTER TABLE public.food_posts ALTER COLUMN category SET DEFAULT 'mixed_meals';