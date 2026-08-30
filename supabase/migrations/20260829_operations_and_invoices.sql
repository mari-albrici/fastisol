-- Aggiornamento unico: riparazione archivio PDF, garanzie, magazzino e FatturaPA.
-- Eseguire nel SQL Editor di Supabase dopo lo schema base.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Ripara Schede e certificazioni anche se la precedente migrazione non è stata eseguita.
do $$ begin
  create type public.resource_category as enum ('technical_sheet', 'certification');
exception when duplicate_object then null;
end $$;

create table if not exists public.resource_files (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  category public.resource_category not null,
  description text not null default '',
  file_name text not null,
  file_path text not null unique,
  file_size bigint not null,
  expires_at date,
  created_at timestamptz not null default now(),
  constraint resource_files_name_required check (length(trim(name)) > 0),
  constraint resource_files_size_positive check (file_size > 0 and file_size <= 20971520)
);

alter table public.resource_files add column if not exists expires_at date;
alter table public.resource_files enable row level security;
drop policy if exists resource_files_owner_all on public.resource_files;
create policy resource_files_owner_all on public.resource_files for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
grant select, insert, update, delete on public.resource_files to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('management-files', 'management-files', false, 20971520, array['application/pdf'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists management_files_owner_select on storage.objects;
create policy management_files_owner_select on storage.objects for select to authenticated
  using (bucket_id = 'management-files' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists management_files_owner_insert on storage.objects;
create policy management_files_owner_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'management-files' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists management_files_owner_delete on storage.objects;
create policy management_files_owner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'management-files' and (storage.foldername(name))[1] = auth.uid()::text);

-- Fatture e anagrafiche necessarie per FatturaPA.
alter type public.document_type add value if not exists 'invoice';

alter table public.clients add column if not exists country text not null default 'IT';
alter table public.clients add column if not exists sdi_code text not null default '';
alter table public.clients add column if not exists pec text not null default '';

create table if not exists public.invoice_settings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade unique,
  denomination text not null,
  tax_code text not null default '',
  vat_number text not null,
  fiscal_regime text not null default '',
  address text not null,
  postal_code text not null,
  city text not null,
  province text not null,
  country text not null default 'IT',
  iban text not null default '',
  transmission_sequence integer not null default 1,
  updated_at timestamptz not null default now(),
  constraint invoice_settings_sequence_positive check (transmission_sequence > 0)
);

-- Certificati di garanzia.
create table if not exists public.warranties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete restrict,
  number text not null,
  issue_date date not null default current_date,
  expiry_date date,
  material_name text not null,
  lot_number text not null default '',
  site_address text not null,
  coverage_text text not null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint warranties_owner_number_unique unique (owner_id, number),
  constraint warranties_number_required check (length(trim(number)) > 0),
  constraint warranties_material_required check (length(trim(material_name)) > 0),
  constraint warranties_site_required check (length(trim(site_address)) > 0),
  constraint warranties_dates_valid check (expiry_date is null or expiry_date >= issue_date)
);

-- Lotti acquistati e utilizzi dei singoli barili su uno o più cantieri.
create table if not exists public.inventory_lots (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  lot_number text not null,
  material_name text not null,
  supplier text not null default '',
  purchase_date date not null default current_date,
  drum_count integer not null,
  drum_weight_kg numeric(10,2) not null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inventory_lots_owner_number_unique unique (owner_id, lot_number),
  constraint inventory_lots_values_positive check (drum_count > 0 and drum_weight_kg > 0),
  constraint inventory_lots_names_required check (length(trim(lot_number)) > 0 and length(trim(material_name)) > 0)
);

do $$ begin
  if to_regclass('public.suppliers') is not null then
    alter table public.inventory_lots add column if not exists supplier_id uuid references public.suppliers(id) on delete set null;
  end if;
end $$;

create table if not exists public.inventory_usages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  lot_id uuid not null references public.inventory_lots(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  barrel_number integer not null,
  site_name text not null,
  site_address text not null default '',
  used_weight_kg numeric(10,2) not null,
  used_at date not null default current_date,
  notes text not null default '',
  created_at timestamptz not null default now(),
  constraint inventory_usages_values_positive check (barrel_number > 0 and used_weight_kg > 0),
  constraint inventory_usages_site_required check (length(trim(site_name)) > 0)
);

create index if not exists warranties_owner_client_idx on public.warranties(owner_id, client_id, issue_date desc);
create index if not exists inventory_lots_owner_date_idx on public.inventory_lots(owner_id, purchase_date desc);
create index if not exists inventory_usages_lot_barrel_idx on public.inventory_usages(owner_id, lot_id, barrel_number, used_at desc);

alter table public.invoice_settings enable row level security;
alter table public.warranties enable row level security;
alter table public.inventory_lots enable row level security;
alter table public.inventory_usages enable row level security;

