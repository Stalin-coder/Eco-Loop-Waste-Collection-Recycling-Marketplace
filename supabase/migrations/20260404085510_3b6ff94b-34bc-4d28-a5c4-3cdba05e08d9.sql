
-- Drop the existing UPDATE policy
DROP POLICY IF EXISTS "Collectors and households update requests" ON public.pickup_requests;

-- Recreate with condition allowing collectors to claim unassigned pickups
CREATE POLICY "Collectors and households update requests"
ON public.pickup_requests
FOR UPDATE
TO authenticated
USING (
  (auth.uid() = household_id)
  OR (auth.uid() = collector_id)
  OR (
    -- Allow any collector to claim an unassigned pickup
    collector_id IS NULL
    AND status = 'requested'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'collector'
    )
  )
  OR (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
);
