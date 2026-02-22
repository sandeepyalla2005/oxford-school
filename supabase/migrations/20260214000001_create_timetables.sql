-- Create timetables table for storing master schedules
create table if not exists public.timetables (
  id bigint generated always as identity primary key,
  name text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.timetables enable row level security;

-- Policies
create policy "Staff and admin can view timetables"
  on public.timetables
  for select
  using (public.is_staff_or_admin());

create policy "Admins can manage timetables"
  on public.timetables
  for all
  using (public.is_admin());
