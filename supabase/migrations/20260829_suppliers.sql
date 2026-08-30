-- Anagrafica fornitori e collegamento con i lotti di magazzino.
-- Eseguire dopo 20260829_operations_and_invoices.sql.

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
create index if not exists suppliers_owner_name_idx on public.suppliers(owner_id, company_name, contact_name);

alter table public.suppliers enable row level security;
drop policy if exists suppliers_owner_all on public.suppliers;
create policy suppliers_owner_all on public.suppliers for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop trigger if exists suppliers_set_updated_at on public.suppliers;
create trigger suppliers_set_updated_at before update on public.suppliers
for each row execute function public.set_updated_at();

grant select, insert, update, delete on public.suppliers to authenticated;

-- I campi già usati dall'anagrafica clienti e dall'XML FatturaPA.
alter table public.clients add column if not exists country text not null default 'IT';
alter table public.clients add column if not exists sdi_code text not null default '';
alter table public.clients add column if not exists pec text not null default '';

-- Collega il lotto al fornitore mantenendo anche il vecchio riferimento testuale.
alter table if exists public.inventory_lots add column if not exists supplier_id uuid references public.suppliers(id) on delete set null;
do $$ begin
  if to_regclass('public.inventory_lots') is not null then
    create index if not exists inventory_lots_supplier_idx on public.inventory_lots(owner_id, supplier_id);
  end if;
end $$;

notify pgrst, 'reload schema';
