-- Add 'swipping' to payment method check constraints

-- Course Payments
ALTER TABLE public.course_payments DROP CONSTRAINT course_payments_payment_method_check;
ALTER TABLE public.course_payments ADD CONSTRAINT course_payments_payment_method_check 
  CHECK (payment_method IN ('cash', 'qr_code', 'bank_transfer', 'card', 'swiping'));

-- Books Payments
ALTER TABLE public.books_payments DROP CONSTRAINT books_payments_payment_method_check;
ALTER TABLE public.books_payments ADD CONSTRAINT books_payments_payment_method_check 
  CHECK (payment_method IN ('cash', 'qr_code', 'bank_transfer', 'card', 'swiping'));

-- Transport Payments
ALTER TABLE public.transport_payments DROP CONSTRAINT transport_payments_payment_method_check;
ALTER TABLE public.transport_payments ADD CONSTRAINT transport_payments_payment_method_check 
  CHECK (payment_method IN ('cash', 'qr_code', 'bank_transfer', 'card', 'swiping'));

-- Accessory Sales
-- Note: Checking if constraint name is standard, if not it will be dropped by type if possible or renamed.
-- Usually it's table_column_check
DO $$ 
BEGIN 
  ALTER TABLE public.accessory_sales DROP CONSTRAINT IF EXISTS accessory_sales_payment_method_check;
  ALTER TABLE public.accessory_sales ADD CONSTRAINT accessory_sales_payment_method_check 
    CHECK (payment_method IN ('cash', 'qr_code', 'bank_transfer', 'card', 'swiping'));
END $$;
