-- Ciclo operativo completo: commesse, contabilità, incassi, acquisti, DDT e FatturaPA avanzata.
-- Eseguire dopo 20260829_operations_and_invoices.sql e 20260829_suppliers.sql.

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete restrict,
  code text not null,
  name text not null,
  address text not null default '',
  city text not null default '',
  province text not null default '',
  start_date date,
  end_date date,
  status text not null default 'planned' check (status in ('planned','active','completed','cancelled')),
  labor_cost numeric(12,2) not null default 0,
  travel_cost numeric(12,2) not null default 0,
  other_cost numeric(12,2) not null default 0,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, code),
  check (length(trim(code)) > 0 and length(trim(name)) > 0),
  check (labor_cost >= 0 and travel_cost >= 0 and other_cost >= 0)
);

alter table public.documents add column if not exists project_id uuid references public.projects(id) on delete set null;
alter table public.warranties add column if not exists project_id uuid references public.projects(id) on delete set null;
alter table public.inventory_usages add column if not exists project_id uuid references public.projects(id) on delete set null;

create table if not exists public.purchase_documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  project_id uuid references public.projects(id) on delete set null,
  kind text not null default 'invoice' check (kind in ('invoice','credit_note','receipt','other')),
  number text not null,
  issue_date date not null default current_date,
  due_date date,
  taxable_amount numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  paid_amount numeric(12,2) not null default 0,
  payment_date date,
  notes text not null default '',
  file_name text,
  file_path text,
  file_type text,
  file_size bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, supplier_id, kind, number),
  check (length(trim(number)) > 0),
  check (taxable_amount >= 0 and tax_amount >= 0 and total >= 0 and paid_amount >= 0 and paid_amount <= total)
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  category text not null default 'other' check (category in ('material','labor','travel','equipment','service','tax','other')),
  expense_date date not null default current_date,
  description text not null,
  amount numeric(12,2) not null,
  payment_method text not null default '',
  notes text not null default '',
  file_name text,
  file_path text,
  file_type text,
  file_size bigint,
  created_at timestamptz not null default now(),
  check (length(trim(description)) > 0 and amount > 0)
);

create table if not exists public.sales_payments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  kind text not null default 'partial' check (kind in ('deposit','partial','balance')),
  due_date date not null,
  amount numeric(12,2) not null,
  paid_date date,
  payment_method text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  check (amount > 0)
);

create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  project_id uuid references public.projects(id) on delete set null,
  number text not null,
  order_date date not null default current_date,
  expected_date date,
  status text not null default 'draft' check (status in ('draft','sent','partial','received','cancelled')),
  notes text not null default '',
  total numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, number),
  check (length(trim(number)) > 0 and total >= 0)
);

create table if not exists public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  order_id uuid not null references public.purchase_orders(id) on delete cascade,
  description text not null,
  quantity numeric(12,3) not null default 1,
  unit text not null default 'pz',
  unit_price numeric(12,2) not null default 0,
  position integer not null default 0,
  check (length(trim(description)) > 0 and quantity > 0 and unit_price >= 0)
);

create table if not exists public.delivery_notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  purchase_order_id uuid references public.purchase_orders(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  number text not null,
  delivery_date date not null default current_date,
  notes text not null default '',
  created_at timestamptz not null default now(),
  unique(owner_id, supplier_id, number),
  check (length(trim(number)) > 0)
);

create table if not exists public.delivery_note_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  delivery_note_id uuid not null references public.delivery_notes(id) on delete cascade,
  material_name text not null,
  lot_number text not null,
  drum_count integer not null,
  drum_weight_kg numeric(10,2) not null,
  inventory_lot_id uuid references public.inventory_lots(id) on delete set null,
  position integer not null default 0,
  check (length(trim(material_name)) > 0 and length(trim(lot_number)) > 0 and drum_count > 0 and drum_weight_kg > 0)
);

