-- ============================================================================
-- DriveMate — Centralized Expense Tracking (Expense Aggregation)
-- ----------------------------------------------------------------------------
-- Architecture (Option A - Database Triggers):
--   One centralized `expenses` table. PostgreSQL triggers mirror ANY cost that
--   is written in Mileage / Maintenance / Insurance / FASTag into `expenses`
--   with a `source_type` + `source_id` reference, so Expense Tracking works
--   even when a record is inserted/updated/deleted outside the React app.
--
--   Manual expenses (Parking / Accessories / Car Wash / Other) are written
--   directly into `expenses` by the app, with source_type/source_id = NULL.
--
--   Why triggers over a DB view or client-side aggregation:
--     * Consistency is guaranteed no matter how the source record is written.
--     * a UNIQUE(source_type, source_id) constraint + upsert prevents duplicates.
--     * Deletions and edits cascade correctly (no orphaned/duplicate records).
--     * RLS, constraints and indexes live close to the data.
--
-- Run this ONCE in the Supabase SQL Editor. It is idempotent (safe to re-run).
-- ============================================================================

-- 0) Clean up legacy rows created by an older app-level sync that marked notes
--    with "[auto:...]". They are rebuilt from source tables by the backfill at
--    the bottom of this script.
delete from public.expenses where note like '[auto:%';

-- ============================================================================
-- 1) EXPENSES table
-- ============================================================================
create table if not exists public.expenses (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  vehicle_id    uuid references public.vehicles(id) on delete cascade,
  amount        numeric(12,2) not null check (amount > 0),
  category      text not null,
  description   text,
  expense_date  date not null,
  payment_method text,
  source_type   text,
  source_id     uuid,
  note          text,
  receipt_url   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Backfriendly alterations for an already-existing `expenses` table
alter table public.expenses add column if not exists source_type text;
alter table public.expenses add column if not exists source_id uuid;
alter table public.expenses add column if not exists description text;

-- Remove rows that would violate the constraints below before adding them
delete from public.expenses
  where amount is null or amount <= 0 or expense_date is null or category is null;

alter table public.expenses drop constraint if exists expenses_amount_positive;
alter table public.expenses add constraint expenses_amount_positive check (amount > 0);
alter table public.expenses drop constraint if exists expenses_source_unique;
alter table public.expenses add constraint expenses_source_unique unique (source_type, source_id);

alter table public.expenses alter column user_id set not null;
alter table public.expenses alter column amount set not null;
alter table public.expenses alter column category set not null;
alter table public.expenses alter column expense_date set not null;

-- Performance indexes
create index if not exists expenses_user_id_idx      on public.expenses (user_id);
create index if not exists expenses_vehicle_id_idx   on public.expenses (vehicle_id);
create index if not exists expenses_date_idx         on public.expenses (expense_date desc);
create index if not exists expenses_category_idx     on public.expenses (category);
create index if not exists expenses_source_type_idx  on public.expenses (source_type);
create index if not exists expenses_source_id_idx    on public.expenses (source_id);

-- Auto-maintain updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_expenses_set_updated_at on public.expenses;
create trigger trg_expenses_set_updated_at
  before update on public.expenses
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 2) Row Level Security — a user can only ever see/edit their own expenses
-- ============================================================================
alter table public.expenses enable row level security;

drop policy if exists expenses_select_own on public.expenses;
create policy expenses_select_own on public.expenses
  for select to authenticated using (user_id = auth.uid());

drop policy if exists expenses_insert_own on public.expenses;
create policy expenses_insert_own on public.expenses
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists expenses_update_own on public.expenses;
create policy expenses_update_own on public.expenses
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists expenses_delete_own on public.expenses;
create policy expenses_delete_own on public.expenses
  for delete to authenticated using (user_id = auth.uid());

grant select, insert, update, delete on public.expenses to authenticated, service_role;

