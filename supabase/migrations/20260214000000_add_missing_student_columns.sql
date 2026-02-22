-- Fix missing columns in students table
-- Run this in Supabase SQL Editor to resolve "column does not exist" errors

-- 1. Add parent_email
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS parent_email TEXT;

-- 2. Add student_type with default value
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS student_type TEXT DEFAULT 'new';

-- 3. Add joining_date
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS joining_date DATE DEFAULT CURRENT_DATE;

-- 4. Add profile_photo (for image uploads)
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS profile_photo TEXT;

-- 5. Add roll_number (ensure it exists)
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS roll_number TEXT;