-- Dati aggiuntivi del tracciato FatturaPA.
alter table public.documents add column if not exists electronic_document_type text not null default 'TD01';
alter table public.documents add column if not exists stamp_duty boolean not null default false;
alter table public.documents add column if not exists stamp_amount numeric(12,2) not null default 2;
alter table public.documents add column if not exists withholding_type text not null default '';
alter table public.documents add column if not exists withholding_rate numeric(5,2) not null default 0;
alter table public.documents add column if not exists withholding_amount numeric(12,2) not null default 0;
alter table public.documents add column if not exists withholding_reason text not null default '';
alter table public.documents add column if not exists pension_fund_type text not null default '';
alter table public.documents add column if not exists pension_rate numeric(5,2) not null default 0;
alter table public.documents add column if not exists pension_amount numeric(12,2) not null default 0;
alter table public.documents add column if not exists pension_tax_rate numeric(5,2) not null default 0;
alter table public.documents add column if not exists pension_withheld boolean not null default false;
alter table public.documents add column if not exists split_payment boolean not null default false;
alter table public.documents add column if not exists order_reference text not null default '';
alter table public.documents add column if not exists order_date date;
alter table public.documents add column if not exists contract_reference text not null default '';
alter table public.documents add column if not exists contract_date date;
alter table public.documents add column if not exists ddt_reference text not null default '';
alter table public.documents add column if not exists ddt_date date;

alter table public.document_items add column if not exists tax_rate numeric(5,2);
alter table public.document_items add column if not exists nature_code text not null default '';
alter table public.document_items add column if not exists discount_percent numeric(5,2) not null default 0;

create index if not exists projects_owner_client_idx on public.projects(owner_id, client_id, status);
create index if not exists purchase_documents_owner_due_idx on public.purchase_documents(owner_id, due_date, payment_date);
create index if not exists expenses_owner_project_idx on public.expenses(owner_id, project_id, expense_date desc);
create index if not exists sales_payments_document_idx on public.sales_payments(owner_id, document_id, due_date);
create index if not exists purchase_orders_owner_supplier_idx on public.purchase_orders(owner_id, supplier_id, order_date desc);
create index if not exists delivery_notes_owner_supplier_idx on public.delivery_notes(owner_id, supplier_id, delivery_date desc);

alter table public.projects enable row level security;
alter table public.purchase_documents enable row level security;
alter table public.expenses enable row level security;
alter table public.sales_payments enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;
alter table public.delivery_notes enable row level security;
alter table public.delivery_note_items enable row level security;

drop policy if exists inventory_usages_owner_all on public.inventory_usages;
create policy inventory_usages_owner_all on public.inventory_usages for all to authenticated
  using (owner_id=auth.uid()) with check (
    owner_id=auth.uid()
    and exists(select 1 from public.inventory_lots l where l.id=lot_id and l.owner_id=auth.uid())
    and (client_id is null or exists(select 1 from public.clients c where c.id=client_id and c.owner_id=auth.uid()))
    and (project_id is null or exists(select 1 from public.projects p where p.id=project_id and p.owner_id=auth.uid()))
  );

drop policy if exists projects_owner_all on public.projects;
create policy projects_owner_all on public.projects for all to authenticated using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and exists(select 1 from public.clients c where c.id=client_id and c.owner_id=auth.uid()));
drop policy if exists purchase_documents_owner_all on public.purchase_documents;
create policy purchase_documents_owner_all on public.purchase_documents for all to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid());
drop policy if exists expenses_owner_all on public.expenses;
create policy expenses_owner_all on public.expenses for all to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid());
drop policy if exists sales_payments_owner_all on public.sales_payments;
create policy sales_payments_owner_all on public.sales_payments for all to authenticated using (owner_id=auth.uid())
  with check (owner_id=auth.uid() and exists(select 1 from public.documents d where d.id=document_id and d.owner_id=auth.uid()));
drop policy if exists purchase_orders_owner_all on public.purchase_orders;
create policy purchase_orders_owner_all on public.purchase_orders for all to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid());
drop policy if exists purchase_order_items_owner_all on public.purchase_order_items;
create policy purchase_order_items_owner_all on public.purchase_order_items for all to authenticated using (owner_id=auth.uid())
  with check (owner_id=auth.uid() and exists(select 1 from public.purchase_orders o where o.id=order_id and o.owner_id=auth.uid()));
