-- =========================================================
-- Staff Schedule Table
-- Populated automatically whenever admin saves the timetable.
-- Each row = one class-period assignment for one staff member.
-- =========================================================
create table if not exists public.staff_schedule (
  id            bigint generated always as identity primary key,
  staff_name    text        not null,          -- matches profiles.full_name
  day           text        not null,          -- Monday … Saturday
  period_id     text        not null,          -- e.g. 'zero', '1', '2', …
  period_label  text        not null,          -- 'Zero Period', '1', '2', …
  period_time   text        not null,          -- '09.10 AM - 09.50 AM'
  class_name    text        not null,          -- 'VI', 'VII', …
  subject       text        not null,
  timetable_group text      not null,          -- 'Class I-V' or 'Class VI-X'
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Unique constraint: a staff member can only have ONE class at a given day+period
create unique index if not exists idx_staff_schedule_unique
  on public.staff_schedule (staff_name, day, period_id);

-- Enable RLS
alter table public.staff_schedule enable row level security;

-- Anyone authenticated can read (staff will filter client-side by their own name)
create policy "Authenticated users can view staff_schedule"
  on public.staff_schedule
  for select
  using (auth.role() = 'authenticated');

-- Only service role / admin RPC can write (insert/update/delete)
create policy "Admins can manage staff_schedule"
  on public.staff_schedule
  for all
  using (public.is_admin());
