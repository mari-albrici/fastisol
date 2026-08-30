import { supabase } from './supabase'
import type { CalendarEvent, CalendarEventType } from './types'

const googleCalendarScope = 'https://www.googleapis.com/auth/calendar.events'

type TokenResponse = { access_token?: string; error?: string; error_description?: string }
type TokenClient = { requestAccessToken: (options?: { prompt?: string }) => void }
type GoogleIdentityWindow = Window & { google?: { accounts: { oauth2: { initTokenClient: (options: { client_id: string; scope: string; callback: (response: TokenResponse) => void; error_callback?: () => void }) => TokenClient } } } }

type GoogleEvent = {
  id: string
  status?: 'confirmed' | 'cancelled'
  summary?: string
  description?: string
  location?: string
  updated?: string
  htmlLink?: string
  start?: { dateTime?: string; date?: string }
  end?: { dateTime?: string; date?: string }
  extendedProperties?: { private?: Record<string, string> }
}

type GoogleEventsResponse = { items?: GoogleEvent[]; nextPageToken?: string }

export type CalendarSyncResult = { imported: number; exported: number; updated: number; removed: number }

export async function requestGoogleCalendarToken(clientId: string) {
  await loadGoogleIdentity()
  const google = (window as GoogleIdentityWindow).google
  if (!google) throw new Error('Google Identity Services non è disponibile.')
  return new Promise<string>((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: googleCalendarScope,
      callback: (response) => response.access_token ? resolve(response.access_token) : reject(new Error(response.error_description || 'Autorizzazione Google non riuscita.')),
      error_callback: () => reject(new Error('La finestra di autorizzazione Google è stata chiusa.')),
    })
    client.requestAccessToken({ prompt: 'consent' })
  })
}

export async function syncGoogleCalendar(accessToken: string, calendarId = 'primary'): Promise<CalendarSyncResult> {
  const { data, error } = await supabase.from('calendar_events').select('*').order('starts_at')
  if (error) throw new Error('Impossibile leggere l’agenda locale. Esegui la migrazione Google Calendar.')
  const locals = (data ?? []) as CalendarEvent[]
  const remoteEvents = await listGoogleEvents(accessToken, calendarId)
  const remoteById = new Map(remoteEvents.map((event) => [event.id, event]))
  const remoteByFastisolId = new Map(remoteEvents.flatMap((event) => { const id = event.extendedProperties?.private?.fastisolEventId; return id ? [[id, event] as const] : [] }))
  const matchedRemoteIds = new Set<string>()
  const result: CalendarSyncResult = { imported: 0, exported: 0, updated: 0, removed: 0 }

  for (const local of locals) {
    if (local.deleted_at) {
      if (local.google_event_id) {
        matchedRemoteIds.add(local.google_event_id)
        await googleRequest(accessToken, eventUrl(calendarId, local.google_event_id), { method: 'DELETE' }, true)
        await supabase.from('calendar_events').update({ google_event_id: null, google_calendar_id: null, google_updated_at: null, google_synced_at: new Date().toISOString(), google_html_link: null }).eq('id', local.id)
        result.removed += 1
      }
      continue
    }

    const remote = local.google_event_id ? remoteById.get(local.google_event_id) : remoteByFastisolId.get(local.id)
    if (remote) matchedRemoteIds.add(remote.id)
    if (local.google_event_id && !remote) {
      await supabase.from('calendar_events').update({ deleted_at: new Date().toISOString(), google_synced_at: new Date().toISOString() }).eq('id', local.id)
      result.removed += 1
      continue
    }
    if (remote?.status === 'cancelled') {
      await supabase.from('calendar_events').update({ deleted_at: new Date().toISOString(), google_synced_at: new Date().toISOString(), google_updated_at: remote.updated ?? null }).eq('id', local.id)
      result.removed += 1
      continue
    }

    if (!remote) {
      const created = await googleRequest<GoogleEvent>(accessToken, eventsUrl(calendarId), { method: 'POST', body: JSON.stringify(toGoogleEvent(local)) })
      await storeGoogleMetadata(local.id, calendarId, created)
      result.exported += 1
      continue
    }

    const syncTime = local.google_synced_at ? new Date(local.google_synced_at).getTime() : 0
    const localTime = local.updated_at ? new Date(local.updated_at).getTime() : 0
    const remoteTime = remote.updated ? new Date(remote.updated).getTime() : 0
    const localChanged = localTime > syncTime + 1500
    const remoteChanged = remoteTime > syncTime + 1500
    if (remoteChanged && (!localChanged || remoteTime > localTime)) {
      await updateLocalFromGoogle(local.id, calendarId, remote)
      result.updated += 1
    } else if (localChanged) {
      const updated = await googleRequest<GoogleEvent>(accessToken, eventUrl(calendarId, remote.id), { method: 'PATCH', body: JSON.stringify(toGoogleEvent(local)) })
      await storeGoogleMetadata(local.id, calendarId, updated)
      result.updated += 1
    }
  }

  for (const remote of remoteEvents) {
    if (remote.status === 'cancelled' || matchedRemoteIds.has(remote.id)) continue
    const fastisolId = remote.extendedProperties?.private?.fastisolEventId
    if (fastisolId && locals.some((local) => local.id === fastisolId)) continue
    const interval = googleInterval(remote)
    if (!interval) continue
    const { error: insertError } = await supabase.from('calendar_events').insert({
      type: 'other' satisfies CalendarEventType,
      title: remote.summary?.trim() || 'Evento Google Calendar',
      starts_at: interval.start,
      ends_at: interval.end,
      address: remote.location ?? '',
      notes: remote.description ?? '',
      completed: false,
      google_event_id: remote.id,
      google_calendar_id: calendarId,
      google_updated_at: remote.updated ?? null,
      google_synced_at: new Date().toISOString(),
      google_html_link: remote.htmlLink ?? null,
    })
    if (!insertError) result.imported += 1
  }
  return result
}

