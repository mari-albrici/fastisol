import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ManagementIcon } from './ManagementIcon'
import { supabase } from './supabase'
import { documentTypeLabels, reminderTypeLabels, type BusinessDocument, type Client, type Reminder, type ReminderType, type ResourceFile } from './types'
import { clientDisplayName, formatDate, todayIso } from './utils'

const emptyForm = { type: 'follow_up' as ReminderType, title: '', notes: '', due_date: todayIso(), client_id: '', document_id: '' }

export function ManagementDeadlinesPage() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [documents, setDocuments] = useState<BusinessDocument[]>([])
  const [resources, setResources] = useState<ResourceFile[]>([])
  const [filter, setFilter] = useState<'open' | 'completed' | 'all'>('open')
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    const [remindersResult, clientsResult, documentsResult, resourcesResult] = await Promise.all([
      supabase.from('reminders').select('*, clients(company_name, contact_name), documents(number, type)').is('deleted_at',null).order('due_date'),
      supabase.from('clients').select('*').is('deleted_at',null).order('company_name').order('contact_name'),
      supabase.from('documents').select('*, clients(company_name, contact_name)').is('deleted_at',null).order('issue_date', { ascending: false }),
      supabase.from('resource_files').select('*').is('deleted_at',null).not('expires_at', 'is', null).order('expires_at'),
    ])
    if (remindersResult.error || clientsResult.error || documentsResult.error || resourcesResult.error) setError('Non è stato possibile caricare lo scadenziario. Verifica la migrazione Supabase.')
    else {
      setReminders((remindersResult.data ?? []) as Reminder[])
      setClients((clientsResult.data ?? []) as Client[])
      setDocuments((documentsResult.data ?? []) as BusinessDocument[])
      setResources((resourcesResult.data ?? []) as ResourceFile[])
    }
    setLoading(false)
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(timer)
  }, [])

  const visibleReminders = useMemo(() => reminders.filter((reminder) => filter === 'all' || (filter === 'completed' ? reminder.completed : !reminder.completed)), [filter, reminders])
  const automaticDeadlines = useMemo(() => [
    ...documents.filter((document) => document.expiry_date && ((document.type === 'quote' && !document.approved) || (document.type !== 'quote' && document.status !== 'paid'))).map((document) => ({ id: `document-${document.id}`, due_date: document.expiry_date!, title: document.type === 'quote' ? `Richiamare ${document.clients ? clientDisplayName(document.clients) : document.number}` : `Pagamento ${document.number}`, label: document.type === 'quote' ? 'Richiamo preventivo' : 'Pagamento', href: `/gestionale/documenti/${document.id}` })),
    ...resources.filter((resource) => resource.expires_at).map((resource) => ({ id: `resource-${resource.id}`, due_date: resource.expires_at!, title: resource.name, label: 'Certificazione', href: '/gestionale/schede-certificazioni' })),
  ].sort((a, b) => a.due_date.localeCompare(b.due_date)), [documents, resources])
  const availableDocuments = form.client_id ? documents.filter((document) => document.client_id === form.client_id) : documents

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError('')
    const { error: saveError } = await supabase.from('reminders').insert({
      type: form.type, title: form.title.trim(), notes: form.notes.trim(), due_date: form.due_date,
      client_id: form.client_id || null, document_id: form.document_id || null,
    })
    if (saveError) setError('Non è stato possibile salvare la scadenza.')
    else { setFormOpen(false); setForm(emptyForm); await load() }
    setSaving(false)
  }

  const toggleCompleted = async (reminder: Reminder, completed: boolean) => {
    setReminders((current) => current.map((item) => item.id === reminder.id ? { ...item, completed } : item))
    const { error: updateError } = await supabase.from('reminders').update({ completed }).eq('id', reminder.id)
    if (updateError) { setReminders((current) => current.map((item) => item.id === reminder.id ? { ...item, completed: !completed } : item)); setError('Aggiornamento non riuscito.') }
  }

  const handleDelete = async (reminder: Reminder) => {
    if (!window.confirm(`Eliminare la scadenza “${reminder.title}”?`)) return
    const { error: deleteError } = await supabase.from('reminders').update({deleted_at:new Date().toISOString()}).eq('id', reminder.id)
    if (deleteError) setError('Non è stato possibile eliminare la scadenza.')
    else setReminders((current) => current.filter((item) => item.id !== reminder.id))
  }

  const today = todayIso()
  return <div>
    <div className="management-page-heading"><div><span>Promemoria</span><h1>Scadenziario</h1><p>Richiami, pagamenti, certificazioni e altre attività da non dimenticare.</p></div><button className="management-primary-button" type="button" onClick={() => { setForm(emptyForm); setFormOpen(true) }}><ManagementIcon name="plus" /> Nuova scadenza</button></div>
    {error && <div className="management-alert management-alert--error">{error}</div>}
    {filter !== 'completed' && automaticDeadlines.length > 0 && <section className="management-card management-automatic-deadlines"><div className="management-card__header"><div><h2>Scadenze automatiche</h2><p>Calcolate da validità dei documenti e certificazioni.</p></div></div><div className="management-deadline-list">{automaticDeadlines.map((deadline) => <Link className={`management-deadline${deadline.due_date < today ? ' is-overdue' : ''}`} to={deadline.href} key={deadline.id}><ManagementIcon name="calendar" /><div className="management-deadline__date"><strong>{formatDate(deadline.due_date)}</strong><span>{deadline.due_date < today ? 'Scaduta' : deadline.label}</span></div><div className="management-deadline__body"><strong>{deadline.title}</strong></div><ManagementIcon name="arrow" /></Link>)}</div></section>}
    <section className="management-card">
      <div className="management-tabs management-tabs--card"><button className={filter === 'open' ? 'is-active' : undefined} onClick={() => setFilter('open')}>Da fare</button><button className={filter === 'completed' ? 'is-active' : undefined} onClick={() => setFilter('completed')}>Completate</button><button className={filter === 'all' ? 'is-active' : undefined} onClick={() => setFilter('all')}>Tutte</button></div>
      {loading ? <div className="management-empty">Caricamento…</div> : visibleReminders.length === 0 ? <div className="management-empty"><p>Nessuna scadenza in questa sezione.</p><button onClick={() => setFormOpen(true)}>Aggiungi un promemoria</button></div> : <div className="management-deadline-list">{visibleReminders.map((reminder) => {
        const isOverdue = !reminder.completed && reminder.due_date < today
        return <article className={`management-deadline${reminder.completed ? ' is-completed' : ''}${isOverdue ? ' is-overdue' : ''}`} key={reminder.id}>
          <input type="checkbox" checked={reminder.completed} aria-label={`Completa ${reminder.title}`} onChange={(event) => void toggleCompleted(reminder, event.target.checked)} />
          <div className="management-deadline__date"><strong>{formatDate(reminder.due_date)}</strong><span>{isOverdue ? 'Scaduta' : reminder.completed ? 'Completata' : reminderTypeLabels[reminder.type]}</span></div>
          <div className="management-deadline__body"><strong>{reminder.title}</strong>{reminder.notes && <p>{reminder.notes}</p>}<div>{reminder.client_id && <Link to={`/gestionale/clienti/${reminder.client_id}`}>{reminder.clients ? clientDisplayName(reminder.clients) : 'Cliente'}</Link>}{reminder.document_id && <Link to={`/gestionale/documenti/${reminder.document_id}`}>{reminder.documents ? `${documentTypeLabels[reminder.documents.type]} ${reminder.documents.number}` : 'Documento'}</Link>}</div></div>
          <button className="management-icon-button is-danger" type="button" aria-label="Elimina scadenza" onClick={() => void handleDelete(reminder)}><ManagementIcon name="trash" /></button>
        </article>
      })}</div>}
    </section>

    {formOpen && <div className="management-modal" role="dialog" aria-modal="true" aria-labelledby="deadline-title"><button className="management-modal__backdrop" type="button" aria-label="Chiudi" onClick={() => setFormOpen(false)} /><div className="management-modal__panel"><div className="management-modal__header"><div><span>Scadenziario</span><h2 id="deadline-title">Nuova scadenza</h2></div><button onClick={() => setFormOpen(false)}><ManagementIcon name="x" /></button></div><form className="management-form management-form--grid" onSubmit={(event) => void handleSubmit(event)}>
      <label><span>Tipo *</span><select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as ReminderType }))}>{Object.entries(reminderTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label><span>Data *</span><input required type="date" value={form.due_date} onChange={(event) => setForm((current) => ({ ...current, due_date: event.target.value }))} /></label>
      <label className="is-wide"><span>Titolo *</span><input required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} /></label>
      <label><span>Cliente</span><select value={form.client_id} onChange={(event) => setForm((current) => ({ ...current, client_id: event.target.value, document_id: '' }))}><option value="">Nessun cliente</option>{clients.map((client) => <option key={client.id} value={client.id}>{clientDisplayName(client)}</option>)}</select></label>
      <label><span>Documento</span><select value={form.document_id} onChange={(event) => setForm((current) => ({ ...current, document_id: event.target.value }))}><option value="">Nessun documento</option>{availableDocuments.map((document) => <option key={document.id} value={document.id}>{documentTypeLabels[document.type]} {document.number}</option>)}</select></label>
      <label className="is-wide"><span>Note</span><textarea rows={4} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} /></label>
      <div className="management-form__actions is-wide"><button className="management-secondary-button" type="button" onClick={() => setFormOpen(false)}>Annulla</button><button className="management-primary-button" disabled={saving}>{saving ? 'Salvataggio…' : 'Salva scadenza'}</button></div>
    </form></div></div>}
  </div>
}
