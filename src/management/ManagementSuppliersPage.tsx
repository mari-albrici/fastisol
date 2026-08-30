import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { supplierBillingMissing } from './billingCompleteness'
import { ManagementIcon } from './ManagementIcon'
import { supabase } from './supabase'
import type { Supplier, SupplierInput } from './types'
import { fiscalRegimes } from './fiscalRegimes'

const emptySupplier: SupplierInput = {
  company_name: '', contact_name: '', tax_code: '', vat_number: '', fiscal_regime: '', email: '', phone: '', pec: '', sdi_code: '',
  address: '', postal_code: '', city: '', province: '', country: 'IT', iban: '', notes: '',
}

export function ManagementSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<SupplierInput>(emptySupplier)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    const { data, error: loadError } = await supabase.from('suppliers').select('*').is('deleted_at',null).order('company_name').order('contact_name')
    if (loadError) setError('Non è stato possibile caricare i fornitori. Esegui la migrazione Supabase dedicata ai fornitori.')
    else setSuppliers((data ?? []) as Supplier[])
    setLoading(false)
  }

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer) }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('it')
    return suppliers.filter((supplier) => !term || [supplier.company_name, supplier.contact_name, supplier.vat_number, supplier.tax_code, supplier.city, supplier.email].some((value) => value.toLocaleLowerCase('it').includes(term)))
  }, [search, suppliers])

  const openNew = () => { setEditingId(null); setForm(emptySupplier); setError(''); setFormOpen(true) }
  const openEdit = (supplier: Supplier) => {
    const { id: _id, created_at: _createdAt, updated_at: _updatedAt, ...input } = supplier
    void _id; void _createdAt; void _updatedAt
    setEditingId(supplier.id); setForm(input); setError(''); setFormOpen(true)
  }
  const setField = (field: keyof SupplierInput, value: string) => setForm((current) => ({ ...current, [field]: value }))

  const save = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError('')
    const query = editingId ? supabase.from('suppliers').update(form).eq('id', editingId) : supabase.from('suppliers').insert(form)
    const { error: saveError } = await query
    if (saveError) setError(saveError.code === '23505' ? 'Esiste già un fornitore con questa Partita IVA.' : 'Non è stato possibile salvare il fornitore.')
    else { setFormOpen(false); await load() }
    setSaving(false)
  }

  const remove = async (supplier: Supplier) => {
    if (!window.confirm(`Eliminare ${supplierName(supplier)}?`)) return
    const { error: deleteError } = await supabase.from('suppliers').update({deleted_at:new Date().toISOString()}).eq('id', supplier.id)
    if (deleteError) setError('Non è stato possibile eliminare il fornitore.')
    else setSuppliers((current) => current.filter((item) => item.id !== supplier.id))
  }

  const currentMissing = supplierBillingMissing(form)

  return <div>
    <div className="management-page-heading"><div><span>Archivio acquisti</span><h1>Fornitori</h1><p>Anagrafiche, riferimenti fiscali, recapiti elettronici e dati di pagamento.</p></div><button className="management-primary-button" type="button" onClick={openNew}><ManagementIcon name="plus" /> Nuovo fornitore</button></div>
    {error && <div className="management-alert management-alert--error">{error}</div>}
    <section className="management-card"><div className="management-toolbar"><label className="management-search"><ManagementIcon name="search" /><span className="sr-only">Cerca fornitore</span><input type="search" placeholder="Cerca nome, Partita IVA, città…" value={search} onChange={(event) => setSearch(event.target.value)} /></label><span>{filtered.length} {filtered.length === 1 ? 'fornitore' : 'fornitori'}</span></div>
      {loading ? <div className="management-empty">Caricamento…</div> : filtered.length === 0 ? <div className="management-empty"><p>{search ? 'Nessun fornitore corrisponde alla ricerca.' : 'Non hai ancora inserito fornitori.'}</p>{!search && <button type="button" onClick={openNew}>Aggiungi il primo fornitore</button>}</div> : <div className="management-table-wrap"><table className="management-table management-table--suppliers"><thead><tr><th>Fornitore</th><th>Dati fiscali</th><th>Sede</th><th>Contatti</th><th>Fatturazione</th><th aria-label="Azioni" /></tr></thead><tbody>{filtered.map((supplier) => { const missing = supplierBillingMissing(supplier); return <tr key={supplier.id}><td><strong className="management-table__main">{supplierName(supplier)}</strong>{supplier.company_name && supplier.contact_name && <small>{supplier.contact_name}</small>}</td><td>{supplier.vat_number ? `P. IVA ${supplier.vat_number}` : '—'}<small>{supplier.tax_code ? `CF ${supplier.tax_code}` : 'Codice fiscale assente'}</small><small>{supplier.fiscal_regime || 'Regime fiscale assente'}</small></td><td>{[supplier.city, supplier.province].filter(Boolean).join(' · ') || '—'}<small>{supplier.address}</small></td><td>{supplier.phone || '—'}<small>{supplier.email}</small><small>{supplier.pec && `PEC ${supplier.pec}`}</small></td><td><span className={`management-billing-status ${missing.length ? 'is-incomplete' : 'is-complete'}`} title={missing.length ? `Mancano: ${missing.join(', ')}` : 'Dati fiscali completi'}>{missing.length ? 'Incompleta' : 'Completa'}</span></td><td><div className="management-row-actions"><button type="button" onClick={() => openEdit(supplier)}><ManagementIcon name="edit" /></button><button className="is-danger" type="button" onClick={() => void remove(supplier)}><ManagementIcon name="trash" /></button></div></td></tr> })}</tbody></table></div>}
    </section>

    {formOpen && <div className="management-modal" role="dialog" aria-modal="true" aria-labelledby="supplier-form-title"><button className="management-modal__backdrop" type="button" aria-label="Chiudi" onClick={() => setFormOpen(false)} /><div className="management-modal__panel"><div className="management-modal__header"><div><span>Anagrafica fornitore</span><h2 id="supplier-form-title">{editingId ? 'Modifica fornitore' : 'Nuovo fornitore'}</h2></div><button type="button" onClick={() => setFormOpen(false)}><ManagementIcon name="x" /></button></div><form className="management-form management-form--grid" onSubmit={(event) => void save(event)}>
      <h3 className="management-form__section-title is-wide">Identità e dati fiscali</h3><label><span>Ragione sociale / Denominazione</span><input value={form.company_name} onChange={(event) => setField('company_name', event.target.value)} /></label><label><span>Nome e cognome</span><input value={form.contact_name} onChange={(event) => setField('contact_name', event.target.value)} /></label><label><span>Partita IVA / ID fiscale *</span><input value={form.vat_number} onChange={(event) => setField('vat_number', event.target.value)} /></label><label><span>Codice fiscale *</span><input value={form.tax_code} onChange={(event) => setField('tax_code', event.target.value.toUpperCase())} /></label><label className="is-wide"><span>Regime fiscale *</span><select value={form.fiscal_regime} onChange={(event) => setField('fiscal_regime', event.target.value)}><option value="">Seleziona</option>{fiscalRegimes.map(([value, label]) => <option key={value} value={value}>{value} · {label}</option>)}</select></label>
      <h3 className="management-form__section-title is-wide">Sede legale</h3><label className="is-wide"><span>Indirizzo *</span><input value={form.address} onChange={(event) => setField('address', event.target.value)} /></label><label><span>CAP *</span><input maxLength={10} value={form.postal_code} onChange={(event) => setField('postal_code', event.target.value)} /></label><label><span>Comune *</span><input value={form.city} onChange={(event) => setField('city', event.target.value)} /></label><label><span>Provincia *</span><input maxLength={2} value={form.province} onChange={(event) => setField('province', event.target.value.toUpperCase())} /></label><label><span>Nazione *</span><input maxLength={2} value={form.country} onChange={(event) => setField('country', event.target.value.toUpperCase())} /></label>
      <h3 className="management-form__section-title is-wide">Contatti e pagamento</h3><label><span>Telefono</span><input type="tel" value={form.phone} onChange={(event) => setField('phone', event.target.value)} /></label><label><span>Email</span><input type="email" value={form.email} onChange={(event) => setField('email', event.target.value)} /></label><label><span>PEC</span><input type="email" value={form.pec} onChange={(event) => setField('pec', event.target.value)} /></label><label><span>Codice destinatario SDI</span><input maxLength={7} value={form.sdi_code} onChange={(event) => setField('sdi_code', event.target.value.toUpperCase())} /></label><label className="is-wide"><span>IBAN</span><input value={form.iban} onChange={(event) => setField('iban', event.target.value.toUpperCase())} /></label><label className="is-wide"><span>Note</span><textarea rows={3} value={form.notes} onChange={(event) => setField('notes', event.target.value)} /></label>
      <div className={`management-billing-check is-wide ${currentMissing.length ? 'is-incomplete' : 'is-complete'}`}><strong>{currentMissing.length ? 'Anagrafica salvabile, ma incompleta per la fatturazione.' : 'Dati obbligatori per la fatturazione presenti.'}</strong>{currentMissing.length > 0 && <span>Mancano: {currentMissing.join(', ')}.</span>}</div><div className="management-form__actions is-wide"><button className="management-secondary-button" type="button" onClick={() => setFormOpen(false)}>Annulla</button><button className="management-primary-button" disabled={saving || (!form.company_name.trim() && !form.contact_name.trim())}>{saving ? 'Salvataggio…' : 'Salva fornitore'}</button></div>
    </form></div></div>}
  </div>
}

function supplierName(supplier: Pick<Supplier, 'company_name' | 'contact_name'>) { return supplier.company_name.trim() || supplier.contact_name.trim() || 'Fornitore senza nome' }
