DROP POLICY IF EXISTS "Customers upload own payment screenshots" ON storage.objects;
CREATE POLICY "Customers upload own payment screenshots" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'payment-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Customers read own payment screenshots" ON storage.objects;
CREATE POLICY "Customers read own payment screenshots" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'payment-screenshots'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin')
      OR EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.payment_screenshot_url = storage.objects.name
          AND public.owns_vendor(auth.uid(), o.vendor_id)
      )
    )
  );

DROP POLICY IF EXISTS "Customers update own payment screenshots" ON storage.objects;
CREATE POLICY "Customers update own payment screenshots" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'payment-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'payment-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);