
-- Create pickup_subscriptions table
CREATE TABLE public.pickup_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL,
  waste_types TEXT[] NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'weekly',
  pickup_day TEXT NOT NULL DEFAULT 'sunday',
  preferred_time TEXT,
  pickup_address TEXT NOT NULL,
  city TEXT,
  area TEXT,
  estimated_weight NUMERIC NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_generated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pickup_subscriptions ENABLE ROW LEVEL SECURITY;

-- Households manage own subscriptions
CREATE POLICY "Households manage own subscriptions"
  ON public.pickup_subscriptions
  FOR ALL
  USING (auth.uid() = household_id)
  WITH CHECK (auth.uid() = household_id);

-- Collectors and admins can view subscriptions
CREATE POLICY "Collectors and admins view subscriptions"
  ON public.pickup_subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('collector', 'admin', 'municipality')
    )
  );

-- Updated at trigger
CREATE TRIGGER update_pickup_subscriptions_updated_at
  BEFORE UPDATE ON public.pickup_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
