-- Add gender column to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('Male', 'Female', 'Other'));

-- Create index for faster filtering if needed
CREATE INDEX IF NOT EXISTS idx_students_gender ON students(gender);
