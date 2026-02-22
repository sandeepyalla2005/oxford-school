-- Add fee tracking columns to students table
ALTER TABLE public.students
ADD COLUMN term1_fee numeric DEFAULT 0,
ADD COLUMN term2_fee numeric DEFAULT 0,
ADD COLUMN term3_fee numeric DEFAULT 0,
ADD COLUMN has_books boolean DEFAULT false,
ADD COLUMN books_fee numeric DEFAULT 0,
ADD COLUMN has_transport boolean DEFAULT false,
ADD COLUMN transport_fee numeric DEFAULT 0,
ADD COLUMN old_dues numeric DEFAULT 0;