-- ============================================================================
-- 3) FASTag recharges ledger
--    FASTag only stores the current balance, so an UPDATE trigger records every
--    balance increase as a recharge (the actual money spent) in a small ledger.
-- ============================================================================
create table if not exists public.fastag_recharges (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  fastag_id     uuid not null references public.fastags(id) on delete cascade,
  vehicle_id    uuid references public.vehicles(id) on delete cascade,
  amount        numeric(12,2) not null check (amount > 0),
  recharge_date date not null default current_date,
  note          text,
  created_at    timestamptz not null default now()
);

create index if not exists fastag_recharges_user_idx   on public.fastag_recharges (user_id);
create index if not exists fastag_recharges_fastag_idx on public.fastag_recharges (fastag_id);
create index if not exists fastag_recharges_vehicle_idx on public.fastag_recharges (vehicle_id);

alter table public.fastag_recharges enable row level security;

drop policy if exists fastag_recharges_all_own on public.fastag_recharges;
create policy fastag_recharges_all_own on public.fastag_recharges
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update, delete on public.fastag_recharges to authenticated, service_role;

-- ============================================================================
-- 4) SYNCHRONIZATION TRIGGERS
--    Each trigger function is SECURITY DEFINER so it can write expenses even
--    under RLS, and uses ON CONFLICT ... DO UPDATE with the unique source key
--    so it is idempotent (no duplicate expenses).
-- ============================================================================

-- ---------------- 4.1 Mileage / Fuel -> Fuel expense ----------------
create or replace function public.sync_mileage_expense()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner uuid;
begin
  v_owner := coalesce(new.user_id, (select user_id from public.vehicles where id = new.vehicle_id));
  if v_owner is not null and new.fuel_cost is not null and new.fuel_cost > 0 then
    insert into public.expenses
      (user_id, vehicle_id, amount, category, description, note, expense_date, source_type, source_id)
    values
      (v_owner, new.vehicle_id, new.fuel_cost, 'Fuel', 'Fuel',
       coalesce('Fuel - ' || new.fuel_qty || ' L', 'Fuel'), new.date, 'fuel', new.id)
    on conflict (source_type, source_id) do update set
      user_id = excluded.user_id,
      vehicle_id = excluded.vehicle_id,
      amount = excluded.amount,
      category = excluded.category,
      description = excluded.description,
      note = excluded.note,
      expense_date = excluded.expense_date;
  else
    -- cost cleared / zeroed -> remove the linked expense
    delete from public.expenses where source_type = 'fuel' and source_id = new.id;
  end if;
  return null;
end $$;

drop trigger if exists trg_mileage_sync_expense on public.mileage_records;
create trigger trg_mileage_sync_expense
  after insert or update of fuel_cost, date, vehicle_id, user_id, fuel_qty on public.mileage_records
  for each row execute function public.sync_mileage_expense();

create or replace function public.remove_mileage_expense()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.expenses where source_type = 'fuel' and source_id = old.id;
  return old;
end $$;

drop trigger if exists trg_mileage_remove_expense on public.mileage_records;
create trigger trg_mileage_remove_expense
  after delete on public.mileage_records
  for each row execute function public.remove_mileage_expense();

-- ---------------- 4.2 Maintenance -> Service / Repair expense ----------------
create or replace function public.sync_maintenance_expense()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner uuid;
begin
  v_owner := coalesce(new.user_id, (select user_id from public.vehicles where id = new.vehicle_id));
  if v_owner is not null and new.cost is not null and new.cost > 0 then
    insert into public.expenses
      (user_id, vehicle_id, amount, category, description, note, expense_date, source_type, source_id)
    values
      (v_owner, new.vehicle_id, new.cost,
       case when new.service_type = 'Repair' then 'Repair' else 'Service' end,
       'Maintenance',
       coalesce('Maintenance - ' || new.service_type || ' - ' || new.description, 'Maintenance'),
       new.service_date, 'maintenance', new.id)
    on conflict (source_type, source_id) do update set
      user_id = excluded.user_id,
      vehicle_id = excluded.vehicle_id,
      amount = excluded.amount,
      category = excluded.category,
      description = excluded.description,
      note = excluded.note,
      expense_date = excluded.expense_date;
  else
    delete from public.expenses where source_type = 'maintenance' and source_id = new.id;
  end if;
  return null;
