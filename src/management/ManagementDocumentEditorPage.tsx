import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { company, formattedAddress } from '../data/company'
import { BrandLogo } from '../components/ui/BrandLogo'
import { ManagementIcon } from './ManagementIcon'
import { supabase } from './supabase'
import { documentStatusLabels, documentTypeLabels, type BusinessDocument, type Client, type DocumentDraft, type DocumentItem, type DocumentStatus, type DocumentType, type Job } from './types'
import { clientDisplayName, formatCurrency, formatDate, todayIso } from './utils'

const newItem = (position: number): DocumentItem => ({ description: '', quantity: 1, unit: 'mq', unit_price: 0, position })

const emptyDraft: DocumentDraft = {
  client_id: '', job_id: null, type: 'quote', number: '', issue_date: todayIso(), expiry_date: null,
  status: 'draft', subject: '', notes: '', payment_terms: 'Bonifico bancario', subtotal: 0,
  discount_percent: 0, tax_rate: 22, tax_amount: 0, total: 0,
}

export function ManagementDocumentEditorPage() {
  const { documentId } = useParams()
  const isNew = !documentId
  const navigate = useNavigate()
  const [draft, setDraft] = useState<DocumentDraft>(emptyDraft)
  const [items, setItems] = useState<DocumentItem[]>([newItem(0)])
  const [clients, setClients] = useState<Client[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const [clientsResult, jobsResult] = await Promise.all([
        supabase.from('clients').select('*').order('company_name').order('contact_name'),
        supabase.from('jobs').select('*').order('work_date', { ascending: false }),
      ])
      if (clientsResult.error || jobsResult.error) { setError('Non è stato possibile caricare i dati necessari.'); setLoading(false); return }
      setClients((clientsResult.data ?? []) as Client[])
      setJobs((jobsResult.data ?? []) as Job[])

      if (documentId) {
        const { data, error: documentError } = await supabase.from('documents').select('*, document_items(*)').eq('id', documentId).single()
        if (documentError || !data) setError('Documento non trovato o non accessibile.')
        else {
          const document = data as BusinessDocument
          setDraft({ client_id: document.client_id, job_id: document.job_id, type: document.type, number: document.number, issue_date: document.issue_date, expiry_date: document.expiry_date, status: document.status, subject: document.subject, notes: document.notes, payment_terms: document.payment_terms, subtotal: Number(document.subtotal), discount_percent: Number(document.discount_percent), tax_rate: Number(document.tax_rate), tax_amount: Number(document.tax_amount), total: Number(document.total) })
          const loadedItems = (document.document_items ?? []).sort((a, b) => a.position - b.position).map((item) => ({ ...item, quantity: Number(item.quantity), unit_price: Number(item.unit_price) }))
          setItems(loadedItems.length ? loadedItems : [newItem(0)])
        }
      } else {
        const { data: number } = await supabase.rpc('next_document_number', { p_type: 'quote' })
        setDraft((current) => ({ ...current, number: typeof number === 'string' ? number : '' }))
      }
      setLoading(false)
    }
    void load()
  }, [documentId])

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0), 0)
    const discounted = subtotal * (1 - Math.min(100, Math.max(0, draft.discount_percent)) / 100)
    const taxAmount = discounted * (Math.max(0, draft.tax_rate) / 100)
    return { subtotal, discounted, taxAmount, total: discounted + taxAmount }
  }, [draft.discount_percent, draft.tax_rate, items])

  const selectedClient = clients.find((client) => client.id === draft.client_id)
  const availableJobs = jobs.filter((job) => job.client_id === draft.client_id)

  const changeType = async (type: DocumentType) => {
    setDraft((current) => ({ ...current, type, status: 'draft' }))
    if (isNew) {
      const { data: number } = await supabase.rpc('next_document_number', { p_type: type })
      if (typeof number === 'string') setDraft((current) => ({ ...current, number }))
    }
  }

  const updateItem = (index: number, field: keyof DocumentItem, value: string | number) => setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item))
  const removeItem = (index: number) => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index).map((item, position) => ({ ...item, position })))

  const handleSave = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError(''); setMessage('')
    const calculatedDraft = { ...draft, subtotal: totals.subtotal, tax_amount: totals.taxAmount, total: totals.total }
    const cleanItems = items.filter((item) => item.description.trim()).map((item, position) => ({ description: item.description.trim(), quantity: Number(item.quantity), unit: item.unit.trim(), unit_price: Number(item.unit_price), position }))
    const { data, error: saveError } = await supabase.rpc('save_document', {
      p_document_id: documentId ?? null, p_client_id: calculatedDraft.client_id, p_job_id: calculatedDraft.job_id,
      p_type: calculatedDraft.type, p_number: calculatedDraft.number, p_issue_date: calculatedDraft.issue_date,
      p_expiry_date: calculatedDraft.expiry_date, p_status: calculatedDraft.status, p_subject: calculatedDraft.subject,
      p_notes: calculatedDraft.notes, p_payment_terms: calculatedDraft.payment_terms, p_subtotal: calculatedDraft.subtotal,
      p_discount_percent: calculatedDraft.discount_percent, p_tax_rate: calculatedDraft.tax_rate,
      p_tax_amount: calculatedDraft.tax_amount, p_total: calculatedDraft.total, p_items: cleanItems,
    })
    if (saveError) setError(saveError.message.includes('documents_owner_type_number_key') ? 'Questo numero documento è già in uso.' : 'Non è stato possibile salvare il documento. Controlla i dati e riprova.')
    else if (typeof data === 'string') {
      setDraft(calculatedDraft); setMessage('Documento salvato correttamente.')
      if (isNew) navigate(`/gestionale/documenti/${data}`, { replace: true })
    }
    setSaving(false)
  }

  if (loading) return <div className="management-empty">Caricamento documento…</div>

  return <form className="document-editor" onSubmit={(event) => void handleSave(event)}>
    <div className="management-page-heading document-editor__heading"><div><Link className="management-back-link" to="/gestionale/documenti">← Documenti</Link><h1>{isNew ? 'Nuovo documento' : `${documentTypeLabels[draft.type]} ${draft.number}`}</h1><p>Compila i dati e controlla l’anteprima prima di stampare.</p></div><div className="document-editor__top-actions">{!isNew && <button className="management-secondary-button" type="button" onClick={() => window.print()}><ManagementIcon name="print" /> Stampa / PDF</button>}<button className="management-primary-button" disabled={saving || !draft.client_id || !draft.number.trim() || !items.some((item) => item.description.trim())}>{saving ? 'Salvataggio…' : 'Salva documento'}</button></div></div>
    {error && <div className="management-alert management-alert--error">{error}</div>}{message && <div className="management-alert management-alert--success">{message}</div>}
    <div className="document-editor__layout">
      <div className="document-editor__form">
        <section className="management-card document-form-section"><h2>Dati documento</h2><div className="management-form management-form--grid">
          <label><span>Tipo</span><select value={draft.type} onChange={(e) => void changeType(e.target.value as DocumentType)}><option value="quote">Preventivo</option><option value="proforma">Fattura proforma</option></select></label>
          <label><span>Numero *</span><input required value={draft.number} onChange={(e) => setDraft((current) => ({ ...current, number: e.target.value }))} /></label>
          <label><span>Data emissione *</span><input required type="date" value={draft.issue_date} onChange={(e) => setDraft((current) => ({ ...current, issue_date: e.target.value }))} /></label>
          <label><span>{draft.type === 'quote' ? 'Valido fino al' : 'Scadenza'}</span><input type="date" value={draft.expiry_date ?? ''} onChange={(e) => setDraft((current) => ({ ...current, expiry_date: e.target.value || null }))} /></label>
          <label className="is-wide"><span>Stato</span><select value={draft.status} onChange={(e) => setDraft((current) => ({ ...current, status: e.target.value as DocumentStatus }))}>{Object.entries(documentStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        </div></section>
        <section className="management-card document-form-section"><h2>Cliente e lavoro</h2><div className="management-form management-form--grid">
          <label className="is-wide"><span>Cliente *</span><select required value={draft.client_id} onChange={(e) => setDraft((current) => ({ ...current, client_id: e.target.value, job_id: null }))}><option value="">Seleziona un cliente</option>{clients.map((client) => <option key={client.id} value={client.id}>{clientDisplayName(client)}</option>)}</select></label>
          <label className="is-wide"><span>Lavoro collegato</span><select value={draft.job_id ?? ''} disabled={!draft.client_id} onChange={(e) => setDraft((current) => ({ ...current, job_id: e.target.value || null }))}><option value="">Nessun lavoro collegato</option>{availableJobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}</select></label>
          <label className="is-wide"><span>Oggetto</span><input value={draft.subject} onChange={(e) => setDraft((current) => ({ ...current, subject: e.target.value }))} placeholder="Es. Isolamento termico sottotetto" /></label>
        </div></section>
        <section className="management-card document-form-section"><div className="document-form-section__heading"><h2>Voci</h2><button type="button" onClick={() => setItems((current) => [...current, newItem(current.length)])}><ManagementIcon name="plus" /> Aggiungi voce</button></div><div className="document-items-editor">
          {items.map((item, index) => <div className="document-item-row" key={index}><label className="item-description"><span>Descrizione</span><textarea rows={2} required={index === 0} value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} /></label><label><span>Quantità</span><input type="number" min="0" step="0.01" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))} /></label><label><span>Unità</span><input value={item.unit} onChange={(e) => updateItem(index, 'unit', e.target.value)} /></label><label><span>Prezzo unitario</span><input type="number" min="0" step="0.01" value={item.unit_price} onChange={(e) => updateItem(index, 'unit_price', Number(e.target.value))} /></label><strong>{formatCurrency(item.quantity * item.unit_price)}</strong><button type="button" aria-label="Rimuovi voce" disabled={items.length === 1} onClick={() => removeItem(index)}><ManagementIcon name="trash" /></button></div>)}
        </div></section>
        <section className="management-card document-form-section"><h2>Totali e condizioni</h2><div className="management-form management-form--grid"><label><span>Sconto %</span><input type="number" min="0" max="100" step="0.01" value={draft.discount_percent} onChange={(e) => setDraft((current) => ({ ...current, discount_percent: Number(e.target.value) }))} /></label><label><span>IVA %</span><input type="number" min="0" step="0.01" value={draft.tax_rate} onChange={(e) => setDraft((current) => ({ ...current, tax_rate: Number(e.target.value) }))} /></label><label className="is-wide"><span>Condizioni di pagamento</span><input value={draft.payment_terms} onChange={(e) => setDraft((current) => ({ ...current, payment_terms: e.target.value }))} /></label><label className="is-wide"><span>Note da mostrare nel documento</span><textarea rows={4} value={draft.notes} onChange={(e) => setDraft((current) => ({ ...current, notes: e.target.value }))} /></label></div></section>
      </div>

      <aside className="document-preview-wrap"><p>Anteprima documento</p><DocumentPreview draft={draft} items={items} client={selectedClient} totals={totals} /></aside>
    </div>
  </form>
}