drop policy if exists delivery_notes_owner_all on public.delivery_notes;
create policy delivery_notes_owner_all on public.delivery_notes for all to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid());
drop policy if exists delivery_note_items_owner_all on public.delivery_note_items;
create policy delivery_note_items_owner_all on public.delivery_note_items for all to authenticated using (owner_id=auth.uid())
  with check (owner_id=auth.uid() and exists(select 1 from public.delivery_notes d where d.id=delivery_note_id and d.owner_id=auth.uid()));

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at before update on public.projects for each row execute function public.set_updated_at();
drop trigger if exists purchase_documents_set_updated_at on public.purchase_documents;
create trigger purchase_documents_set_updated_at before update on public.purchase_documents for each row execute function public.set_updated_at();
drop trigger if exists purchase_orders_set_updated_at on public.purchase_orders;
create trigger purchase_orders_set_updated_at before update on public.purchase_orders for each row execute function public.set_updated_at();

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('accounting-files','accounting-files',false,20971520,array['application/pdf','application/xml','text/xml','image/jpeg','image/png'])
on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists accounting_files_owner_select on storage.objects;
create policy accounting_files_owner_select on storage.objects for select to authenticated using (bucket_id='accounting-files' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists accounting_files_owner_insert on storage.objects;
create policy accounting_files_owner_insert on storage.objects for insert to authenticated with check (bucket_id='accounting-files' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists accounting_files_owner_delete on storage.objects;
create policy accounting_files_owner_delete on storage.objects for delete to authenticated using (bucket_id='accounting-files' and (storage.foldername(name))[1]=auth.uid()::text);

grant select,insert,update,delete on public.projects,public.purchase_documents,public.expenses,public.sales_payments,public.purchase_orders,public.purchase_order_items,public.delivery_notes,public.delivery_note_items to authenticated;

-- Mantiene la firma RPC esistente, ma salva anche i nuovi dati fiscali per riga.
create or replace function public.save_document(
  p_document_id uuid, p_client_id uuid, p_job_id uuid, p_type public.document_type,
  p_number text, p_issue_date date, p_expiry_date date, p_status public.document_status,
  p_subject text, p_notes text, p_payment_terms text, p_subtotal numeric,
  p_discount_percent numeric, p_tax_rate numeric, p_tax_amount numeric, p_total numeric, p_items jsonb
) returns uuid language plpgsql security invoker set search_path = public as $$
declare saved_id uuid; item jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.clients where id=p_client_id and owner_id=auth.uid()) then raise exception 'Invalid client'; end if;
  if p_job_id is not null and not exists (select 1 from public.jobs where id=p_job_id and client_id=p_client_id and owner_id=auth.uid()) then raise exception 'Invalid job'; end if;
  if length(trim(p_number))=0 then raise exception 'Document number required'; end if;
  if jsonb_array_length(p_items)=0 then raise exception 'At least one item required'; end if;
  if p_document_id is null then
    insert into public.documents(owner_id,client_id,job_id,type,number,issue_date,expiry_date,status,subject,notes,payment_terms,subtotal,discount_percent,tax_rate,tax_amount,total)
    values(auth.uid(),p_client_id,p_job_id,p_type,trim(p_number),p_issue_date,p_expiry_date,p_status,coalesce(p_subject,''),coalesce(p_notes,''),coalesce(p_payment_terms,''),p_subtotal,p_discount_percent,p_tax_rate,p_tax_amount,p_total) returning id into saved_id;
  else
    update public.documents set client_id=p_client_id,job_id=p_job_id,type=p_type,number=trim(p_number),issue_date=p_issue_date,expiry_date=p_expiry_date,status=p_status,subject=coalesce(p_subject,''),notes=coalesce(p_notes,''),payment_terms=coalesce(p_payment_terms,''),subtotal=p_subtotal,discount_percent=p_discount_percent,tax_rate=p_tax_rate,tax_amount=p_tax_amount,total=p_total where id=p_document_id and owner_id=auth.uid() returning id into saved_id;
    if saved_id is null then raise exception 'Document not found'; end if;
    delete from public.document_items where document_id=saved_id and owner_id=auth.uid();
  end if;
  for item in select value from jsonb_array_elements(p_items) loop
    insert into public.document_items(owner_id,document_id,description,quantity,unit,unit_price,position,tax_rate,nature_code,discount_percent)
    values(auth.uid(),saved_id,trim(item->>'description'),coalesce((item->>'quantity')::numeric,0),coalesce(item->>'unit',''),coalesce((item->>'unit_price')::numeric,0),coalesce((item->>'position')::integer,0),coalesce((item->>'tax_rate')::numeric,p_tax_rate),coalesce(item->>'nature_code',''),coalesce((item->>'discount_percent')::numeric,0));
  end loop;
  return saved_id;
end; $$;
grant execute on function public.save_document(uuid,uuid,uuid,public.document_type,text,date,date,public.document_status,text,text,text,numeric,numeric,numeric,numeric,numeric,jsonb) to authenticated;
notify pgrst, 'reload schema';
