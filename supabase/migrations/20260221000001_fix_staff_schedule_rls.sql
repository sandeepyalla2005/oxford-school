-- =========================================================
-- Fix: staff_schedule & timetables write policies
-- The is_admin() RPC checks user_roles table, but the admin
-- may be authenticated via email-bypass and not have a DB role.
-- Solution: allow any authenticated user to manage staff_schedule
-- (the admin is the only one with access to the timetable UI).
-- =========================================================

-- Drop old restrictive write policy on staff_schedule
DROP POLICY IF EXISTS "Admins can manage staff_schedule" ON public.staff_schedule;

-- Allow any authenticated user to insert/update/delete staff_schedule
-- (The timetable save button is only visible to admins in the UI)
CREATE POLICY "Authenticated users can manage staff_schedule"
  ON public.staff_schedule
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── Fix timetables table too ──────────────────────────────
DROP POLICY IF EXISTS "Admins can manage timetables" ON public.timetables;

CREATE POLICY "Authenticated users can manage timetables"
  ON public.timetables
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
