import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { BrandLogo } from '../components/ui/BrandLogo'
import { company, formattedAddress } from '../data/company'
import { ManagementIcon } from './ManagementIcon'
import { supabase } from './supabase'
import type { Client, Warranty } from './types'
import { clientDisplayName, formatDate, todayIso } from './utils'

type WarrantyInput = Omit<Warranty, 'id' | 'created_at' | 'updated_at' | 'clients'>

const emptyWarranty = (): WarrantyInput => ({
  client_id: '', number: '', issue_date: todayIso(), expiry_date: null, material_name: '',
  lot_number: '', site_address: '', coverage_text: 'Fastisol garantisce il materiale isolante applicato secondo le condizioni e le indicazioni del produttore.', notes: '',
})

export function ManagementWarrantiesPage() {
  const [warranties, setWarranties] = useState<Warranty[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [form, setForm] = useState<WarrantyInput>(emptyWarranty)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [preview, setPreview] = useState<Warranty | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    const [warrantyResult, clientResult] = await Promise.all([
      supabase.from('warranties').select('*, clients(company_name, contact_name, address, postal_code, city, province)').is('deleted_at',null).order('issue_date', { ascending: false }),
      supabase.from('clients').select('*').is('deleted_at',null).order('company_name').order('contact_name'),
    ])
    if (warrantyResult.error) setError('Non è stato possibile caricare le garanzie. Esegui la migrazione di aggiornamento Supabase.')
    else setWarranties((warrantyResult.data ?? []) as Warranty[])
    if (!clientResult.error) setClients((clientResult.data ?? []) as Client[])
    setLoading(false)
  }

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer) }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('it')
    return warranties.filter((warranty) => !term || [warranty.number, warranty.material_name, warranty.lot_number, warranty.site_address, warranty.clients ? clientDisplayName(warranty.clients) : ''].some((value) => value.toLocaleLowerCase('it').includes(term)))
  }, [search, warranties])

  const openNew = () => {
    const year = new Date().getFullYear()
    const sameYear = warranties.filter((item) => item.issue_date.startsWith(String(year))).length
    setEditingId(null)
    setForm({ ...emptyWarranty(), number: `GAR-${year}-${String(sameYear + 1).padStart(3, '0')}` })
    setError('')
    setFormOpen(true)
  }

  const openEdit = (warranty: Warranty) => {
    const { id: _id, created_at: _created, updated_at: _updated, clients: _clients, ...input } = warranty
    void _id; void _created; void _updated; void _clients
    setEditingId(warranty.id); setForm(input); setError(''); setFormOpen(true)
  }

  const setField = <K extends keyof WarrantyInput>(field: K, value: WarrantyInput[K]) => setForm((current) => ({ ...current, [field]: value }))

  const save = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError('')
    const query = editingId ? supabase.from('warranties').update(form).eq('id', editingId) : supabase.from('warranties').insert(form)
    const { error: saveError } = await query
    if (saveError) setError(saveError.message.includes('unique') ? 'Il numero di garanzia è già utilizzato.' : 'Non è stato possibile salvare la garanzia.')
    else { setFormOpen(false); await load() }
    setSaving(false)
  }

  const remove = async (warranty: Warranty) => {
    if (!window.confirm(`Eliminare la garanzia ${warranty.number}?`)) return
    const { error: deleteError } = await supabase.from('warranties').update({deleted_at:new Date().toISOString()}).eq('id', warranty.id)
    if (deleteError) setError('Non è stato possibile eliminare la garanzia.')
    else setWarranties((current) => current.filter((item) => item.id !== warranty.id))
  }

  const printWarranty = (warranty: Warranty) => {
    setPreview(warranty)
    window.setTimeout(() => window.print(), 80)
  }

  return <div>
    <div className="management-page-heading"><div><span>Certificati clienti</span><h1>Garanzie</h1><p>Crea, archivia e stampa i certificati di garanzia del materiale applicato.</p></div><button className="management-primary-button" type="button" onClick={openNew}><ManagementIcon name="plus" /> Nuova garanzia</button></div>
    {error && <div className="management-alert management-alert--error">{error}</div>}
    <section className="management-card">
      <div className="management-toolbar"><label className="management-search"><ManagementIcon name="search" /><span className="sr-only">Cerca garanzia</span><input type="search" placeholder="Cerca numero, cliente, materiale o lotto…" value={search} onChange={(event) => setSearch(event.target.value)} /></label><span>{filtered.length} garanzie</span></div>
      {loading ? <div className="management-empty">Caricamento…</div> : filtered.length === 0 ? <div className="management-empty"><p>Nessuna garanzia presente.</p><button type="button" onClick={openNew}>Crea la prima garanzia</button></div> : <div className="management-table-wrap"><table className="management-table"><thead><tr><th>Numero</th><th>Cliente</th><th>Materiale / lotto</th><th>Cantiere</th><th>Emissione</th><th>Scadenza</th><th aria-label="Azioni" /></tr></thead><tbody>{filtered.map((warranty) => <tr key={warranty.id}>
        <td><strong>{warranty.number}</strong></td><td>{warranty.clients ? clientDisplayName(warranty.clients) : '—'}</td><td>{warranty.material_name}<small>{warranty.lot_number ? `Lotto ${warranty.lot_number}` : 'Lotto non indicato'}</small></td><td>{warranty.site_address || '—'}</td><td>{formatDate(warranty.issue_date)}</td><td>{formatDate(warranty.expiry_date)}</td><td><div className="management-row-actions"><button type="button" title="Stampa garanzia" onClick={() => printWarranty(warranty)}><ManagementIcon name="print" /></button><button type="button" title="Modifica" onClick={() => openEdit(warranty)}><ManagementIcon name="edit" /></button><button className="is-danger" type="button" title="Elimina" onClick={() => void remove(warranty)}><ManagementIcon name="trash" /></button></div></td>
      </tr>)}</tbody></table></div>}
    </section>

    {formOpen && <div className="management-modal" role="dialog" aria-modal="true" aria-labelledby="warranty-form-title"><button className="management-modal__backdrop" type="button" aria-label="Chiudi" onClick={() => setFormOpen(false)} /><div className="management-modal__panel"><div className="management-modal__header"><div><span>Certificato</span><h2 id="warranty-form-title">{editingId ? 'Modifica garanzia' : 'Nuova garanzia'}</h2></div><button type="button" aria-label="Chiudi" onClick={() => setFormOpen(false)}><ManagementIcon name="x" /></button></div><form className="management-form management-form--grid" onSubmit={(event) => void save(event)}>
      <label><span>Numero *</span><input required value={form.number} onChange={(event) => setField('number', event.target.value)} /></label><label><span>Cliente *</span><select required value={form.client_id} onChange={(event) => setField('client_id', event.target.value)}><option value="">Seleziona cliente</option>{clients.map((client) => <option key={client.id} value={client.id}>{clientDisplayName(client)}</option>)}</select></label>
      <label><span>Data emissione *</span><input required type="date" value={form.issue_date} onChange={(event) => setField('issue_date', event.target.value)} /></label><label><span>Scadenza garanzia</span><input type="date" value={form.expiry_date ?? ''} onChange={(event) => setField('expiry_date', event.target.value || null)} /></label>
      <label><span>Materiale *</span><input required value={form.material_name} onChange={(event) => setField('material_name', event.target.value)} /></label><label><span>Numero lotto</span><input value={form.lot_number} onChange={(event) => setField('lot_number', event.target.value)} /></label>
      <label className="is-wide"><span>Indirizzo cantiere *</span><input required value={form.site_address} onChange={(event) => setField('site_address', event.target.value)} /></label><label className="is-wide"><span>Testo della garanzia *</span><textarea required rows={5} value={form.coverage_text} onChange={(event) => setField('coverage_text', event.target.value)} /></label><label className="is-wide"><span>Note</span><textarea rows={3} value={form.notes} onChange={(event) => setField('notes', event.target.value)} /></label>
      <div className="management-form__actions is-wide"><button className="management-secondary-button" type="button" onClick={() => setFormOpen(false)}>Annulla</button><button className="management-primary-button" disabled={saving}>{saving ? 'Salvataggio…' : 'Salva garanzia'}</button></div>
    </form></div></div>}
    {preview && <WarrantySheet warranty={preview} />}
  </div>
}

