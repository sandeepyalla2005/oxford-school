-- Allow the same admission number to exist in different classes.
-- Keep uniqueness enforced only within a class.

ALTER TABLE public.students
  DROP CONSTRAINT IF EXISTS students_admission_number_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'students_class_id_admission_number_key'
      AND conrelid = 'public.students'::regclass
  ) THEN
    ALTER TABLE public.students
      ADD CONSTRAINT students_class_id_admission_number_key
      UNIQUE (class_id, admission_number);
  END IF;
END $$;
