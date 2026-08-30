-- Eseguire nel SQL Editor di Supabase se lo schema Fastisol era già stato installato.
alter table public.documents
  add column if not exists approved boolean not null default false,
  add column if not exists work_completed boolean not null default false,
  add column if not exists other_amount numeric(12,2) not null default 0;
