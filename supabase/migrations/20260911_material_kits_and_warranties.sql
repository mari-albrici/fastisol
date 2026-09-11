-- Gestione kit A+B, tracciabilita FIFO e archivio garanzie.
do $$ begin
  create type public.material_lot_status as enum ('available', 'partially_used', 'exhausted');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.material_movement_type as enum ('inbound', 'consumption', 'adjustment');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.warranty_archive_status as enum ('to_create', 'created_on_supplier_portal', 'document_to_upload', 'uploaded', 'to_verify');
exception when duplicate_object then null; end $$;

alter table public.delivery_notes add column if not exists file_name text;
alter table public.delivery_notes add column if not exists file_path text;
alter table public.delivery_notes add column if not exists file_type text;
alter table public.delivery_notes add column if not exists file_size bigint;

create table if not exists public.material_lots (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  producer_lot_number text not null,
  material_name text not null,
  component_a text not null,
  component_b text not null,
  initial_quantity_kits numeric(18,6) not null,
  remaining_quantity_kits numeric(18,6) not null,
  yield_sqm_per_kit numeric(18,6) not null,
  reference_thickness_cm numeric(8,3) not null,
  entry_date date not null,
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  delivery_note_id uuid not null references public.delivery_notes(id) on delete restrict,
  notes text not null default '',
  status public.material_lot_status not null default 'available',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint material_lots_quantities_valid check (initial_quantity_kits > 0 and remaining_quantity_kits >= 0 and remaining_quantity_kits <= initial_quantity_kits),
  constraint material_lots_yield_valid check (yield_sqm_per_kit > 0 and reference_thickness_cm > 0)
);

create table if not exists public.material_consumptions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete restrict,
  project_id uuid not null references public.projects(id) on delete restrict,
  application_date date not null,
  declared_sqm numeric(18,6) not null,
  kits_consumed numeric(18,6) not null,
  reference_thickness_cm numeric(8,3) not null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  constraint material_consumptions_values_valid check (declared_sqm > 0 and kits_consumed > 0 and reference_thickness_cm > 0)
);

