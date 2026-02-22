-- Attendance Sync Enhancements
-- Run this in Supabase SQL Editor

-- 1. Add updated_at column
alter table public.attendance_records
  add column if not exists updated_at timestamptz default now();

-- 2. Add admission_number column
alter table public.attendance_records
  add column if not exists admission_number text;

-- 3. Unique index: one record per student per date (prevents duplicates)
create unique index if not exists idx_attendance_unique_per_student_date
  on public.attendance_records (student_id, date)
  where student_id is not null;

-- 4. Allow admin to update attendance records
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'attendance_records' and policyname = 'Admins can update attendance'
  ) then
    execute 'create policy "Admins can update attendance"
      on public.attendance_records for update
      to authenticated
      using (true)
      with check (true)';
  end if;
end$$;

-- 5. Allow admin to delete attendance records
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'attendance_records' and policyname = 'Admins can delete attendance'
  ) then
    execute 'create policy "Admins can delete attendance"
      on public.attendance_records for delete
      to authenticated
      using (true)';
  end if;
end$$;

-- 6. Auto-update updated_at on any row change
create or replace function public.update_attendance_timestamp()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_attendance_updated_at on public.attendance_records;

create trigger set_attendance_updated_at
  before update on public.attendance_records
  for each row execute function public.update_attendance_timestamp();
