
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('household', 'collector', 'recycler', 'admin');

-- Create waste type enum
CREATE TYPE public.waste_type AS ENUM ('plastic', 'paper', 'cardboard', 'metal', 'electronics', 'glass');

-- Create pickup status enum
CREATE TYPE public.pickup_status AS ENUM ('requested', 'accepted', 'collector_en_route', 'collected', 'completed');

-- Create order status enum
CREATE TYPE public.order_status AS ENUM ('available', 'reserved', 'sold', 'delivered');

-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  email TEXT,
  city TEXT,
  area TEXT,
  address TEXT,
  role app_role NOT NULL DEFAULT 'household',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'household')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- User roles table (for admin checks via security definer)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Sync user_roles from profiles
CREATE OR REPLACE FUNCTION public.sync_user_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, NEW.role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER sync_profile_role
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_role();

-- Collector profiles
CREATE TABLE public.collectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  vehicle_type TEXT,
  collection_capacity NUMERIC,
  service_area TEXT,
  rating NUMERIC DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.collectors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Collectors viewable by all authenticated" ON public.collectors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Collectors can update own" ON public.collectors FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Collectors can insert own" ON public.collectors FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_collectors_updated_at BEFORE UPDATE ON public.collectors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Pickup requests
CREATE TABLE public.pickup_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  collector_id UUID REFERENCES auth.users(id),
  waste_type waste_type NOT NULL,
  estimated_weight NUMERIC NOT NULL,
  pickup_address TEXT NOT NULL,
  city TEXT,
  area TEXT,
  preferred_time TIMESTAMPTZ,
  status pickup_status NOT NULL DEFAULT 'requested',
  actual_weight NUMERIC,
  payment_amount NUMERIC,
  reward_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pickup_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Households see own requests" ON public.pickup_requests FOR SELECT TO authenticated
  USING (auth.uid() = household_id OR auth.uid() = collector_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('collector', 'admin')));
CREATE POLICY "Households create requests" ON public.pickup_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = household_id);
CREATE POLICY "Collectors and households update requests" ON public.pickup_requests FOR UPDATE TO authenticated
  USING (auth.uid() = household_id OR auth.uid() = collector_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE TRIGGER update_pickup_requests_updated_at BEFORE UPDATE ON public.pickup_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Waste inventory (collector accumulated waste)
CREATE TABLE public.waste_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collector_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  waste_type waste_type NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  price_per_kg NUMERIC NOT NULL,
  status order_status NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.waste_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Inventory viewable by authenticated" ON public.waste_inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "Collectors manage own inventory" ON public.waste_inventory FOR INSERT TO authenticated WITH CHECK (auth.uid() = collector_id);
CREATE POLICY "Collectors update own inventory" ON public.waste_inventory FOR UPDATE TO authenticated USING (auth.uid() = collector_id);

CREATE TRIGGER update_waste_inventory_updated_at BEFORE UPDATE ON public.waste_inventory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Orders (recycler purchases from collectors)
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recycler_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  inventory_id UUID NOT NULL REFERENCES public.waste_inventory(id),
  quantity NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  status order_status NOT NULL DEFAULT 'reserved',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Orders viewable by parties" ON public.orders FOR SELECT TO authenticated
  USING (auth.uid() = recycler_id OR EXISTS (SELECT 1 FROM public.waste_inventory WHERE id = inventory_id AND collector_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Recyclers create orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = recycler_id);
CREATE POLICY "Parties update orders" ON public.orders FOR UPDATE TO authenticated
  USING (auth.uid() = recycler_id OR EXISTS (SELECT 1 FROM public.waste_inventory WHERE id = inventory_id AND collector_id = auth.uid()));

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pickup_request_id UUID REFERENCES public.pickup_requests(id),
  amount NUMERIC NOT NULL,
  payment_type TEXT NOT NULL DEFAULT 'cash',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own payments" ON public.payments FOR SELECT TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "System inserts payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (true);

-- Rewards
CREATE TABLE public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own rewards" ON public.rewards FOR SELECT TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "System inserts rewards" ON public.rewards FOR INSERT TO authenticated WITH CHECK (true);

-- Ratings
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pickup_request_id UUID NOT NULL REFERENCES public.pickup_requests(id),
  household_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  collector_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ratings viewable by authenticated" ON public.ratings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Households create ratings" ON public.ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = household_id);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  type TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System inserts notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