end $$;

drop trigger if exists trg_maintenance_sync_expense on public.maintenance_records;
create trigger trg_maintenance_sync_expense
  after insert or update of cost, service_date, vehicle_id, user_id, service_type, description on public.maintenance_records
  for each row execute function public.sync_maintenance_expense();

create or replace function public.remove_maintenance_expense()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.expenses where source_type = 'maintenance' and source_id = old.id;
  return old;
end $$;

drop trigger if exists trg_maintenance_remove_expense on public.maintenance_records;
create trigger trg_maintenance_remove_expense
  after delete on public.maintenance_records
  for each row execute function public.remove_maintenance_expense();

-- ---------------- 4.3 Insurance -> Insurance expense ----------------
create or replace function public.sync_insurance_expense()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner uuid;
begin
  v_owner := coalesce(new.user_id, (select user_id from public.vehicles where id = new.vehicle_id));
  if v_owner is not null and new.premium is not null and new.premium > 0 then
    insert into public.expenses
      (user_id, vehicle_id, amount, category, description, note, expense_date, source_type, source_id)
    values
      (v_owner, new.vehicle_id, new.premium, 'Insurance', 'Insurance Premium',
       coalesce('Insurance premium - ' || new.company, 'Insurance premium'),
       coalesce(new.start_date, new.expiry_date), 'insurance', new.id)
    on conflict (source_type, source_id) do update set
      user_id = excluded.user_id,
      vehicle_id = excluded.vehicle_id,
      amount = excluded.amount,
      category = excluded.category,
      description = excluded.description,
      note = excluded.note,
      expense_date = excluded.expense_date;
  else
    delete from public.expenses where source_type = 'insurance' and source_id = new.id;
  end if;
  return null;
end $$;

drop trigger if exists trg_insurance_sync_expense on public.insurance_policies;
create trigger trg_insurance_sync_expense
  after insert or update of premium, start_date, expiry_date, vehicle_id, user_id, company on public.insurance_policies
  for each row execute function public.sync_insurance_expense();

create or replace function public.remove_insurance_expense()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.expenses where source_type = 'insurance' and source_id = old.id;
  return old;
end $$;

drop trigger if exists trg_insurance_remove_expense on public.insurance_policies;
create trigger trg_insurance_remove_expense
  after delete on public.insurance_policies
  for each row execute function public.remove_insurance_expense();

-- ---------------- 4.4 FASTag balance increase -> recharge -> FASTag/Toll expense ----------------
create or replace function public.record_fastag_recharge()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.balance > coalesce(old.balance, 0) then
    insert into public.fastag_recharges (user_id, fastag_id, vehicle_id, amount, note)
    values
      (coalesce(new.user_id, (select user_id from public.vehicles where id = new.vehicle_id)),
       new.id, new.vehicle_id, new.balance - coalesce(old.balance, 0), 'FASTag recharge');
  end if;
  return new;
end $$;

drop trigger if exists trg_fastag_record_recharge on public.fastags;
create trigger trg_fastag_record_recharge
  after update of balance on public.fastags
  for each row execute function public.record_fastag_recharge();

create or replace function public.sync_fastag_recharge_expense()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner uuid;
begin
  v_owner := coalesce(new.user_id, (select user_id from public.vehicles where id = new.vehicle_id));
  if v_owner is not null then
    insert into public.expenses
      (user_id, vehicle_id, amount, category, description, note, expense_date, source_type, source_id)
    values
      (v_owner, new.vehicle_id, new.amount, 'FASTag/Toll', 'FASTag recharge',
       coalesce(new.note, 'FASTag recharge'), new.recharge_date, 'fastag', new.id)
    on conflict (source_type, source_id) do update set
      user_id = excluded.user_id,
      vehicle_id = excluded.vehicle_id,
      amount = excluded.amount,
      category = excluded.category,
      description = excluded.description,
      note = excluded.note,
      expense_date = excluded.expense_date;
  end if;
  return null;