function toGoogleEvent(event: CalendarEvent) {
  return {
    summary: event.title,
    description: event.notes,
    location: event.address,
    start: { dateTime: event.starts_at, timeZone: 'Europe/Rome' },
    end: { dateTime: event.ends_at, timeZone: 'Europe/Rome' },
    extendedProperties: { private: { fastisolEventId: event.id, fastisolSource: 'gestionale' } },
  }
}

async function updateLocalFromGoogle(id: string, calendarId: string, remote: GoogleEvent) {
  const interval = googleInterval(remote)
  if (!interval) return
  await supabase.from('calendar_events').update({ title: remote.summary?.trim() || 'Evento Google Calendar', starts_at: interval.start, ends_at: interval.end, address: remote.location ?? '', notes: remote.description ?? '', google_event_id: remote.id, google_calendar_id: calendarId, google_updated_at: remote.updated ?? null, google_synced_at: new Date().toISOString(), google_html_link: remote.htmlLink ?? null }).eq('id', id)
}

async function storeGoogleMetadata(id: string, calendarId: string, remote: GoogleEvent) {
  await supabase.from('calendar_events').update({ google_event_id: remote.id, google_calendar_id: calendarId, google_updated_at: remote.updated ?? null, google_synced_at: new Date().toISOString(), google_html_link: remote.htmlLink ?? null }).eq('id', id)
}

function googleInterval(event: GoogleEvent) {
  const start = event.start?.dateTime ?? event.start?.date
  const end = event.end?.dateTime ?? event.end?.date
  if (!start || !end) return null
  return { start: new Date(start).toISOString(), end: new Date(end).toISOString() }
}

async function listGoogleEvents(accessToken: string, calendarId: string) {
  const items: GoogleEvent[] = []
  let pageToken = ''
  do {
    const params = new URLSearchParams({ singleEvents: 'true', showDeleted: 'true', maxResults: '2500' })
    if (pageToken) params.set('pageToken', pageToken)
    const response = await googleRequest<GoogleEventsResponse>(accessToken, `${eventsUrl(calendarId)}?${params}`)
    items.push(...(response.items ?? []))
    pageToken = response.nextPageToken ?? ''
  } while (pageToken)
  return items
}

function eventsUrl(calendarId: string) { return `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events` }
function eventUrl(calendarId: string, eventId: string) { return `${eventsUrl(calendarId)}/${encodeURIComponent(eventId)}` }

async function googleRequest<T = unknown>(accessToken: string, url: string, init: RequestInit = {}, ignoreNotFound = false): Promise<T> {
  const response = await fetch(url, { ...init, headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', ...init.headers } })
  if (ignoreNotFound && response.status === 404) return undefined as T
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: { message?: string } } | null
    if (response.status === 401) throw new Error('La sessione Google è scaduta: collega nuovamente il calendario.')
    throw new Error(payload?.error?.message || `Google Calendar ha risposto con errore ${response.status}.`)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

function loadGoogleIdentity() {
  if ((window as GoogleIdentityWindow).google?.accounts.oauth2) return Promise.resolve()
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-identity]')
    if (existing) { existing.addEventListener('load', () => resolve(), { once: true }); existing.addEventListener('error', () => reject(new Error('Impossibile caricare Google Identity Services.')), { once: true }); return }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.dataset.googleIdentity = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Impossibile caricare Google Identity Services.'))
    document.head.appendChild(script)
  })
}
