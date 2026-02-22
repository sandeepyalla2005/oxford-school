-- Add parent_email, student_type, and joining_date to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS parent_email TEXT,
ADD COLUMN IF NOT EXISTS student_type TEXT CHECK (student_type IN ('old', 'new')) DEFAULT 'new',
ADD COLUMN IF NOT EXISTS joining_date DATE DEFAULT CURRENT_DATE;

-- Update RLS if necessary (usually not needed if already enabled for the table)
-- But making sure staff can still manage these fields
