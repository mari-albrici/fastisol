-- Google Calendar bidirezionale e metadati di scansione magazzino.
-- Eseguire dopo 20260830_business_suite.sql.

alter table public.calendar_events add column if not exists google_event_id text;
alter table public.calendar_events add column if not exists google_calendar_id text;
alter table public.calendar_events add column if not exists google_updated_at timestamptz;
alter table public.calendar_events add column if not exists google_synced_at timestamptz;
alter table public.calendar_events add column if not exists google_html_link text;

create unique index if not exists calendar_events_google_unique
  on public.calendar_events(owner_id, google_calendar_id, google_event_id)
  where google_event_id is not null;

create index if not exists calendar_events_google_sync_idx
  on public.calendar_events(owner_id, google_synced_at);

notify pgrst, 'reload schema';
