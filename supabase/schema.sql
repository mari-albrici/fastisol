-- Fastisol mini gestionale
-- Eseguire una sola volta nel SQL Editor del progetto Supabase.

create extension if not exists pgcrypto;

do $$ begin
  create type public.document_type as enum ('quote', 'proforma', 'invoice');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.document_status as enum ('draft', 'sent', 'accepted', 'paid', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.job_status as enum ('planned', 'completed', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.resource_category as enum ('technical_sheet', 'certification');
exception when duplicate_object then null;
end $$;

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  company_name text not null default '',
  contact_name text not null default '',
  tax_code text not null default '',
  vat_number text not null default '',
  email text not null default '',
  phone text not null default '',
  address text not null default '',
  postal_code text not null default '',
  city text not null default '',
  province text not null default '',
  country text not null default 'IT',
  sdi_code text not null default '',
  pec text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clients_name_required check (length(trim(company_name)) > 0 or length(trim(contact_name)) > 0)
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  company_name text not null default '',
  contact_name text not null default '',
  tax_code text not null default '',
  vat_number text not null default '',
  fiscal_regime text not null default '',
  email text not null default '',
  phone text not null default '',
  pec text not null default '',
  sdi_code text not null default '',
  address text not null default '',
  postal_code text not null default '',
  city text not null default '',
  province text not null default '',
  country text not null default 'IT',
  iban text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint suppliers_name_required check (length(trim(company_name)) > 0 or length(trim(contact_name)) > 0)
);

create unique index if not exists suppliers_owner_vat_unique
  on public.suppliers(owner_id, upper(vat_number)) where length(trim(vat_number)) > 0;

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete restrict,
  title text not null,
  description text not null default '',
  location text not null default '',
  work_date date,
  status public.job_status not null default 'planned',
  amount numeric(12,2),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jobs_amount_positive check (amount is null or amount >= 0)
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete restrict,
  job_id uuid references public.jobs(id) on delete restrict,
  type public.document_type not null,
  number text not null,
  issue_date date not null default current_date,
  expiry_date date,
  status public.document_status not null default 'draft',
  subject text not null default '',
  notes text not null default '',
  payment_terms text not null default '',
  subtotal numeric(12,2) not null default 0,
  discount_percent numeric(5,2) not null default 0,
  tax_rate numeric(5,2) not null default 22,
  tax_amount numeric(12,2) not null default 0,
  other_amount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  approved boolean not null default false,
  work_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint documents_owner_type_number_key unique (owner_id, type, number),
  constraint documents_values_positive check (
    subtotal >= 0 and discount_percent between 0 and 100 and tax_rate >= 0 and tax_amount >= 0 and total >= 0
  )
);

-- Consente di aggiornare senza errori anche un database creato con una versione precedente dello schema.
alter table public.documents add column if not exists approved boolean not null default false;
alter table public.documents add column if not exists work_completed boolean not null default false;
alter table public.documents add column if not exists other_amount numeric(12,2) not null default 0;

create table if not exists public.document_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  description text not null,
  quantity numeric(12,3) not null default 1,
  unit text not null default '',
  unit_price numeric(12,2) not null default 0,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  constraint document_items_values_positive check (quantity >= 0 and unit_price >= 0)
);

create table if not exists public.resource_files (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  category public.resource_category not null,
  description text not null default '',
  file_name text not null,
  file_path text not null,
  file_size bigint not null,
  expires_at date,
  created_at timestamptz not null default now(),
  constraint resource_files_name_required check (length(trim(name)) > 0),
  constraint resource_files_path_unique unique (file_path),
  constraint resource_files_size_positive check (file_size > 0 and file_size <= 20971520)
);

alter table public.resource_files add column if not exists expires_at date;

