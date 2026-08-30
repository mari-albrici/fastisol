-- Schede tecniche e certificazioni PDF.
-- Eseguire una volta nel SQL Editor di Supabase.

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
  file_path text not null,
  file_size bigint not null,
  expires_at date,
  created_at timestamptz not null default now(),
  constraint resource_files_name_required check (length(trim(name)) > 0),
  constraint resource_files_path_unique unique (file_path),
  constraint resource_files_size_positive check (file_size > 0 and file_size <= 20971520)
);

alter table public.resource_files add column if not exists expires_at date;

create index if not exists resource_files_owner_category_idx
  on public.resource_files(owner_id, category, created_at desc);

alter table public.resource_files enable row level security;

drop policy if exists resource_files_owner_all on public.resource_files;
create policy resource_files_owner_all on public.resource_files for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

grant select, insert, update, delete on public.resource_files to authenticated;

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
