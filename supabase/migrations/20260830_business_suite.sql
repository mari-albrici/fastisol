-- Suite gestionale completa: audit/cestino, listino, agenda, diario cantiere,
-- ciclo SDI, scorte e snapshot dati. Eseguire dopo 20260830_full_operations.sql.

do $$
declare t text;
begin
  foreach t in array array['clients','suppliers','documents','resource_files','reminders','warranties','inventory_lots','inventory_usages','projects','purchase_documents','expenses','sales_payments','purchase_orders','delivery_notes','client_interactions','client_files'] loop
    execute format('alter table public.%I add column if not exists deleted_at timestamptz', t);
  end loop;
end $$;

alter table public.projects add column if not exists planned_revenue numeric(12,2) not null default 0;
alter table public.projects add column if not exists estimated_material_cost numeric(12,2) not null default 0;
alter table public.projects add column if not exists estimated_labor_cost numeric(12,2) not null default 0;
alter table public.projects add column if not exists estimated_travel_cost numeric(12,2) not null default 0;
alter table public.projects add column if not exists estimated_other_cost numeric(12,2) not null default 0;
alter table public.projects add column if not exists area_sqm numeric(12,2) not null default 0;
alter table public.inventory_lots add column if not exists unit_cost numeric(12,2) not null default 0;
alter table public.documents add column if not exists sdi_id text not null default '';
alter table public.documents add column if not exists electronic_status text not null default 'not_sent'
  check (electronic_status in ('not_sent','exported','sent','delivered','not_delivered','rejected','corrected','cancelled'));
alter table public.documents add column if not exists electronic_sent_at timestamptz;

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  table_name text not null,
  record_id uuid,
  action text not null check(action in ('INSERT','UPDATE','DELETE')),
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.write_audit_log() returns trigger language plpgsql security definer set search_path=public as $$
declare actor uuid; row_owner uuid;
begin
  actor := auth.uid();
  if tg_op='DELETE' then row_owner := old.owner_id; else row_owner := new.owner_id; end if;
  if actor is not null and actor=row_owner then
    insert into public.audit_logs(owner_id,table_name,record_id,action,old_data,new_data)
    values(actor,tg_table_name,case when tg_op='DELETE' then old.id else new.id end,tg_op,case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end);
  end if;
  if tg_op='DELETE' then return old; else return new; end if;
end $$;

do $$
declare t text;
begin
  foreach t in array array['clients','suppliers','documents','resource_files','reminders','warranties','inventory_lots','inventory_usages','projects','purchase_documents','expenses','sales_payments','purchase_orders','delivery_notes','client_interactions','client_files'] loop
    execute format('drop trigger if exists %I_audit on public.%I', t, t);
    execute format('create trigger %I_audit after insert or update or delete on public.%I for each row execute function public.write_audit_log()', t, t);
  end loop;
end $$;

create table if not exists public.catalog_items (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  code text not null, description text not null, category text not null default '', unit text not null default 'mq',
  sale_price numeric(12,2) not null default 0, estimated_cost numeric(12,2) not null default 0,
  tax_rate numeric(5,2) not null default 22, nature_code text not null default '', active boolean not null default true,
  notes text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz,
  unique(owner_id,code), check(length(trim(code))>0 and length(trim(description))>0 and sale_price>=0 and estimated_cost>=0)
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null, members text not null default '', phone text not null default '', notes text not null default '', active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz,
  unique(owner_id,name), check(length(trim(name))>0)
);

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null, client_id uuid references public.clients(id) on delete set null,
  team_id uuid references public.teams(id) on delete set null, type text not null default 'job' check(type in ('inspection','job','delivery','follow_up','other')),
  title text not null, starts_at timestamptz not null, ends_at timestamptz not null, address text not null default '', notes text not null default '', completed boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz,
  check(length(trim(title))>0 and ends_at>=starts_at)
);

create table if not exists public.project_diary_entries (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade, work_date date not null default current_date,
  team_id uuid references public.teams(id) on delete set null, start_time time, end_time time, workers integer not null default 1,
  area_completed_sqm numeric(12,2) not null default 0, temperature_c numeric(5,2), conditions text not null default '',
  work_done text not null, issues text not null default '', client_signature text not null default '',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz,
  check(workers>0 and area_completed_sqm>=0 and length(trim(work_done))>0)
);