create table if not exists public.material_consumption_lots (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  consumption_id uuid not null references public.material_consumptions(id) on delete cascade,
  material_lot_id uuid not null references public.material_lots(id) on delete restrict,
  quantity_kits numeric(18,6) not null check (quantity_kits > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.material_movements (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  material_lot_id uuid not null references public.material_lots(id) on delete restrict,
  movement_type public.material_movement_type not null,
  quantity_before_kits numeric(18,6) not null,
  quantity_moved_kits numeric(18,6) not null,
  quantity_after_kits numeric(18,6) not null,
  consumption_id uuid references public.material_consumptions(id) on delete set null,
  performed_by uuid references auth.users(id) on delete set null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  constraint material_movements_values_valid check (quantity_before_kits >= 0 and quantity_moved_kits > 0 and quantity_after_kits >= 0)
);

create table if not exists public.warranties_archive (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete restrict,
  project_id uuid not null references public.projects(id) on delete restrict,
  consumption_id uuid references public.material_consumptions(id) on delete set null,
  material_name text not null,
  warranty_number text not null default '',
  issue_date date,
  expiry_date date,
  supplier_name text not null default '',
  status public.warranty_archive_status not null default 'to_create',
  file_name text,
  file_path text,
  file_type text,
  file_size bigint,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint warranties_archive_file_consistency check ((file_path is null and file_name is null) or (file_path is not null and file_name is not null))
);

alter table public.warranties_archive add column if not exists quantity_text text not null default '';
alter table public.warranties_archive add column if not exists lot_number text not null default '';

create table if not exists public.warranty_lots (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  warranty_id uuid not null references public.warranties_archive(id) on delete cascade,
  material_lot_id uuid not null references public.material_lots(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (warranty_id, material_lot_id)
);

create index if not exists material_lots_fifo_idx on public.material_lots(owner_id, entry_date, created_at) where remaining_quantity_kits > 0;
create index if not exists material_consumptions_project_idx on public.material_consumptions(owner_id, project_id, application_date desc);
create index if not exists material_consumption_lots_consumption_idx on public.material_consumption_lots(consumption_id);
create index if not exists material_movements_lot_idx on public.material_movements(owner_id, material_lot_id, created_at desc);
create index if not exists warranties_archive_project_idx on public.warranties_archive(owner_id, project_id, created_at desc);

drop trigger if exists material_lots_set_updated_at on public.material_lots;
create trigger material_lots_set_updated_at before update on public.material_lots for each row execute function public.set_updated_at();
drop trigger if exists warranties_archive_set_updated_at on public.warranties_archive;
create trigger warranties_archive_set_updated_at before update on public.warranties_archive for each row execute function public.set_updated_at();

alter table public.material_lots enable row level security;
alter table public.material_consumptions enable row level security;
alter table public.material_consumption_lots enable row level security;
alter table public.material_movements enable row level security;
alter table public.warranties_archive enable row level security;
alter table public.warranty_lots enable row level security;

do $$
declare table_name text;
begin
  foreach table_name in array array['material_lots','material_consumptions','material_consumption_lots','material_movements','warranties_archive','warranty_lots'] loop
    execute format('drop policy if exists %I_owner_all on public.%I', table_name, table_name);
    execute format('create policy %I_owner_all on public.%I for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid())', table_name, table_name);
  end loop;
end $$;

grant select, insert, update, delete on public.material_lots, public.material_consumptions, public.material_consumption_lots, public.material_movements, public.warranties_archive, public.warranty_lots to authenticated;
create or replace function public.consume_material_fifo(
  p_client_id uuid,
  p_project_id uuid,
  p_consumption_id uuid,
  p_application_date date,
  p_declared_sqm numeric,
  p_reference_thickness_cm numeric,
  p_notes text default ''
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  lot record;
  consumption_id uuid := coalesce(p_consumption_id, gen_random_uuid());
  required_kits numeric := 0;
  remaining_to_consume numeric;
  consumed_from_lot numeric;
  before_quantity numeric;
  after_quantity numeric;
  lot_count integer := 0;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_declared_sqm <= 0 or p_reference_thickness_cm <= 0 then raise exception 'Superficie e spessore devono essere positivi'; end if;
  if not exists (select 1 from clients where id = p_client_id and owner_id = auth.uid()) then raise exception 'Invalid client'; end if;
  if not exists (select 1 from projects where id = p_project_id and client_id = p_client_id and owner_id = auth.uid()) then raise exception 'Invalid project'; end if;

  select coalesce(sum(remaining_quantity_kits), 0) into required_kits from material_lots where owner_id = auth.uid() and remaining_quantity_kits > 0;
  if required_kits = 0 then raise exception 'Nessun kit disponibile'; end if;
  required_kits := 0;
  -- FIFO usa il rendimento del lotto consumato; il consumo viene determinato lotto per lotto.
  insert into material_consumptions (id, owner_id, client_id, project_id, application_date, declared_sqm, kits_consumed, reference_thickness_cm, notes)
  values (consumption_id, auth.uid(), p_client_id, p_project_id, p_application_date, p_declared_sqm, 0, p_reference_thickness_cm, coalesce(p_notes, ''));

  remaining_to_consume := p_declared_sqm;
  for lot in
    select * from material_lots
    where owner_id = auth.uid() and remaining_quantity_kits > 0
    order by entry_date, created_at, id
    for update
  loop
    exit when remaining_to_consume <= 0;
    before_quantity := lot.remaining_quantity_kits;
    consumed_from_lot := least(before_quantity, remaining_to_consume / lot.yield_sqm_per_kit);
    after_quantity := before_quantity - consumed_from_lot;
    remaining_to_consume := remaining_to_consume - consumed_from_lot * lot.yield_sqm_per_kit;
    insert into material_consumption_lots (owner_id, consumption_id, material_lot_id, quantity_kits) values (auth.uid(), consumption_id, lot.id, consumed_from_lot);
    insert into material_movements (owner_id, material_lot_id, movement_type, quantity_before_kits, quantity_moved_kits, quantity_after_kits, consumption_id, performed_by, notes)
    values (auth.uid(), lot.id, 'consumption', before_quantity, consumed_from_lot, after_quantity, consumption_id, auth.uid(), 'Consumo FIFO');
    update material_lots set remaining_quantity_kits = after_quantity, status = case when after_quantity = 0 then 'exhausted' when after_quantity < initial_quantity_kits then 'partially_used' else 'available' end where id = lot.id;
    required_kits := required_kits + consumed_from_lot;
    lot_count := lot_count + 1;
  end loop;
  if remaining_to_consume > 0.000001 then
    raise exception 'Disponibilita insufficiente: mancano % m2 equivalenti', round(remaining_to_consume, 3);
  end if;
  update material_consumptions set kits_consumed = required_kits where id = consumption_id;
  return jsonb_build_object('consumption_id', consumption_id, 'kits_consumed', required_kits, 'lots_used', lot_count);
exception when others then
  raise;
end;
$$;

grant execute on function public.consume_material_fifo(uuid, uuid, uuid, date, numeric, numeric, text) to authenticated;

create or replace function public.register_material_lot(
  p_producer_lot_number text,
  p_material_name text,
  p_component_a text,
  p_component_b text,
  p_quantity_kits numeric,
  p_yield_sqm_per_kit numeric,
  p_reference_thickness_cm numeric,
  p_entry_date date,
  p_supplier_id uuid,
  p_delivery_note_id uuid,
  p_notes text default ''
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  saved_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_quantity_kits <= 0 or p_yield_sqm_per_kit <= 0 or p_reference_thickness_cm <= 0 then raise exception 'Quantita, rendimento e spessore devono essere positivi'; end if;
  if not exists (select 1 from suppliers where id = p_supplier_id and owner_id = auth.uid()) then raise exception 'Invalid supplier'; end if;
  if not exists (select 1 from delivery_notes where id = p_delivery_note_id and owner_id = auth.uid()) then raise exception 'DDT obbligatorio e non valido'; end if;
  insert into material_lots (owner_id, producer_lot_number, material_name, component_a, component_b, initial_quantity_kits, remaining_quantity_kits, yield_sqm_per_kit, reference_thickness_cm, entry_date, supplier_id, delivery_note_id, notes)
  values (auth.uid(), trim(p_producer_lot_number), trim(p_material_name), trim(p_component_a), trim(p_component_b), p_quantity_kits, p_quantity_kits, p_yield_sqm_per_kit, p_reference_thickness_cm, p_entry_date, p_supplier_id, p_delivery_note_id, coalesce(p_notes, ''))
  returning id into saved_id;
  insert into material_movements (owner_id, material_lot_id, movement_type, quantity_before_kits, quantity_moved_kits, quantity_after_kits, performed_by, notes)
  values (auth.uid(), saved_id, 'inbound', 0, p_quantity_kits, p_quantity_kits, auth.uid(), 'Carico da DDT');
  return saved_id;
end;
$$;

grant execute on function public.register_material_lot(text, text, text, text, numeric, numeric, numeric, date, uuid, uuid, text) to authenticated;

alter table public.warranties_archive add column if not exists stock_applied boolean not null default false;
alter table public.warranties_archive add column if not exists stock_consumption_id uuid references public.material_consumptions(id) on delete set null;

create or replace function public.adjust_material_lot(
  p_material_lot_id uuid,
  p_quantity_delta_kits numeric,
  p_notes text default ''
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  lot record;
  before_quantity numeric;
  after_quantity numeric;
  moved_quantity numeric;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_quantity_delta_kits = 0 then raise exception 'La rettifica non puo essere zero'; end if;
  select * into lot from material_lots where id = p_material_lot_id and owner_id = auth.uid() for update;
  if lot.id is null then raise exception 'Lotto non trovato'; end if;
  before_quantity := lot.remaining_quantity_kits;
  after_quantity := before_quantity + p_quantity_delta_kits;
  if after_quantity < 0 then raise exception 'La rettifica supera la disponibilita del lotto'; end if;
  moved_quantity := abs(p_quantity_delta_kits);
  insert into material_movements (owner_id, material_lot_id, movement_type, quantity_before_kits, quantity_moved_kits, quantity_after_kits, performed_by, notes)
  values (auth.uid(), p_material_lot_id, 'adjustment', before_quantity, moved_quantity, after_quantity, auth.uid(), coalesce(p_notes, 'Rettifica manuale'));
  update material_lots set remaining_quantity_kits = after_quantity, status = case when after_quantity = 0 then 'exhausted' when after_quantity < initial_quantity_kits then 'partially_used' else 'available' end where id = p_material_lot_id;
  return jsonb_build_object('before_kits', before_quantity, 'delta_kits', p_quantity_delta_kits, 'after_kits', after_quantity);
end;
$$;

grant execute on function public.adjust_material_lot(uuid, numeric, text) to authenticated;

create or replace function public.apply_warranty_stock(
  p_warranty_id uuid,
  p_client_id uuid,
  p_project_id uuid,
  p_application_date date,
  p_declared_sqm numeric,
  p_reference_thickness_cm numeric,
  p_notes text default ''
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  result jsonb;
begin
  if not exists (select 1 from warranties_archive where id = p_warranty_id and owner_id = auth.uid() and not stock_applied) then
    raise exception 'Garanzia non trovata o gia contabilizzata';
  end if;
  result := consume_material_fifo(p_client_id, p_project_id, null, p_application_date, p_declared_sqm, p_reference_thickness_cm, p_notes);
  update warranties_archive
  set stock_applied = true, stock_consumption_id = (result->>'consumption_id')::uuid
  where id = p_warranty_id and owner_id = auth.uid();
  return result;
end;
$$;

grant execute on function public.apply_warranty_stock(uuid, uuid, uuid, date, numeric, numeric, text) to authenticated;