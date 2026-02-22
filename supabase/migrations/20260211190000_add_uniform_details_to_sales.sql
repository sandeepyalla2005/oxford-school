-- Add uniform_type and uniform_size to accessory_sales table
ALTER TABLE public.accessory_sales 
ADD COLUMN IF NOT EXISTS uniform_type TEXT CHECK (uniform_type IN ('cloth', 'readymade')),
ADD COLUMN IF NOT EXISTS uniform_size TEXT;