create table if not exists public.project_diary_files (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  entry_id uuid not null references public.project_diary_entries(id) on delete cascade,
  file_name text not null, file_path text not null, file_type text not null default '', file_size bigint not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.electronic_invoice_events (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  status text not null check(status in ('exported','sent','delivered','not_delivered','rejected','corrected','cancelled')),
  sdi_id text not null default '', event_at timestamptz not null default now(), reason text not null default '',
  file_name text, file_path text, file_type text, file_size bigint, created_at timestamptz not null default now()
);

create table if not exists public.inventory_material_settings (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  material_name text not null, supplier_id uuid references public.suppliers(id) on delete set null,
  min_drums integer not null default 2, reorder_drums integer not null default 5, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(owner_id,material_name), check(length(trim(material_name))>0 and min_drums>=0 and reorder_drums>0)
);

create table if not exists public.backup_snapshots (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  label text not null default '', payload jsonb not null, created_at timestamptz not null default now()
);

create or replace function public.create_management_snapshot(p_label text default '') returns uuid language plpgsql security invoker set search_path=public as $$
declare snapshot_id uuid; content jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select jsonb_build_object(
    'created_at',now(),'clients',(select coalesce(jsonb_agg(c),'[]') from clients c where owner_id=auth.uid()),
    'suppliers',(select coalesce(jsonb_agg(s),'[]') from suppliers s where owner_id=auth.uid()),
    'projects',(select coalesce(jsonb_agg(p),'[]') from projects p where owner_id=auth.uid()),
    'documents',(select coalesce(jsonb_agg(d),'[]') from documents d where owner_id=auth.uid()),
    'document_items',(select coalesce(jsonb_agg(i),'[]') from document_items i where owner_id=auth.uid()),
    'purchase_documents',(select coalesce(jsonb_agg(p),'[]') from purchase_documents p where owner_id=auth.uid()),
    'expenses',(select coalesce(jsonb_agg(e),'[]') from expenses e where owner_id=auth.uid()),
    'sales_payments',(select coalesce(jsonb_agg(s),'[]') from sales_payments s where owner_id=auth.uid()),
    'inventory_lots',(select coalesce(jsonb_agg(l),'[]') from inventory_lots l where owner_id=auth.uid()),
    'inventory_usages',(select coalesce(jsonb_agg(u),'[]') from inventory_usages u where owner_id=auth.uid()),
    'warranties',(select coalesce(jsonb_agg(w),'[]') from warranties w where owner_id=auth.uid()),
    'resource_files',(select coalesce(jsonb_agg(r),'[]') from resource_files r where owner_id=auth.uid()),
    'client_files',(select coalesce(jsonb_agg(f),'[]') from client_files f where owner_id=auth.uid()),
    'catalog_items',(select coalesce(jsonb_agg(i),'[]') from catalog_items i where owner_id=auth.uid()),
    'calendar_events',(select coalesce(jsonb_agg(e),'[]') from calendar_events e where owner_id=auth.uid()),
    'project_diary_entries',(select coalesce(jsonb_agg(e),'[]') from project_diary_entries e where owner_id=auth.uid()),
    'project_diary_files',(select coalesce(jsonb_agg(f),'[]') from project_diary_files f where owner_id=auth.uid()),
    'electronic_invoice_events',(select coalesce(jsonb_agg(e),'[]') from electronic_invoice_events e where owner_id=auth.uid())
  ) into content;
  insert into backup_snapshots(owner_id,label,payload) values(auth.uid(),coalesce(p_label,''),content) returning id into snapshot_id;
  delete from backup_snapshots where owner_id=auth.uid() and id not in (select id from backup_snapshots where owner_id=auth.uid() order by created_at desc limit 30);
  return snapshot_id;
end $$;

create or replace function public.restore_archived_record(p_table text,p_id uuid) returns void language plpgsql security invoker set search_path=public as $$
begin
  if p_table <> all(array['clients','suppliers','documents','resource_files','reminders','warranties','inventory_lots','inventory_usages','projects','purchase_documents','expenses','sales_payments','purchase_orders','delivery_notes','client_interactions','client_files','catalog_items','teams','calendar_events','project_diary_entries']) then raise exception 'Table not allowed'; end if;
  execute format('update public.%I set deleted_at=null where id=$1 and owner_id=$2',p_table) using p_id,auth.uid();
end $$;

create or replace function public.audit_suite_table() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is not null then insert into audit_logs(owner_id,table_name,record_id,action,old_data,new_data) values(auth.uid(),tg_table_name,case when tg_op='DELETE' then old.id else new.id end,tg_op,case when tg_op in('UPDATE','DELETE') then to_jsonb(old) end,case when tg_op in('INSERT','UPDATE') then to_jsonb(new) end); end if;
  if tg_op='DELETE' then return old; else return new; end if;
end $$;

do $$ declare t text; begin foreach t in array array['catalog_items','teams','calendar_events','project_diary_entries','electronic_invoice_events','inventory_material_settings'] loop execute format('drop trigger if exists %I_audit on public.%I',t,t); execute format('create trigger %I_audit after insert or update or delete on public.%I for each row execute function public.audit_suite_table()',t,t); end loop; end $$;

do $$ declare t text; begin foreach t in array array['audit_logs','catalog_items','teams','calendar_events','project_diary_entries','project_diary_files','electronic_invoice_events','inventory_material_settings','backup_snapshots'] loop execute format('alter table public.%I enable row level security',t); execute format('drop policy if exists %I_owner_all on public.%I',t,t); execute format('create policy %I_owner_all on public.%I for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid())',t,t); end loop; end $$;

do $$ declare t text; begin foreach t in array array['catalog_items','teams','calendar_events','project_diary_entries','inventory_material_settings'] loop execute format('drop trigger if exists %I_set_updated_at on public.%I',t,t); execute format('create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()',t,t); end loop; end $$;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
('site-files','site-files',false,20971520,array['image/jpeg','image/png','image/webp','application/pdf']),
('sdi-files','sdi-files',false,20971520,array['application/xml','text/xml','application/pdf','application/zip'])
on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
do $$ declare b text; begin foreach b in array array['site-files','sdi-files'] loop
  execute format('drop policy if exists %I_owner_select on storage.objects',replace(b,'-','_'));
  execute format('create policy %I_owner_select on storage.objects for select to authenticated using(bucket_id=%L and (storage.foldername(name))[1]=auth.uid()::text)',replace(b,'-','_'),b);
  execute format('drop policy if exists %I_owner_insert on storage.objects',replace(b,'-','_'));
  execute format('create policy %I_owner_insert on storage.objects for insert to authenticated with check(bucket_id=%L and (storage.foldername(name))[1]=auth.uid()::text)',replace(b,'-','_'),b);
  execute format('drop policy if exists %I_owner_delete on storage.objects',replace(b,'-','_'));
  execute format('create policy %I_owner_delete on storage.objects for delete to authenticated using(bucket_id=%L and (storage.foldername(name))[1]=auth.uid()::text)',replace(b,'-','_'),b);
end loop; end $$;

create index if not exists audit_logs_owner_created_idx on public.audit_logs(owner_id,created_at desc);
create index if not exists calendar_events_owner_start_idx on public.calendar_events(owner_id,starts_at);
create index if not exists diary_owner_project_date_idx on public.project_diary_entries(owner_id,project_id,work_date desc);
create index if not exists invoice_events_owner_document_idx on public.electronic_invoice_events(owner_id,document_id,event_at desc);
grant select,insert,update,delete on public.audit_logs,public.catalog_items,public.teams,public.calendar_events,public.project_diary_entries,public.project_diary_files,public.electronic_invoice_events,public.inventory_material_settings,public.backup_snapshots to authenticated;
grant usage,select on sequence public.audit_logs_id_seq to authenticated;
grant execute on function public.create_management_snapshot(text),public.restore_archived_record(text,uuid) to authenticated;
notify pgrst,'reload schema';
