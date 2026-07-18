
-- 1. Harden SECURITY DEFINER functions
ALTER FUNCTION public.has_role(uuid, public.app_role) SECURITY INVOKER;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_user_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- 2. profiles: restrict SELECT
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users view own or related profiles" ON public.profiles
FOR SELECT TO authenticated
USING (
  auth.uid() = id
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.pickup_requests pr
    WHERE (pr.household_id = profiles.id AND pr.collector_id = auth.uid())
       OR (pr.collector_id = profiles.id AND pr.household_id = auth.uid())
  )
);

-- 3. collectors: restrict
DROP POLICY IF EXISTS "Collectors viewable by all authenticated" ON public.collectors;
CREATE POLICY "Collectors view scoped" ON public.collectors
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'municipality')
  OR EXISTS (
    SELECT 1 FROM public.pickup_requests pr
    WHERE pr.collector_id = collectors.user_id AND pr.household_id = auth.uid()
  )
);

-- 4. ratings: restrict to involved parties + admin
DROP POLICY IF EXISTS "Ratings viewable by authenticated" ON public.ratings;
CREATE POLICY "Ratings viewable by parties" ON public.ratings
FOR SELECT TO authenticated
USING (
  auth.uid() = household_id
  OR auth.uid() = collector_id
  OR public.has_role(auth.uid(), 'admin')
);

-- 5. waste_inventory: restrict
DROP POLICY IF EXISTS "Inventory viewable by authenticated" ON public.waste_inventory;
CREATE POLICY "Inventory viewable scoped" ON public.waste_inventory
FOR SELECT TO authenticated
USING (
  auth.uid() = collector_id
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'recycler')
);

-- 6. announcements: scope by city/role
DROP POLICY IF EXISTS "Users can view announcements" ON public.announcements;
CREATE POLICY "Users view relevant announcements" ON public.announcements
FOR SELECT TO authenticated
USING (
  auth.uid() = municipality_user_id
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (announcements.city IS NULL OR p.city = announcements.city)
      AND (announcements.target_role IS NULL OR announcements.target_role = p.role::text)
  )
);

-- 7. cleanup_drives: scope by city
DROP POLICY IF EXISTS "Everyone can view drives" ON public.cleanup_drives;
CREATE POLICY "Users view city drives" ON public.cleanup_drives
FOR SELECT TO authenticated
USING (
  auth.uid() = municipality_user_id
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.city = cleanup_drives.city
  )
);

-- 8. pickup_requests: tighten collector SELECT (realtime exposure)
DROP POLICY IF EXISTS "Households see own requests" ON public.pickup_requests;
CREATE POLICY "Pickup requests scoped view" ON public.pickup_requests
FOR SELECT TO authenticated
USING (
  auth.uid() = household_id
  OR auth.uid() = collector_id
  OR public.has_role(auth.uid(), 'admin')
  OR (
    collector_id IS NULL
    AND status = 'requested'::pickup_status
    AND public.has_role(auth.uid(), 'collector')
  )
);

-- 9. Storage: waste-photos policies
DROP POLICY IF EXISTS "Public read waste photos" ON storage.objects;
DROP POLICY IF EXISTS "Users upload waste photos" ON storage.objects;

CREATE POLICY "Waste photos upload own folder" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'waste-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Waste photos scoped read" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'waste-photos'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.pickup_requests pr
      WHERE pr.photo_url LIKE '%' || storage.objects.name
        AND (pr.household_id = auth.uid() OR pr.collector_id = auth.uid())
    )
  )
);
