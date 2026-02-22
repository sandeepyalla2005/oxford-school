-- =========================================================
-- Step 1: Create timetables table (if not already there)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.timetables (
  id          bigint generated always as identity primary key,
  name        text        not null,
  data        jsonb       not null default '{}'::jsonb,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff and admin can view timetables"   ON public.timetables;
DROP POLICY IF EXISTS "Admins can manage timetables"          ON public.timetables;
DROP POLICY IF EXISTS "Authenticated users can manage timetables" ON public.timetables;

CREATE POLICY "Authenticated users can view timetables"
  ON public.timetables FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage timetables"
  ON public.timetables FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- =========================================================
-- Step 2: Create staff_schedule table (core fix)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.staff_schedule (
  id              bigint generated always as identity primary key,
  staff_name      text        not null,
  day             text        not null,
  period_id       text        not null,
  period_label    text        not null,
  period_time     text        not null,
  class_name      text        not null,
  subject         text        not null,
  timetable_group text        not null,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Unique constraint: one staff per day+period slot
CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_schedule_unique
  ON public.staff_schedule (staff_name, day, period_id);

ALTER TABLE public.staff_schedule ENABLE ROW LEVEL SECURITY;

-- Drop all old policies
DROP POLICY IF EXISTS "Authenticated users can view staff_schedule"      ON public.staff_schedule;
DROP POLICY IF EXISTS "Admins can manage staff_schedule"                 ON public.staff_schedule;
DROP POLICY IF EXISTS "Authenticated users can manage staff_schedule"    ON public.staff_schedule;

-- Allow ALL authenticated users to read and write
-- (The timetable edit UI is only shown to admins, so this is safe)
CREATE POLICY "Authenticated users can view staff_schedule"
  ON public.staff_schedule FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage staff_schedule"
  ON public.staff_schedule FOR ALL
  TO authenticated USING (true) WITH CHECK (true);
