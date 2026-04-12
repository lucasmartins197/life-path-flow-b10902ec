ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS subscription_end timestamptz;