create index if not exists clients_owner_idx on public.clients(owner_id);
create index if not exists suppliers_owner_name_idx on public.suppliers(owner_id, company_name, contact_name);
create index if not exists jobs_owner_client_idx on public.jobs(owner_id, client_id);
create index if not exists documents_owner_client_idx on public.documents(owner_id, client_id);
create index if not exists documents_owner_date_idx on public.documents(owner_id, issue_date desc);
create index if not exists document_items_document_idx on public.document_items(document_id, position);
create index if not exists resource_files_owner_category_idx on public.resource_files(owner_id, category, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at before update on public.clients for each row execute function public.set_updated_at();
drop trigger if exists suppliers_set_updated_at on public.suppliers;
create trigger suppliers_set_updated_at before update on public.suppliers for each row execute function public.set_updated_at();
drop trigger if exists jobs_set_updated_at on public.jobs;
create trigger jobs_set_updated_at before update on public.jobs for each row execute function public.set_updated_at();
drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at before update on public.documents for each row execute function public.set_updated_at();

alter table public.clients enable row level security;
alter table public.suppliers enable row level security;
alter table public.jobs enable row level security;
alter table public.documents enable row level security;
alter table public.document_items enable row level security;
alter table public.resource_files enable row level security;

drop policy if exists clients_owner_all on public.clients;
create policy clients_owner_all on public.clients for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists suppliers_owner_all on public.suppliers;
create policy suppliers_owner_all on public.suppliers for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists jobs_owner_all on public.jobs;
create policy jobs_owner_all on public.jobs for all to authenticated
  using (owner_id = auth.uid())
  with check (
    owner_id = auth.uid()
    and exists (select 1 from public.clients c where c.id = client_id and c.owner_id = auth.uid())
  );

drop policy if exists documents_owner_all on public.documents;
create policy documents_owner_all on public.documents for all to authenticated
  using (owner_id = auth.uid())
  with check (
    owner_id = auth.uid()
    and exists (select 1 from public.clients c where c.id = client_id and c.owner_id = auth.uid())
    and (job_id is null or exists (
      select 1 from public.jobs j where j.id = job_id and j.client_id = client_id and j.owner_id = auth.uid()
    ))
  );

drop policy if exists document_items_owner_all on public.document_items;
create policy document_items_owner_all on public.document_items for all to authenticated
  using (
    owner_id = auth.uid()
    and exists (select 1 from public.documents d where d.id = document_id and d.owner_id = auth.uid())
  )
  with check (
    owner_id = auth.uid()
    and exists (select 1 from public.documents d where d.id = document_id and d.owner_id = auth.uid())
  );

drop policy if exists resource_files_owner_all on public.resource_files;
create policy resource_files_owner_all on public.resource_files for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('management-files', 'management-files', false, 20971520, array['application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists management_files_owner_select on storage.objects;
create policy management_files_owner_select on storage.objects for select to authenticated
  using (bucket_id = 'management-files' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists management_files_owner_insert on storage.objects;
create policy management_files_owner_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'management-files' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists management_files_owner_delete on storage.objects;
create policy management_files_owner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'management-files' and (storage.foldername(name))[1] = auth.uid()::text);

create or replace function public.next_document_number(p_type public.document_type)
returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  prefix text;
  sequence_number integer;
  candidate text;
begin
  prefix := case p_type::text when 'quote' then 'PREV' when 'proforma' then 'PRO' else 'FT' end;
  select count(*)::integer + 1 into sequence_number
  from public.documents
  where owner_id = auth.uid()
    and type = p_type
    and issue_date >= date_trunc('year', current_date)::date
    and issue_date < (date_trunc('year', current_date) + interval '1 year')::date;

  loop
    candidate := prefix || '-' || to_char(current_date, 'YYYY') || '-' || lpad(sequence_number::text, 3, '0');
    exit when not exists (
      select 1 from public.documents where owner_id = auth.uid() and type = p_type and number = candidate
    );
    sequence_number := sequence_number + 1;
  end loop;
  return candidate;
end;
$$;

create or replace function public.save_document(
  p_document_id uuid,
  p_client_id uuid,
  p_job_id uuid,
  p_type public.document_type,
  p_number text,
  p_issue_date date,
  p_expiry_date date,
  p_status public.document_status,
  p_subject text,
  p_notes text,
  p_payment_terms text,
  p_subtotal numeric,
  p_discount_percent numeric,
  p_tax_rate numeric,
  p_tax_amount numeric,
  p_total numeric,
  p_items jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  saved_id uuid;
  item jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.clients where id = p_client_id and owner_id = auth.uid()) then
    raise exception 'Invalid client';
  end if;
  if p_job_id is not null and not exists (
    select 1 from public.jobs where id = p_job_id and client_id = p_client_id and owner_id = auth.uid()
  ) then raise exception 'Invalid job'; end if;
  if length(trim(p_number)) = 0 then raise exception 'Document number required'; end if;
  if jsonb_array_length(p_items) = 0 then raise exception 'At least one item required'; end if;

  if p_document_id is null then
    insert into public.documents (
      owner_id, client_id, job_id, type, number, issue_date, expiry_date, status, subject, notes,
      payment_terms, subtotal, discount_percent, tax_rate, tax_amount, total
    ) values (
      auth.uid(), p_client_id, p_job_id, p_type, trim(p_number), p_issue_date, p_expiry_date, p_status,
      coalesce(p_subject, ''), coalesce(p_notes, ''), coalesce(p_payment_terms, ''), p_subtotal,
      p_discount_percent, p_tax_rate, p_tax_amount, p_total
    ) returning id into saved_id;
  else
    update public.documents set
      client_id = p_client_id, job_id = p_job_id, type = p_type, number = trim(p_number),
      issue_date = p_issue_date, expiry_date = p_expiry_date, status = p_status,
      subject = coalesce(p_subject, ''), notes = coalesce(p_notes, ''),
      payment_terms = coalesce(p_payment_terms, ''), subtotal = p_subtotal,
      discount_percent = p_discount_percent, tax_rate = p_tax_rate,
      tax_amount = p_tax_amount, total = p_total
    where id = p_document_id and owner_id = auth.uid()
    returning id into saved_id;
    if saved_id is null then raise exception 'Document not found'; end if;
    delete from public.document_items where document_id = saved_id and owner_id = auth.uid();
  end if;

  for item in select value from jsonb_array_elements(p_items)
  loop
    insert into public.document_items (owner_id, document_id, description, quantity, unit, unit_price, position)
    values (
      auth.uid(), saved_id, trim(item->>'description'), coalesce((item->>'quantity')::numeric, 0),
      coalesce(item->>'unit', ''), coalesce((item->>'unit_price')::numeric, 0),
      coalesce((item->>'position')::integer, 0)
    );
  end loop;
  return saved_id;
end;
$$;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.clients, public.suppliers, public.jobs, public.documents, public.document_items, public.resource_files to authenticated;
grant execute on function public.next_document_number(public.document_type) to authenticated;
grant execute on function public.save_document(uuid, uuid, uuid, public.document_type, text, date, date, public.document_status, text, text, text, numeric, numeric, numeric, numeric, numeric, jsonb) to authenticated;