end $$;

drop trigger if exists trg_fastag_recharge_sync_expense on public.fastag_recharges;
create trigger trg_fastag_recharge_sync_expense
  after insert or update on public.fastag_recharges
  for each row execute function public.sync_fastag_recharge_expense();

create or replace function public.remove_fastag_recharge_expense()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.expenses where source_type = 'fastag' and source_id = old.id;
  return old;
end $$;

drop trigger if exists trg_fastag_recharge_remove_expense on public.fastag_recharges;
create trigger trg_fastag_recharge_remove_expense
  after delete on public.fastag_recharges
  for each row execute function public.remove_fastag_recharge_expense();

-- ============================================================================
-- 5) BACKFILL existing records (run on every re-run; idempotent via upsert)
-- ============================================================================
do $$
declare r record;
        owner_id uuid;
begin
  delete from public.expenses where note like '[auto:%';

  for r in select * from public.mileage_records loop
    owner_id := coalesce(r.user_id, (select user_id from public.vehicles where id = r.vehicle_id));
    if owner_id is not null and coalesce(r.fuel_cost, 0) > 0 then
      insert into public.expenses
        (user_id, vehicle_id, amount, category, description, note, expense_date, source_type, source_id)
      values
        (owner_id, r.vehicle_id, r.fuel_cost, 'Fuel', 'Fuel', 'Fuel - ' || r.fuel_qty || ' L', r.date, 'fuel', r.id)
      on conflict (source_type, source_id) do update set
        vehicle_id = excluded.vehicle_id, amount = excluded.amount, note = excluded.note, expense_date = excluded.expense_date;
    end if;
  end loop;

  for r in select * from public.maintenance_records loop
    owner_id := coalesce(r.user_id, (select user_id from public.vehicles where id = r.vehicle_id));
    if owner_id is not null and coalesce(r.cost, 0) > 0 then
      insert into public.expenses
        (user_id, vehicle_id, amount, category, description, note, expense_date, source_type, source_id)
      values
        (owner_id, r.vehicle_id, r.cost,
         case when r.service_type = 'Repair' then 'Repair' else 'Service' end,
         'Maintenance', 'Maintenance - ' || r.service_type, r.service_date, 'maintenance', r.id)
      on conflict (source_type, source_id) do update set
        vehicle_id = excluded.vehicle_id, amount = excluded.amount, note = excluded.note, expense_date = excluded.expense_date;
    end if;
  end loop;

  for r in select * from public.insurance_policies loop
    owner_id := coalesce(r.user_id, (select user_id from public.vehicles where id = r.vehicle_id));
    if owner_id is not null and coalesce(r.premium, 0) > 0 then
      insert into public.expenses
        (user_id, vehicle_id, amount, category, description, note, expense_date, source_type, source_id)
      values
        (owner_id, r.vehicle_id, r.premium, 'Insurance', 'Insurance Premium',
         'Insurance premium - ' || coalesce(r.company, ''), coalesce(r.start_date, r.expiry_date), 'insurance', r.id)
      on conflict (source_type, source_id) do update set
        vehicle_id = excluded.vehicle_id, amount = excluded.amount, note = excluded.note, expense_date = excluded.expense_date;
    end if;
  end loop;

  for r in select * from public.fastag_recharges loop
    owner_id := coalesce(r.user_id, (select user_id from public.vehicles where id = r.vehicle_id));
    if owner_id is not null and r.amount > 0 then
      insert into public.expenses
        (user_id, vehicle_id, amount, category, description, note, expense_date, source_type, source_id)
      values
        (owner_id, r.vehicle_id, r.amount, 'FASTag/Toll', 'FASTag recharge',
         coalesce(r.note, 'FASTag recharge'), r.recharge_date, 'fastag', r.id)
      on conflict (source_type, source_id) do update set
        vehicle_id = excluded.vehicle_id, amount = excluded.amount, note = excluded.note, expense_date = excluded.expense_date;
    end if;
  end loop;
end $$;