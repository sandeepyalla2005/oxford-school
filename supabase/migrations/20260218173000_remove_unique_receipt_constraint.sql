-- Remove the unique constraint from receipt_number to allow multiple items per receipt
ALTER TABLE public.accessory_sales 
DROP CONSTRAINT IF EXISTS accessory_sales_receipt_number_key;

-- Also remove any unique index that might have been created implicitly or explicitly
DROP INDEX IF EXISTS accessory_sales_receipt_number_key;

-- Ensure we can still search by receipt_number efficiently, but allowing duplicates
CREATE INDEX IF NOT EXISTS idx_accessory_sales_receipt_number ON public.accessory_sales(receipt_number);
