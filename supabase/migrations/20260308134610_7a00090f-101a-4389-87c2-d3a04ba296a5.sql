
-- Add municipality to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'municipality';

-- Create cleanup_drives table
CREATE TABLE public.cleanup_drives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  municipality_user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  city text NOT NULL,
  area text,
  drive_date timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'upcoming',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.cleanup_drives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Municipality manages own drives" ON public.cleanup_drives
  FOR ALL TO authenticated
  USING (auth.uid() = municipality_user_id)
  WITH CHECK (auth.uid() = municipality_user_id);

CREATE POLICY "Everyone can view drives" ON public.cleanup_drives
  FOR SELECT TO authenticated
  USING (true);

-- Create announcements table
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  municipality_user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  city text,
  area text,
  target_role text DEFAULT 'household',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Municipality manages own announcements" ON public.announcements
  FOR ALL TO authenticated
  USING (auth.uid() = municipality_user_id)
  WITH CHECK (auth.uid() = municipality_user_id);

CREATE POLICY "Users can view announcements" ON public.announcements
  FOR SELECT TO authenticated
  USING (true);