function DocumentPreview({ draft, items, client, totals }: { draft: DocumentDraft; items: DocumentItem[]; client?: Client; totals: { subtotal: number; discounted: number; taxAmount: number; total: number } }) {
  return <article className="document-sheet">
    <div className="document-sheet__body">
      <header className="document-sheet__header">
        <div>
          <strong>{draft.type === 'quote' ? 'PREVENTIVO' : 'FATTURA PROFORMA'} <span>#{draft.number || '—'}</span></strong>
          {draft.type === 'proforma' && <small>Documento non valido ai fini fiscali</small>}
        </div>
        <BrandLogo variant="onLight" />
      </header>

      <div className="document-sheet__rule" />

      <section className="document-sheet__details">
        <dl>
          <div><dt>Data:</dt><dd>{formatDate(draft.issue_date)}</dd></div>
          <div><dt>{draft.type === 'quote' ? 'Valido fino:' : 'Scadenza:'}</dt><dd>{formatDate(draft.expiry_date)}</dd></div>
          <div><dt>ID cliente:</dt><dd>{client ? client.id.slice(0, 8).toUpperCase() : '—'}</dd></div>
        </dl>
        <div className="document-sheet__client">
          <h3>Cliente:</h3>
          <strong>{client ? clientDisplayName(client) : 'Seleziona un cliente'}</strong>
          {client && <p>
            {client.address}{client.address && <br />}
            {[client.postal_code, client.city, client.province && `(${client.province})`].filter(Boolean).join(' ')}
            {(client.vat_number || client.tax_code) && <><br />{client.vat_number ? `P. IVA ${client.vat_number}` : `CF ${client.tax_code}`}</>}
            {client.email && <><br />{client.email}</>}
          </p>}
        </div>
      </section>

      <div className="document-sheet__rule" />

      <section className="document-sheet__comments">
        <h3>Commenti / istruzioni speciali:</h3>
        {draft.subject && <p><strong>Oggetto:</strong> {draft.subject}</p>}
        {draft.notes && <p>{draft.notes}</p>}
      </section>

      <table className="document-sheet__items">
        <thead><tr><th>Descrizione</th><th>Quantità</th><th>Prezzo</th><th>Totale</th></tr></thead>
        <tbody>
          {items.filter((item) => item.description.trim()).map((item, index) => <tr key={index}>
            <td>{item.description}</td>
            <td>{item.quantity.toLocaleString('it-IT')} {item.unit}</td>
            <td>{formatCurrency(item.unit_price)}</td>
            <td>{formatCurrency(item.quantity * item.unit_price)}</td>
          </tr>)}
          {!items.some((item) => item.description.trim()) && <tr><td colSpan={4}>Inserisci almeno una voce</td></tr>}
        </tbody>
      </table>

      <div className="document-sheet__summary">
        <dl>
          <div><dt>Subtotale:</dt><dd>{formatCurrency(totals.subtotal)}</dd></div>
          {draft.discount_percent > 0 && <div><dt>Sconto {draft.discount_percent}%:</dt><dd>− {formatCurrency(totals.subtotal - totals.discounted)}</dd></div>}
          <div><dt>IVA {draft.tax_rate}%:</dt><dd>{formatCurrency(totals.taxAmount)}</dd></div>
          <div className="document-sheet__total"><dt>Totale:</dt><dd>{formatCurrency(totals.total)}</dd></div>
        </dl>
      </div>

      {draft.payment_terms && <p className="document-sheet__payment"><strong>Condizioni di pagamento:</strong> {draft.payment_terms}</p>}

      <section className="document-sheet__signatures">
        <div><span />Luogo e data</div>
        <div><span />Firma per accettazione</div>
      </section>
    </div>

    <footer className="document-sheet__footer">
      <strong>{company.legalName}</strong>
      <span>{formattedAddress} – P. IVA: IT{company.vatNumber}</span>
      <span>{company.email} – {company.phoneDisplay}</span>
    </footer>
  </article>
}
