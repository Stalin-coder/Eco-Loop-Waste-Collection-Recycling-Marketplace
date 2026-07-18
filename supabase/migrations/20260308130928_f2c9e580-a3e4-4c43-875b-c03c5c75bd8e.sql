
-- Fix overly permissive insert policies
DROP POLICY "System inserts payments" ON public.payments;
CREATE POLICY "Authenticated users insert payments" ON public.payments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY "System inserts rewards" ON public.rewards;
CREATE POLICY "Authenticated users insert rewards" ON public.rewards FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY "System inserts notifications" ON public.notifications;
CREATE POLICY "Authenticated users insert notifications" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