drop policy if exists invoice_settings_owner_all on public.invoice_settings;
create policy invoice_settings_owner_all on public.invoice_settings for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists warranties_owner_all on public.warranties;
create policy warranties_owner_all on public.warranties for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and exists (select 1 from public.clients c where c.id = client_id and c.owner_id = auth.uid()));
drop policy if exists inventory_lots_owner_all on public.inventory_lots;
create policy inventory_lots_owner_all on public.inventory_lots for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists inventory_usages_owner_all on public.inventory_usages;
create policy inventory_usages_owner_all on public.inventory_usages for all to authenticated
  using (owner_id = auth.uid())
  with check (
    owner_id = auth.uid()
    and exists (select 1 from public.inventory_lots l where l.id = lot_id and l.owner_id = auth.uid())
    and (client_id is null or exists (select 1 from public.clients c where c.id = client_id and c.owner_id = auth.uid()))
  );

create or replace function public.validate_inventory_usage()
returns trigger language plpgsql set search_path = public as $$
declare
  lot_owner uuid;
  max_barrels integer;
  capacity numeric;
  already_used numeric;
begin
  select owner_id, drum_count, drum_weight_kg into lot_owner, max_barrels, capacity from public.inventory_lots where id = new.lot_id;
  if lot_owner is null or lot_owner <> new.owner_id then raise exception 'Lotto non valido'; end if;
  if new.barrel_number > max_barrels then raise exception 'Numero barile non valido'; end if;
  select coalesce(sum(used_weight_kg), 0) into already_used from public.inventory_usages
    where lot_id = new.lot_id and barrel_number = new.barrel_number and id <> new.id;
  if already_used + new.used_weight_kg > capacity then
    raise exception 'Capacità del barile superata: disponibili % kg', capacity - already_used;
  end if;
  return new;
end;
$$;

drop trigger if exists inventory_usage_capacity_check on public.inventory_usages;
create trigger inventory_usage_capacity_check before insert or update on public.inventory_usages
for each row execute function public.validate_inventory_usage();

create or replace function public.validate_inventory_lot_update()
returns trigger language plpgsql set search_path = public as $$
declare
  highest_barrel integer;
  highest_usage numeric;
begin
  select coalesce(max(barrel_number), 0) into highest_barrel from public.inventory_usages where lot_id = new.id;
  select coalesce(max(total_used), 0) into highest_usage from (
    select sum(used_weight_kg) total_used from public.inventory_usages where lot_id = new.id group by barrel_number
  ) totals;
  if new.drum_count < highest_barrel then raise exception 'Esistono utilizzi per barili con numero superiore'; end if;
  if new.drum_weight_kg < highest_usage then raise exception 'Il nuovo peso è inferiore al consumo già registrato'; end if;
  return new;
end;
$$;

drop trigger if exists inventory_lot_values_check on public.inventory_lots;
create trigger inventory_lot_values_check before update on public.inventory_lots
for each row execute function public.validate_inventory_lot_update();

drop trigger if exists invoice_settings_set_updated_at on public.invoice_settings;
create trigger invoice_settings_set_updated_at before update on public.invoice_settings for each row execute function public.set_updated_at();
drop trigger if exists warranties_set_updated_at on public.warranties;
create trigger warranties_set_updated_at before update on public.warranties for each row execute function public.set_updated_at();
drop trigger if exists inventory_lots_set_updated_at on public.inventory_lots;
create trigger inventory_lots_set_updated_at before update on public.inventory_lots for each row execute function public.set_updated_at();

create or replace function public.next_document_number(p_type public.document_type)
returns text language plpgsql security invoker set search_path = public as $$
declare prefix text; sequence_number integer; candidate text;
begin
  prefix := case p_type::text when 'quote' then 'PREV' when 'proforma' then 'PRO' else 'FT' end;
  select count(*)::integer + 1 into sequence_number from public.documents
    where owner_id = auth.uid() and type = p_type
      and issue_date >= date_trunc('year', current_date)::date
      and issue_date < (date_trunc('year', current_date) + interval '1 year')::date;
  loop
    candidate := prefix || '-' || to_char(current_date, 'YYYY') || '-' || lpad(sequence_number::text, 3, '0');
    exit when not exists (select 1 from public.documents where owner_id = auth.uid() and type = p_type and number = candidate);
    sequence_number := sequence_number + 1;
  end loop;
  return candidate;
end;
$$;

grant select, insert, update, delete on public.invoice_settings, public.warranties, public.inventory_lots, public.inventory_usages to authenticated;
grant execute on function public.validate_inventory_usage() to authenticated;
grant execute on function public.validate_inventory_lot_update() to authenticated;
grant execute on function public.next_document_number(public.document_type) to authenticated;

notify pgrst, 'reload schema';
