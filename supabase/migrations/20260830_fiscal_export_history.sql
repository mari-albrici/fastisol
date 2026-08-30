-- Numerazione fiscale separata, snapshot XML immutabili e prenotazione atomica.

create table if not exists public.fiscal_exports (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  source_document_id uuid not null references public.documents(id) on delete restrict,
  fiscal_year integer not null,
  fiscal_number text not null,
  issue_date date not null,
  document_type text not null,
  reason text not null default '',
  source_reference text not null default '',
  transmission_progressive text not null,
  xml_file_name text not null,
  xml_size bigint not null,
  xml_sha256 text not null,
  xml_snapshot text not null,
  source_snapshot jsonb not null,
  xsd_version text not null default '1.2.3',
  created_at timestamptz not null default now(),
  constraint fiscal_exports_number_unique unique(owner_id, fiscal_year, fiscal_number),
  constraint fiscal_exports_number_required check(length(trim(fiscal_number)) between 1 and 20),
  constraint fiscal_exports_document_type_check check(document_type ~ '^TD[0-9]{2}$'),
  constraint fiscal_exports_year_check check(fiscal_year = extract(year from issue_date)::integer),
  constraint fiscal_exports_xml_required check(length(xml_snapshot) > 0 and xml_size > 0 and length(xml_sha256) = 64)
);

create index if not exists fiscal_exports_source_idx on public.fiscal_exports(owner_id, source_document_id, created_at desc);

alter table public.fiscal_exports enable row level security;
drop policy if exists fiscal_exports_owner_select on public.fiscal_exports;
create policy fiscal_exports_owner_select on public.fiscal_exports for select to authenticated using(owner_id = auth.uid());
drop policy if exists fiscal_exports_owner_insert on public.fiscal_exports;
create policy fiscal_exports_owner_insert on public.fiscal_exports for insert to authenticated
  with check(owner_id = auth.uid() and exists(select 1 from public.documents d where d.id = source_document_id and d.owner_id = auth.uid() and d.type = 'proforma'));
grant select on public.fiscal_exports to authenticated;
revoke insert, update, delete on public.fiscal_exports from authenticated;

create or replace function public.prevent_fiscal_export_mutation() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  raise exception 'Le esportazioni fiscali sono immutabili';
end;
$$;

drop trigger if exists fiscal_exports_immutable on public.fiscal_exports;
create trigger fiscal_exports_immutable before update or delete on public.fiscal_exports
for each row execute function public.prevent_fiscal_export_mutation();

create or replace function public.record_fiscal_exports(p_exports jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  export_count integer;
  export_row jsonb;
  export_year integer;
  numbering public.document_number_settings%rowtype;
  invoice_config public.invoice_settings%rowtype;
  expected_number text;
  expected_progressive text;
  offset_index integer := 0;
  inserted_ids jsonb := '[]'::jsonb;
  inserted_id uuid;
begin
  if auth.uid() is null then raise exception 'Autenticazione richiesta'; end if;
  if jsonb_typeof(p_exports) <> 'array' then raise exception 'Elenco esportazioni non valido'; end if;
  export_count := jsonb_array_length(p_exports);
  if export_count < 1 then raise exception 'Nessuna esportazione da registrare'; end if;

  export_year := extract(year from (p_exports->0->>'issue_date')::date)::integer;

  select * into numbering from public.document_number_settings
  where owner_id = auth.uid() and year = export_year and type = 'invoice'
  for update;
  if not found then
    insert into public.document_number_settings(owner_id, year, type, prefix, next_number, padding)
    values(auth.uid(), export_year, 'invoice', 'FT', 1, 3)
    returning * into numbering;
  end if;

  select * into invoice_config from public.invoice_settings where owner_id = auth.uid() for update;
  if not found then raise exception 'Completa prima i dati XML per Aruba nelle impostazioni'; end if;

  for export_row in select value from jsonb_array_elements(p_exports) loop
    if not exists(select 1 from public.documents d where d.id = (export_row->>'source_document_id')::uuid and d.owner_id = auth.uid() and d.type = 'proforma') then
      raise exception 'Proforma non valida o non accessibile';
    end if;
    if extract(year from (export_row->>'issue_date')::date)::integer <> export_year then
      raise exception 'Tutte le fatture del lotto devono appartenere allo stesso anno';
    end if;
    expected_number := numbering.prefix || '-' || export_year || '-' || lpad((numbering.next_number + offset_index)::text, numbering.padding, '0');
    expected_progressive := lpad((invoice_config.transmission_sequence + offset_index)::text, 5, '0');
    if export_row->>'fiscal_number' <> expected_number then
      raise exception 'Numero fiscale non più disponibile. Atteso: %', expected_number;
    end if;
    if export_row->>'transmission_progressive' <> expected_progressive then
      raise exception 'Progressivo di trasmissione non più disponibile. Riapri la finestra di esportazione';
    end if;

    insert into public.fiscal_exports(
      owner_id, source_document_id, fiscal_year, fiscal_number, issue_date, document_type,
      reason, source_reference, transmission_progressive, xml_file_name, xml_size,
      xml_sha256, xml_snapshot, source_snapshot, xsd_version
    ) values (
      auth.uid(), (export_row->>'source_document_id')::uuid, export_year,
      export_row->>'fiscal_number', (export_row->>'issue_date')::date,
      export_row->>'document_type', coalesce(export_row->>'reason',''),
      coalesce(export_row->>'source_reference',''), export_row->>'transmission_progressive',
      export_row->>'xml_file_name', (export_row->>'xml_size')::bigint,
      export_row->>'xml_sha256', export_row->>'xml_snapshot', export_row->'source_snapshot', '1.2.3'
    ) returning id into inserted_id;
    inserted_ids := inserted_ids || jsonb_build_array(inserted_id);
    offset_index := offset_index + 1;
  end loop;

  update public.document_number_settings set next_number = next_number + export_count where id = numbering.id;
  update public.invoice_settings set transmission_sequence = transmission_sequence + export_count where id = invoice_config.id;
  return inserted_ids;
end;
$$;

revoke all on function public.record_fiscal_exports(jsonb) from public;
grant execute on function public.record_fiscal_exports(jsonb) to authenticated;
