-- Create notices table if it doesn't exist
create table if not exists public.notices (
  id bigint generated always as identity primary key,
  title text not null,
  content text not null,
  date date default current_date,
  author text,
  pinned boolean default false,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.notices enable row level security;

-- Drop existing policies to avoid "already exists" error
drop policy if exists "Staff and admin can view notices" on public.notices;
drop policy if exists "Admins can manage notices" on public.notices;

-- Re-create policies for viewing (Staff and Admin)
create policy "Staff and admin can view notices"
  on public.notices
  for select
  using (public.is_staff_or_admin());

-- Re-create policies for managing (Admin only)
create policy "Admins can manage notices"
  on public.notices
  for all
  using (public.is_admin());
