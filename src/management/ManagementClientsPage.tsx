import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ManagementIcon } from './ManagementIcon'
import { supabase } from './supabase'
import type { Client, ClientInput } from './types'
import { clientDisplayName, errorMessage } from './utils'
import { customerBillingMissing } from './billingCompleteness'

const emptyClient: ClientInput = {
  company_name: '', contact_name: '', tax_code: '', vat_number: '', email: '', phone: '',
  address: '', postal_code: '', city: '', province: '', country: 'IT', sdi_code: '', pec: '', notes: '',
}

export function ManagementClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ClientInput>(emptyClient)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadClients = async () => {
    const { data, error: loadError } = await supabase.from('clients').select('*').is('deleted_at',null).order('company_name').order('contact_name')
    if (loadError) setError('Non è stato possibile caricare i clienti.')
    else setClients((data ?? []) as Client[])
    setLoading(false)
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadClients(), 0)
    return () => window.clearTimeout(timer)
  }, [])

  const filteredClients = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('it')
    if (!term) return clients
    return clients.filter((client) => [client.company_name, client.contact_name, client.email, client.phone, client.city]
      .some((value) => value.toLocaleLowerCase('it').includes(term)))
  }, [clients, search])

  const openNew = () => {
    setEditingId(null)
    setForm(emptyClient)
    setError('')
    setFormOpen(true)
  }

  const openEdit = (client: Client) => {
    setEditingId(client.id)
    setForm({
      company_name: client.company_name, contact_name: client.contact_name, tax_code: client.tax_code,
      vat_number: client.vat_number, email: client.email, phone: client.phone, address: client.address,
      postal_code: client.postal_code, city: client.city, province: client.province, notes: client.notes,
      country: client.country || 'IT', sdi_code: client.sdi_code || '', pec: client.pec || '',
    })
    setError('')
    setFormOpen(true)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    const query = editingId
      ? supabase.from('clients').update(form).eq('id', editingId)
      : supabase.from('clients').insert(form)
    const { error: saveError } = await query
    if (saveError) {
      setError(errorMessage(saveError, 'Non è stato possibile salvare il cliente.'))
    } else {
      setFormOpen(false)
      await loadClients()
    }
    setSaving(false)
  }

  const handleDelete = async (client: Client) => {
    if (!window.confirm(`Eliminare ${clientDisplayName(client)}? L’operazione non può essere annullata.`)) return
    const { error: deleteError } = await supabase.from('clients').update({deleted_at:new Date().toISOString()}).eq('id', client.id)
    if (deleteError) setError('Il cliente ha documenti collegati e non può essere eliminato.')
    else setClients((current) => current.filter((item) => item.id !== client.id))
  }

  const setField = (field: keyof ClientInput, value: string) => setForm((current) => ({ ...current, [field]: value }))
  const currentBillingMissing = customerBillingMissing(form)

  return (
    <div>
      <div className="management-page-heading">
        <div><span>Archivio</span><h1>Clienti</h1><p>Anagrafiche, contatti e dati di fatturazione.</p></div>
        <button className="management-primary-button" type="button" onClick={openNew}><ManagementIcon name="plus" /> Nuovo cliente</button>
      </div>

      {error && <div className="management-alert management-alert--error">{error}</div>}

      <section className="management-card">
        <div className="management-toolbar">
          <label className="management-search"><ManagementIcon name="search" /><span className="sr-only">Cerca cliente</span><input type="search" placeholder="Cerca per nome, città, telefono…" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
          <span>{filteredClients.length} {filteredClients.length === 1 ? 'cliente' : 'clienti'}</span>
        </div>
        {loading ? <div className="management-empty">Caricamento…</div> : filteredClients.length === 0 ? (
          <div className="management-empty"><p>{search ? 'Nessun cliente corrisponde alla ricerca.' : 'Non hai ancora inserito clienti.'}</p>{!search && <button type="button" onClick={openNew}>Aggiungi il primo cliente</button>}</div>
        ) : (
          <div className="management-table-wrap"><table className="management-table">
            <thead><tr><th>Cliente</th><th>Contatti</th><th>Località</th><th>Dati fiscali</th><th>Fatturazione</th><th aria-label="Azioni" /></tr></thead>
            <tbody>{filteredClients.map((client) => { const missing = customerBillingMissing(client); return <tr key={client.id}>
              <td><Link className="management-table__main" to={`/gestionale/clienti/${client.id}`}>{clientDisplayName(client)}</Link>{client.company_name && client.contact_name && <small>{client.contact_name}</small>}</td>
              <td>{client.phone || '—'}{client.email && <small>{client.email}</small>}</td>
              <td>{[client.city, client.province].filter(Boolean).join(' · ') || '—'}{client.address && <small>{client.address}</small>}</td>
              <td>{client.vat_number ? `P. IVA ${client.vat_number}` : '—'}{client.tax_code && <small>CF {client.tax_code}</small>}</td>
              <td><span className={`management-billing-status ${missing.length ? 'is-incomplete' : 'is-complete'}`} title={missing.length ? `Mancano: ${missing.join(', ')}` : 'Dati fiscali completi'}>{missing.length ? 'Incompleta' : 'Completa'}</span>{!client.sdi_code && !client.pec && <small>Recapito SDI non indicato</small>}</td>
              <td><div className="management-row-actions"><button type="button" aria-label="Modifica cliente" onClick={() => openEdit(client)}><ManagementIcon name="edit" /></button><button className="is-danger" type="button" aria-label="Elimina cliente" onClick={() => void handleDelete(client)}><ManagementIcon name="trash" /></button></div></td>
            </tr> })}</tbody>
          </table></div>
        )}
      </section>

      {formOpen && <div className="management-modal" role="dialog" aria-modal="true" aria-labelledby="client-form-title">
        <button className="management-modal__backdrop" type="button" aria-label="Chiudi" onClick={() => setFormOpen(false)} />
        <div className="management-modal__panel">
          <div className="management-modal__header"><div><span>Anagrafica cliente</span><h2 id="client-form-title">{editingId ? 'Modifica cliente' : 'Nuovo cliente'}</h2></div><button type="button" aria-label="Chiudi" onClick={() => setFormOpen(false)}><ManagementIcon name="x" /></button></div>
          <form className="management-form management-form--grid" onSubmit={(event) => void handleSubmit(event)}>
            <h3 className="management-form__section-title is-wide">Identità e dati fiscali</h3>
            <label><span>Ragione sociale / Azienda</span><input value={form.company_name} onChange={(e) => setField('company_name', e.target.value)} /></label>
            <label><span>Nome e cognome</span><input value={form.contact_name} onChange={(e) => setField('contact_name', e.target.value)} /></label>
            <label><span>Partita IVA / ID fiscale *</span><input value={form.vat_number} onChange={(e) => setField('vat_number', e.target.value)} /></label>
            <label><span>Codice fiscale *</span><input value={form.tax_code} onChange={(e) => setField('tax_code', e.target.value.toUpperCase())} /></label>
            <h3 className="management-form__section-title is-wide">Contatti</h3>
            <label><span>Telefono</span><input type="tel" value={form.phone} onChange={(e) => setField('phone', e.target.value)} /></label>
            <label><span>Email</span><input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} /></label>
            <h3 className="management-form__section-title is-wide">Sede di fatturazione</h3>
            <label className="is-wide"><span>Indirizzo *</span><input value={form.address} onChange={(e) => setField('address', e.target.value)} /></label>
            <label><span>CAP *</span><input inputMode="numeric" maxLength={10} value={form.postal_code} onChange={(e) => setField('postal_code', e.target.value)} /></label>
            <label><span>Comune *</span><input value={form.city} onChange={(e) => setField('city', e.target.value)} /></label>
            <label><span>Provincia *</span><input maxLength={2} value={form.province} onChange={(e) => setField('province', e.target.value.toUpperCase())} /></label>
            <label><span>Nazione *</span><input maxLength={2} value={form.country} onChange={(e) => setField('country', e.target.value.toUpperCase())} /></label>
            <h3 className="management-form__section-title is-wide">Recapito fattura elettronica</h3>
            <label><span>Codice destinatario SDI</span><input maxLength={7} value={form.sdi_code} onChange={(e) => setField('sdi_code', e.target.value.toUpperCase())} placeholder="0000000 se assente" /></label>
            <label><span>PEC</span><input type="email" value={form.pec} onChange={(e) => setField('pec', e.target.value)} /></label>
            <label className="is-wide"><span>Note</span><textarea rows={3} value={form.notes} onChange={(e) => setField('notes', e.target.value)} /></label>
            {!form.company_name.trim() && !form.contact_name.trim() && <p className="management-form__hint is-wide">Inserisci almeno la ragione sociale oppure il nome del cliente.</p>}
            <div className={`management-billing-check is-wide ${currentBillingMissing.length ? 'is-incomplete' : 'is-complete'}`}><strong>{currentBillingMissing.length ? 'Anagrafica salvabile, ma incompleta per la fatturazione.' : 'Dati obbligatori per la fatturazione presenti.'}</strong>{currentBillingMissing.length > 0 && <span>Mancano: {currentBillingMissing.join(', ')}.</span>}{!form.sdi_code.trim() && !form.pec.trim() && <span>Il recapito elettronico è assente: nell’XML verrà usato il codice destinatario 0000000.</span>}</div>
            <div className="management-form__actions is-wide"><button className="management-secondary-button" type="button" onClick={() => setFormOpen(false)}>Annulla</button><button className="management-primary-button" disabled={saving || (!form.company_name.trim() && !form.contact_name.trim())}>{saving ? 'Salvataggio…' : 'Salva cliente'}</button></div>
          </form>
        </div>
      </div>}
    </div>
  )
}
