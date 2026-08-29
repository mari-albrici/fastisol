import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ManagementIcon } from './ManagementIcon'
import { supabase } from './supabase'
import { jobStatusLabels, type Client, type Job, type JobInput, type JobStatus } from './types'
import { clientDisplayName, formatCurrency, formatDate } from './utils'

const emptyJob: JobInput = { client_id: '', title: '', description: '', location: '', work_date: null, status: 'planned', amount: null, notes: '' }

export function ManagementJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | JobStatus>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<JobInput>(emptyJob)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    const [jobsResult, clientsResult] = await Promise.all([
      supabase.from('jobs').select('*, clients(company_name, contact_name)').order('work_date', { ascending: false, nullsFirst: true }).order('created_at', { ascending: false }),
      supabase.from('clients').select('*').order('company_name').order('contact_name'),
    ])
    if (jobsResult.error || clientsResult.error) setError('Non è stato possibile caricare i lavori.')
    else { setJobs((jobsResult.data ?? []) as Job[]); setClients((clientsResult.data ?? []) as Client[]) }
    setLoading(false)
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(timer)
  }, [])

  const filteredJobs = useMemo(() => jobs.filter((job) => {
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter
    const term = search.trim().toLocaleLowerCase('it')
    const matchesSearch = !term || [job.title, job.location, job.clients?.company_name ?? '', job.clients?.contact_name ?? ''].some((value) => value.toLocaleLowerCase('it').includes(term))
    return matchesStatus && matchesSearch
  }), [jobs, search, statusFilter])

  const openNew = () => { setEditingId(null); setForm(emptyJob); setError(''); setFormOpen(true) }
  const openEdit = (job: Job) => { setEditingId(job.id); setForm({ client_id: job.client_id, title: job.title, description: job.description, location: job.location, work_date: job.work_date, status: job.status, amount: job.amount, notes: job.notes }); setError(''); setFormOpen(true) }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError('')
    const query = editingId ? supabase.from('jobs').update(form).eq('id', editingId) : supabase.from('jobs').insert(form)
    const { error: saveError } = await query
    if (saveError) setError('Non è stato possibile salvare il lavoro.')
    else { setFormOpen(false); await load() }
    setSaving(false)
  }

  const handleDelete = async (job: Job) => {
    if (!window.confirm(`Eliminare il lavoro “${job.title}”?`)) return
    const { error: deleteError } = await supabase.from('jobs').delete().eq('id', job.id)
    if (deleteError) setError('Il lavoro è collegato a un documento e non può essere eliminato.')
    else setJobs((current) => current.filter((item) => item.id !== job.id))
  }

  return <div>
    <div className="management-page-heading"><div><span>Archivio</span><h1>Lavori</h1><p>Interventi pianificati e storico dei lavori eseguiti.</p></div><button className="management-primary-button" type="button" onClick={openNew}><ManagementIcon name="plus" /> Nuovo lavoro</button></div>
    {error && <div className="management-alert management-alert--error">{error}</div>}
    <section className="management-card">
      <div className="management-toolbar"><label className="management-search"><ManagementIcon name="search" /><span className="sr-only">Cerca lavoro</span><input type="search" placeholder="Cerca lavoro, cliente o località…" value={search} onChange={(e) => setSearch(e.target.value)} /></label><select aria-label="Filtra per stato" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | JobStatus)}><option value="all">Tutti gli stati</option>{Object.entries(jobStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      {loading ? <div className="management-empty">Caricamento…</div> : filteredJobs.length === 0 ? <div className="management-empty"><p>{search || statusFilter !== 'all' ? 'Nessun lavoro corrisponde ai filtri.' : 'Non hai ancora registrato lavori.'}</p>{!search && statusFilter === 'all' && <button onClick={openNew}>Registra il primo lavoro</button>}</div> : <div className="management-table-wrap"><table className="management-table"><thead><tr><th>Lavoro</th><th>Cliente</th><th>Data</th><th>Stato</th><th className="is-number">Importo</th><th aria-label="Azioni" /></tr></thead><tbody>{filteredJobs.map((job) => <tr key={job.id}><td><strong className="management-table__main">{job.title}</strong>{job.location && <small>{job.location}</small>}</td><td>{job.clients ? clientDisplayName(job.clients) : '—'}</td><td>{formatDate(job.work_date)}</td><td><span className={`management-badge status-${job.status}`}>{jobStatusLabels[job.status]}</span></td><td className="is-number">{job.amount === null ? '—' : formatCurrency(job.amount)}</td><td><div className="management-row-actions"><button type="button" aria-label="Modifica lavoro" onClick={() => openEdit(job)}><ManagementIcon name="edit" /></button><button className="is-danger" type="button" aria-label="Elimina lavoro" onClick={() => void handleDelete(job)}><ManagementIcon name="trash" /></button></div></td></tr>)}</tbody></table></div>}
    </section>

    {formOpen && <div className="management-modal" role="dialog" aria-modal="true" aria-labelledby="job-form-title"><button className="management-modal__backdrop" type="button" aria-label="Chiudi" onClick={() => setFormOpen(false)} /><div className="management-modal__panel"><div className="management-modal__header"><div><span>Scheda intervento</span><h2 id="job-form-title">{editingId ? 'Modifica lavoro' : 'Nuovo lavoro'}</h2></div><button type="button" aria-label="Chiudi" onClick={() => setFormOpen(false)}><ManagementIcon name="x" /></button></div><form className="management-form management-form--grid" onSubmit={(e) => void handleSubmit(e)}>
      <label className="is-wide"><span>Cliente *</span><select required value={form.client_id} onChange={(e) => setForm((current) => ({ ...current, client_id: e.target.value }))}><option value="">Seleziona un cliente</option>{clients.map((client) => <option key={client.id} value={client.id}>{clientDisplayName(client)}</option>)}</select></label>
      <label className="is-wide"><span>Titolo del lavoro *</span><input required value={form.title} onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))} placeholder="Es. Isolamento sottotetto" /></label>
      <label><span>Data intervento</span><input type="date" value={form.work_date ?? ''} onChange={(e) => setForm((current) => ({ ...current, work_date: e.target.value || null }))} /></label>
      <label><span>Stato</span><select value={form.status} onChange={(e) => setForm((current) => ({ ...current, status: e.target.value as JobStatus }))}>{Object.entries(jobStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label><span>Località intervento</span><input value={form.location} onChange={(e) => setForm((current) => ({ ...current, location: e.target.value }))} /></label>
      <label><span>Importo</span><input type="number" min="0" step="0.01" value={form.amount ?? ''} onChange={(e) => setForm((current) => ({ ...current, amount: e.target.value === '' ? null : Number(e.target.value) }))} /></label>
      <label className="is-wide"><span>Descrizione</span><textarea rows={4} value={form.description} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} /></label>
      <label className="is-wide"><span>Note interne</span><textarea rows={3} value={form.notes} onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))} /></label>
      {clients.length === 0 && <p className="management-form__hint is-wide">Prima di registrare un lavoro devi inserire almeno un cliente.</p>}
      <div className="management-form__actions is-wide"><button className="management-secondary-button" type="button" onClick={() => setFormOpen(false)}>Annulla</button><button className="management-primary-button" disabled={saving || clients.length === 0}>{saving ? 'Salvataggio…' : 'Salva lavoro'}</button></div>
    </form></div></div>}
  </div>
}
