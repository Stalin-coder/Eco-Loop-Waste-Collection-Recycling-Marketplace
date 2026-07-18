-- Add cancelled status to pickup_status enum
ALTER TYPE public.pickup_status ADD VALUE IF NOT EXISTS 'cancelled';

-- Enable realtime for pickup_requests table
ALTER PUBLICATION supabase_realtime ADD TABLE public.pickup_requests;