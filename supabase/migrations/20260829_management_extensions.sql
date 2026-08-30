-- Estensioni gestionali: scadenziario, scheda cliente, invii e numerazione.
-- Eseguire una volta nel SQL Editor di Supabase.

do $$ begin
  create type public.reminder_type as enum ('follow_up', 'payment', 'certification', 'other');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.interaction_type as enum ('note', 'call');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.communication_channel as enum ('email', 'whatsapp');
exception when duplicate_object then null;
end $$;

alter table public.resource_files add column if not exists expires_at date;

create table if not exists public.document_number_settings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  year integer not null,
  type public.document_type not null,
  prefix text not null,
  next_number integer not null default 1,
  padding integer not null default 3,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint document_number_settings_unique unique (owner_id, year, type),
  constraint document_number_settings_year_check check (year between 2000 and 2200),
  constraint document_number_settings_number_check check (next_number > 0 and padding between 1 and 8),
  constraint document_number_settings_prefix_check check (length(trim(prefix)) between 1 and 12)
);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type public.reminder_type not null,
  title text not null,
  notes text not null default '',
  due_date date not null,
  completed boolean not null default false,
  client_id uuid references public.clients(id) on delete set null,
  document_id uuid references public.documents(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint reminders_title_required check (length(trim(title)) > 0)
);

create table if not exists public.client_interactions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  type public.interaction_type not null,
  content text not null,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint client_interactions_content_required check (length(trim(content)) > 0)
);

create table if not exists public.client_files (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  file_name text not null,
  file_path text not null unique,
  file_size bigint not null,
  created_at timestamptz not null default now(),
  constraint client_files_name_required check (length(trim(name)) > 0),
  constraint client_files_size_check check (file_size > 0 and file_size <= 20971520)
);

create table if not exists public.document_communications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  channel public.communication_channel not null,
  recipient text not null,
  sent_at timestamptz not null default now()
);

create index if not exists reminders_owner_due_idx on public.reminders(owner_id, completed, due_date);
create index if not exists client_interactions_client_idx on public.client_interactions(owner_id, client_id, occurred_at desc);
create index if not exists client_files_client_idx on public.client_files(owner_id, client_id, created_at desc);
create index if not exists document_communications_document_idx on public.document_communications(owner_id, document_id, sent_at desc);

alter table public.document_number_settings enable row level security;
alter table public.reminders enable row level security;
alter table public.client_interactions enable row level security;
alter table public.client_files enable row level security;
alter table public.document_communications enable row level security;

drop policy if exists document_number_settings_owner_all on public.document_number_settings;
create policy document_number_settings_owner_all on public.document_number_settings for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists reminders_owner_all on public.reminders;
create policy reminders_owner_all on public.reminders for all to authenticated
  using (owner_id = auth.uid())
  with check (
    owner_id = auth.uid()
    and (client_id is null or exists (select 1 from public.clients c where c.id = client_id and c.owner_id = auth.uid()))
    and (document_id is null or exists (select 1 from public.documents d where d.id = document_id and d.owner_id = auth.uid()))
  );

drop policy if exists client_interactions_owner_all on public.client_interactions;
create policy client_interactions_owner_all on public.client_interactions for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and exists (select 1 from public.clients c where c.id = client_id and c.owner_id = auth.uid()));

drop policy if exists client_files_owner_all on public.client_files;
create policy client_files_owner_all on public.client_files for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and exists (select 1 from public.clients c where c.id = client_id and c.owner_id = auth.uid()));

drop policy if exists document_communications_owner_all on public.document_communications;
create policy document_communications_owner_all on public.document_communications for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and exists (select 1 from public.documents d where d.id = document_id and d.owner_id = auth.uid()));

grant select, insert, update, delete on public.document_number_settings, public.reminders, public.client_interactions, public.client_files, public.document_communications to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('client-files', 'client-files', false, 20971520, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists client_files_storage_owner_select on storage.objects;
create policy client_files_storage_owner_select on storage.objects for select to authenticated
  using (bucket_id = 'client-files' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists client_files_storage_owner_insert on storage.objects;
create policy client_files_storage_owner_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'client-files' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists client_files_storage_owner_delete on storage.objects;
create policy client_files_storage_owner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'client-files' and (storage.foldername(name))[1] = auth.uid()::text);

