-- Create attendance_records table
create table if not exists attendance_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id),
  student_name text not null,
  class_name text not null,
  date date not null default current_date,
  status text not null check (status in ('Present', 'Absent', 'Late', 'Excused')),
  staff_id uuid references auth.users(id),
  staff_name text,
  created_at timestamptz default now()
);

-- Create homework table
create table if not exists homework (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  class_name text not null,
  subject text not null,
  file_url text,
  staff_id uuid references auth.users(id),
  staff_name text,
  due_date date,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table attendance_records enable row level security;
alter table homework enable row level security;

-- Policies for attendance_records
-- Staff can insert
create policy "Staff can insert attendance"
  on attendance_records for insert
  to authenticated
  with check (true);

-- Admin and Staff can view (simplifying to authenticated for now, or could restrict based on role)
create policy "Authenticated users can view attendance"
  on attendance_records for select
  to authenticated
  using (true);

-- Policies for homework
-- Staff can insert
create policy "Staff can insert homework"
  on homework for insert
  to authenticated
  with check (true);

-- Authenticated users (students in future?) can view
create policy "Authenticated users can view homework"
  on homework for select
  to authenticated
  using (true);