function WarrantySheet({ warranty }: { warranty: Warranty }) {
  return <article className="warranty-sheet" aria-hidden="true">
    <header><BrandLogo variant="onLight" /><div><span>Certificato di garanzia</span><strong>{warranty.number}</strong></div></header>
    <div className="warranty-sheet__rule" />
    <main><h1>Certificato di garanzia</h1><p className="warranty-sheet__intro">Si certifica la garanzia relativa al materiale isolante applicato da Fastisol.</p><dl><div><dt>Cliente</dt><dd>{warranty.clients ? clientDisplayName(warranty.clients) : '—'}</dd></div><div><dt>Cantiere</dt><dd>{warranty.site_address}</dd></div><div><dt>Materiale</dt><dd>{warranty.material_name}</dd></div><div><dt>Lotto</dt><dd>{warranty.lot_number || '—'}</dd></div><div><dt>Data emissione</dt><dd>{formatDate(warranty.issue_date)}</dd></div><div><dt>Validità fino al</dt><dd>{formatDate(warranty.expiry_date)}</dd></div></dl><section><h2>Condizioni di garanzia</h2><p>{warranty.coverage_text}</p>{warranty.notes && <p className="warranty-sheet__notes">{warranty.notes}</p>}</section><div className="warranty-sheet__signature"><span />Firma e timbro Fastisol</div></main>
    <footer><strong>{company.legalName}</strong><span>{formattedAddress} – P. IVA: IT{company.vatNumber}</span><span>{company.email} – {company.phoneDisplay}</span></footer>
  </article>
}
