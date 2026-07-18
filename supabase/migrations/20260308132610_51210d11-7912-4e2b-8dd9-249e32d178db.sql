
-- Buildings table for apartment/bulk waste mode
CREATE TABLE public.buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT,
  area TEXT,
  num_households INTEGER NOT NULL DEFAULT 1,
  weekly_pickup_day TEXT, -- 'monday', 'tuesday', etc.
  total_waste_collected NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Building admins manage own buildings" ON public.buildings
  FOR ALL TO authenticated USING (auth.uid() = admin_user_id) WITH CHECK (auth.uid() = admin_user_id);

CREATE POLICY "Collectors and admins view buildings" ON public.buildings
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('collector', 'admin'))
  );

CREATE TRIGGER update_buildings_updated_at BEFORE UPDATE ON public.buildings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add pickup_type to pickup_requests for bulk vs regular
ALTER TABLE public.pickup_requests ADD COLUMN pickup_type TEXT NOT NULL DEFAULT 'regular';
ALTER TABLE public.pickup_requests ADD COLUMN building_id UUID REFERENCES public.buildings(id);
