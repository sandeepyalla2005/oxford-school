-- Ensure accessory_sales exists and is visible to PostgREST schema cache.
-- This fixes admin Accessories pages failing with:
-- "Could not find the table 'public.accessory_sales' in the schema cache"

CREATE TABLE IF NOT EXISTS public.accessory_sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  accessory_id UUID REFERENCES public.accessories(id) ON DELETE CASCADE,
  academic_year TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'qr_code', 'bank_transfer', 'card')),
  receipt_number TEXT UNIQUE NOT NULL,
  collected_by UUID REFERENCES auth.users(id),
  payment_status TEXT NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Backfill columns for projects that still have the older accessory_sales shape.
ALTER TABLE public.accessory_sales
  ADD COLUMN IF NOT EXISTS accessory_id UUID REFERENCES public.accessories(id) ON DELETE CASCADE;

ALTER TABLE public.accessory_sales
  ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1;

ALTER TABLE public.accessory_sales
  ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10,2) NOT NULL DEFAULT 0;

ALTER TABLE public.accessory_sales
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'paid';

UPDATE public.accessory_sales
SET payment_status = 'paid'
WHERE payment_status IS NULL;

ALTER TABLE public.accessory_sales
  ALTER COLUMN payment_status SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_accessory_sales_student_id ON public.accessory_sales(student_id);
CREATE INDEX IF NOT EXISTS idx_accessory_sales_accessory_id ON public.accessory_sales(accessory_id);
CREATE INDEX IF NOT EXISTS idx_accessory_sales_academic_year ON public.accessory_sales(academic_year);
CREATE INDEX IF NOT EXISTS idx_accessory_sales_payment_status ON public.accessory_sales(payment_status);
CREATE INDEX IF NOT EXISTS idx_accessory_sales_created_at ON public.accessory_sales(created_at);

ALTER TABLE public.accessory_sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.accessory_sales;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.accessory_sales;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.accessory_sales;
DROP POLICY IF EXISTS "Admins can manage all accessory sales" ON public.accessory_sales;
DROP POLICY IF EXISTS "Staff can view accessory sales" ON public.accessory_sales;
DROP POLICY IF EXISTS "Staff can only insert accessory sales" ON public.accessory_sales;

CREATE POLICY "Admins can manage all accessory sales" ON public.accessory_sales
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Staff can view accessory sales" ON public.accessory_sales
  FOR SELECT USING (public.is_staff_or_admin());

CREATE POLICY "Staff can only insert accessory sales" ON public.accessory_sales
  FOR INSERT WITH CHECK (public.is_staff_or_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.accessory_sales TO authenticated;
GRANT ALL PRIVILEGES ON public.accessory_sales TO service_role;

-- Force PostgREST schema reload so the table becomes immediately queryable.
NOTIFY pgrst, 'reload schema';
