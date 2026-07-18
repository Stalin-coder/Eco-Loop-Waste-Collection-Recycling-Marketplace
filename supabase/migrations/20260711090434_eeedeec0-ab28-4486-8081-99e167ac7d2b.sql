
-- Add verified flag to profiles (collectors start unverified; others verified)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT true;

-- Update handle_new_user to set verified=false for collectors
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_role app_role;
BEGIN
  new_role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'household');
  INSERT INTO public.profiles (id, name, email, role, verified)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    new_role,
    CASE WHEN new_role = 'collector' THEN false ELSE true END
  );
  RETURN NEW;
END;
$function$;

-- Backfill: existing collectors remain verified (don't lock them out) — no change needed since default true

-- Create admin user Stalin
DO $$
DECLARE
  admin_id uuid := gen_random_uuid();
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = 'stalin@gmail.com') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', admin_id, 'authenticated', 'authenticated',
      'stalin@gmail.com', crypt('STALIN@2007', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Stalin Admin","role":"admin"}'::jsonb,
      false, '', '', '', ''
    );

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (
      gen_random_uuid(), admin_id,
      jsonb_build_object('sub', admin_id::text, 'email', 'stalin@gmail.com', 'email_verified', true),
      'email', admin_id::text, now(), now(), now()
    );

    -- Ensure profile + user_roles set to admin (trigger should handle, but enforce)
    INSERT INTO public.profiles (id, name, email, role, verified)
    VALUES (admin_id, 'Stalin Admin', 'stalin@gmail.com', 'admin', true)
    ON CONFLICT (id) DO UPDATE SET role = 'admin', verified = true;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;

-- Allow admins to update any profile (for verification)
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
