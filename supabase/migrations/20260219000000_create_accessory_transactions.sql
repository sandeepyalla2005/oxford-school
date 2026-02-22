create table if not exists accessory_transactions (
  id uuid primary key default gen_random_uuid(),
  receipt_no text,
  accessory_type text not null,
  student_name text not null,
  class_name text not null,
  quantity integer not null,
  price decimal(10,2) not null,
  total_amount decimal(10,2) not null,
  amount_paid decimal(10,2) not null,
  balance decimal(10,2) not null,
  payment_method text not null,
  transaction_date date not null default current_date,
  created_at timestamptz default now()
);

-- Sequence for receipt number
create sequence if not exists accessory_receipt_seq;

-- Function to generate receipt number
create or replace function generate_accessory_receipt_no()
returns trigger as $$
begin
  if NEW.receipt_no is null then
    NEW.receipt_no := 'ACC-' || to_char(current_date, 'YYYY') || '-' || lpad(nextval('accessory_receipt_seq')::text, 4, '0');
  end if;
  return NEW;
end;
$$ language plpgsql;

-- Trigger
drop trigger if exists set_accessory_receipt_no on accessory_transactions;
create trigger set_accessory_receipt_no
before insert on accessory_transactions
for each row
execute function generate_accessory_receipt_no();

-- RLS
alter table accessory_transactions enable row level security;

drop policy if exists "Enable read access for all authenticated users" on accessory_transactions;
create policy "Enable read access for all authenticated users"
on accessory_transactions for select
to authenticated
using (true);

drop policy if exists "Enable insert access for all authenticated users" on accessory_transactions;
create policy "Enable insert access for all authenticated users"
on accessory_transactions for insert
to authenticated
with check (true);
