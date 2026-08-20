UPDATE public.food_posts SET image_url = NULL WHERE image_url LIKE 'blob:%';
UPDATE public.vendors SET image_url = NULL WHERE image_url LIKE 'blob:%';