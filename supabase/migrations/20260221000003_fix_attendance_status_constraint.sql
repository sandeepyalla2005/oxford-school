-- =========================================================
-- Fix: attendance_records check constraint
-- The UI uses 'Leave' as a status, but the DB constraint
-- only allowed ('Present', 'Absent', 'Late', 'Excused').
-- Updating it to include 'Leave' and keep 'Excused' too.
-- =========================================================

-- Drop the old constraint
ALTER TABLE public.attendance_records
  DROP CONSTRAINT IF EXISTS attendance_records_status_check;

-- Add the updated constraint that includes 'Leave'
ALTER TABLE public.attendance_records
  ADD CONSTRAINT attendance_records_status_check
  CHECK (status IN ('Present', 'Absent', 'Late', 'Leave', 'Excused'));
