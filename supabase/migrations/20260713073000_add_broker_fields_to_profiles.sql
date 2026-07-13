
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS broker_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS broker_license_number text;
