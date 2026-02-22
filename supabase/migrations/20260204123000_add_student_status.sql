-- Add status tracking for students (active/dropout/graduated)
DO $$ BEGIN
  CREATE TYPE public.student_status AS ENUM ('active', 'dropout', 'graduated');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS status public.student_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS dropout_reason TEXT,
  ADD COLUMN IF NOT EXISTS dropout_date DATE;
