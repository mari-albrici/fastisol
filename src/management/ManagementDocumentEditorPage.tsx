import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { company, formattedAddress } from '../data/company'
import { BrandLogo } from '../components/ui/BrandLogo'
import { ManagementIcon } from './ManagementIcon'
import { supabase } from './supabase'
import { documentStatusLabels, documentTypeLabels, type BusinessDocument, type CatalogItem, type Client, type DocumentCommunication, type DocumentDraft, type DocumentItem, type DocumentStatus, type DocumentType, type FiscalExportHistory, type Project, type SalesPayment } from './types'
import { clientDisplayName, formatCurrency, formatDate, todayIso } from './utils'
import { downloadXml } from './fatturaPa'
import { FiscalExportModal } from './FiscalExportModal'
import { executeFiscalExport, type FiscalExportRequest } from './fiscalExports'

const newItem = (position: number): DocumentItem => ({ description: '', quantity: 1, unit: 'mq', unit_price: 0, position, tax_rate: 22, nature_code: '', discount_percent: 0 })

const emptyDraft: DocumentDraft = {
  client_id: '', job_id: null, type: 'quote', number: '', issue_date: todayIso(), expiry_date: null,
  status: 'draft', subject: '', notes: '', payment_terms: 'Bonifico bancario', subtotal: 0,
  discount_percent: 0, tax_rate: 22, tax_amount: 0, other_amount: 0, total: 0,
  project_id: null, electronic_document_type: 'TD01', stamp_duty: false, stamp_amount: 2,
  withholding_type: '', withholding_rate: 0, withholding_amount: 0, withholding_reason: '',
  pension_fund_type: '', pension_rate: 0, pension_amount: 0, pension_tax_rate: 22, pension_withheld: false,
  split_payment: false, order_reference: '', order_date: null, contract_reference: '', contract_date: null, ddt_reference: '', ddt_date: null,
}
const natureCodes = ['N1', 'N2.1', 'N2.2', 'N3.1', 'N3.2', 'N3.3', 'N3.4', 'N3.5', 'N3.6', 'N4', 'N5', 'N6.1', 'N6.2', 'N6.3', 'N6.4', 'N6.5', 'N6.6', 'N6.7', 'N6.8', 'N6.9', 'N7']

async function getNextDocumentNumber(type: DocumentType, year: number) {
  const { data: setting } = await supabase.from('document_number_settings').select('*').eq('year', year).eq('type', type).maybeSingle()
  if (setting) return `${setting.prefix}-${year}-${String(setting.next_number).padStart(setting.padding, '0')}`
  const { data } = await supabase.rpc('next_document_number', { p_type: type })
  return typeof data === 'string' ? data : ''
}

async function advanceDocumentNumber(type: DocumentType, year: number) {
  const { data: setting } = await supabase.from('document_number_settings').select('id, next_number').eq('year', year).eq('type', type).maybeSingle()
  if (setting) await supabase.from('document_number_settings').update({ next_number: setting.next_number + 1 }).eq('id', setting.id)
}

export function ManagementDocumentEditorPage() {
  const { documentId } = useParams()
  const [searchParams] = useSearchParams()
  const requestedType: DocumentType = searchParams.get('tipo') === 'proforma' ? 'proforma' : 'quote'
  const requestedClientId = searchParams.get('cliente') ?? ''
  const requestedProjectId = searchParams.get('commessa') ?? ''
  const isNew = !documentId
  const navigate = useNavigate()
  const [draft, setDraft] = useState<DocumentDraft>(() => ({ ...emptyDraft, type: requestedType }))
  const [items, setItems] = useState<DocumentItem[]>([newItem(0)])
  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [catalog,setCatalog]=useState<CatalogItem[]>([])
  const [payments, setPayments] = useState<SalesPayment[]>([])
  const [communications, setCommunications] = useState<DocumentCommunication[]>([])
  const [fiscalHistory, setFiscalHistory] = useState<FiscalExportHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportModal, setExportModal] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const [clientsResult, projectsResult,catalogResult] = await Promise.all([
        supabase.from('clients').select('*').is('deleted_at',null).order('company_name').order('contact_name'),
        supabase.from('projects').select('*').is('deleted_at',null).order('code'),
        supabase.from('catalog_items').select('*').eq('active',true).is('deleted_at',null).order('code'),
      ])
      if (clientsResult.error) { setError('Non è stato possibile caricare i clienti.'); setLoading(false); return }
      setClients((clientsResult.data ?? []) as Client[])
      if (!projectsResult.error) setProjects((projectsResult.data ?? []) as Project[])
      if(!catalogResult.error)setCatalog((catalogResult.data??[]).map(item=>({...item,sale_price:Number(item.sale_price),estimated_cost:Number(item.estimated_cost),tax_rate:Number(item.tax_rate)})) as CatalogItem[])

      if (documentId) {
        const { data, error: documentError } = await supabase.from('documents').select('*, document_items(*)').eq('id', documentId).single()
        if (documentError || !data) setError('Documento non trovato o non accessibile.')
        else {
          const document = data as BusinessDocument
          setDraft({ ...emptyDraft, ...document, client_id: document.client_id, job_id: document.job_id, project_id: document.project_id ?? null, subtotal: Number(document.subtotal), discount_percent: Number(document.discount_percent), tax_rate: Number(document.tax_rate), tax_amount: Number(document.tax_amount), other_amount: Number(document.other_amount ?? 0), total: Number(document.total), stamp_amount: Number(document.stamp_amount ?? 2), withholding_rate: Number(document.withholding_rate ?? 0), withholding_amount: Number(document.withholding_amount ?? 0), pension_rate: Number(document.pension_rate ?? 0), pension_amount: Number(document.pension_amount ?? 0), pension_tax_rate: Number(document.pension_tax_rate ?? 22) })
          const loadedItems = (document.document_items ?? []).sort((a, b) => a.position - b.position).map((item) => ({ ...item, quantity: Number(item.quantity), unit_price: Number(item.unit_price), tax_rate: Number(item.tax_rate ?? document.tax_rate), discount_percent: Number(item.discount_percent ?? 0), nature_code: item.nature_code ?? '' }))
          setItems(loadedItems.length ? loadedItems : [newItem(0)])
          const { data: communicationData } = await supabase.from('document_communications').select('*').eq('document_id', documentId).order('sent_at', { ascending: false })
          setCommunications((communicationData ?? []) as DocumentCommunication[])
          const { data: paymentData } = await supabase.from('sales_payments').select('*').eq('document_id', documentId).order('due_date')
          setPayments((paymentData ?? []).map((payment) => ({ ...payment, amount: Number(payment.amount) })) as SalesPayment[])
          const { data: fiscalData } = await supabase.from('fiscal_exports').select('*').eq('source_document_id', documentId).order('created_at', { ascending: false })
          setFiscalHistory((fiscalData ?? []) as FiscalExportHistory[])
        }
      } else {
        const number = await getNextDocumentNumber(requestedType, new Date().getFullYear())
        setDraft((current) => ({ ...current, client_id: requestedClientId, project_id: requestedProjectId || null, type: requestedType, number }))
      }
      setLoading(false)
    }
    void load()
  }, [documentId, requestedClientId, requestedProjectId, requestedType])

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0), 0)
    const globalFactor = 1 - Math.min(100, Math.max(0, draft.discount_percent)) / 100
    const discounted = items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0) * (1 - Math.min(100, Math.max(0, Number(item.discount_percent) || 0)) / 100) * globalFactor, 0)
    const taxAmount = items.reduce((sum, item) => { const net = Number(item.quantity || 0) * Number(item.unit_price || 0) * (1 - Math.min(100, Math.max(0, Number(item.discount_percent) || 0)) / 100) * globalFactor; return sum + net * Math.max(0, Number(item.tax_rate ?? draft.tax_rate)) / 100 }, 0)
    const otherAmount = Math.max(0, Number(draft.other_amount) || 0)
    const stampAmount = draft.stamp_duty ? Math.max(0, Number(draft.stamp_amount) || 2) : 0
    const pensionAmount = draft.pension_fund_type ? Math.max(0, Number(draft.pension_amount) || discounted * Number(draft.pension_rate || 0) / 100) : 0
    const pensionTax = pensionAmount * Math.max(0, Number(draft.pension_tax_rate) || 0) / 100
    const withholdingAmount = draft.withholding_type ? Math.max(0, Number(draft.withholding_amount) || discounted * Number(draft.withholding_rate || 0) / 100) : 0
    return { subtotal, discounted, taxAmount, otherAmount, stampAmount, pensionAmount, pensionTax, withholdingAmount, total: discounted + taxAmount + otherAmount + stampAmount + pensionAmount + pensionTax - withholdingAmount }
  }, [draft, items])

  const selectedClient = clients.find((client) => client.id === draft.client_id)
  const availableProjects = projects.filter((project) => !draft.client_id || project.client_id === draft.client_id)
  const fiscalPayload = { project_id: draft.project_id || null, electronic_document_type: draft.electronic_document_type || 'TD01', stamp_duty: Boolean(draft.stamp_duty), stamp_amount: totals.stampAmount || Number(draft.stamp_amount) || 2, withholding_type: draft.withholding_type || '', withholding_rate: Number(draft.withholding_rate) || 0, withholding_amount: totals.withholdingAmount, withholding_reason: draft.withholding_reason || '', pension_fund_type: draft.pension_fund_type || '', pension_rate: Number(draft.pension_rate) || 0, pension_amount: totals.pensionAmount, pension_tax_rate: Number(draft.pension_tax_rate) || 0, pension_withheld: Boolean(draft.pension_withheld), split_payment: Boolean(draft.split_payment), order_reference: draft.order_reference || '', order_date: draft.order_date || null, contract_reference: draft.contract_reference || '', contract_date: draft.contract_date || null, ddt_reference: draft.ddt_reference || '', ddt_date: draft.ddt_date || null }

  const changeType = async (type: DocumentType) => {
    setDraft((current) => ({ ...current, type, status: 'draft' }))
    if (isNew) {
      const number = await getNextDocumentNumber(type, Number(draft.issue_date.slice(0, 4)))
      setDraft((current) => ({ ...current, number }))
    }
  }

  const updateItem = (index: number, field: keyof DocumentItem, value: string | number) => setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item))
  const removeItem = (index: number) => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index).map((item, position) => ({ ...item, position })))

  const handleSave = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError(''); setMessage('')
    const calculatedDraft = { ...draft, subtotal: totals.subtotal, tax_amount: totals.taxAmount, total: totals.total }
    const cleanItems = items.filter((item) => item.description.trim()).map((item, position) => ({ description: item.description.trim(), quantity: Number(item.quantity), unit: item.unit.trim(), unit_price: Number(item.unit_price), position, tax_rate: Number(item.tax_rate ?? draft.tax_rate), nature_code: item.nature_code?.trim() ?? '', discount_percent: Number(item.discount_percent) || 0 }))
    const { data, error: saveError } = await supabase.rpc('save_document', {
      p_document_id: documentId ?? null, p_client_id: calculatedDraft.client_id, p_job_id: null,
      p_type: calculatedDraft.type, p_number: calculatedDraft.number, p_issue_date: calculatedDraft.issue_date,
      p_expiry_date: calculatedDraft.expiry_date, p_status: calculatedDraft.status, p_subject: calculatedDraft.subject,
      p_notes: calculatedDraft.notes, p_payment_terms: calculatedDraft.payment_terms, p_subtotal: calculatedDraft.subtotal,
      p_discount_percent: calculatedDraft.discount_percent, p_tax_rate: calculatedDraft.tax_rate,
      p_tax_amount: calculatedDraft.tax_amount, p_total: calculatedDraft.total, p_items: cleanItems,
    })
    if (saveError) setError(saveError.message.includes('documents_owner_type_number_key') ? 'Questo numero documento è già in uso.' : 'Non è stato possibile salvare il documento. Controlla i dati e riprova.')
    else if (typeof data === 'string') {
      const { error: otherAmountError } = await supabase.from('documents').update({ other_amount: totals.otherAmount, ...fiscalPayload }).eq('id', data)
      if (otherAmountError) {
        setError('Il documento è stato salvato, ma la voce “Altri” non è stata aggiornata. Esegui la migrazione del database e riprova.')
        setSaving(false)
        return
      }
      setDraft(calculatedDraft); setMessage('Documento salvato correttamente.')
      if (isNew) {
        await advanceDocumentNumber(calculatedDraft.type, Number(calculatedDraft.issue_date.slice(0, 4)))
        navigate(`/gestionale/documenti/${data}`, { replace: true })
      }
    }
    setSaving(false)
  }

  const duplicateDocument = async (targetType: DocumentType) => {
    if (!documentId) return
    setDuplicating(true); setError(''); setMessage('')
    const issueDate = todayIso()
    const number = await getNextDocumentNumber(targetType, Number(issueDate.slice(0, 4)))
    const cleanItems = items.filter((item) => item.description.trim()).map((item, position) => ({ description: item.description.trim(), quantity: Number(item.quantity), unit: item.unit.trim(), unit_price: Number(item.unit_price), position, tax_rate: Number(item.tax_rate ?? draft.tax_rate), nature_code: item.nature_code?.trim() ?? '', discount_percent: Number(item.discount_percent) || 0 }))
    const { data, error: duplicateError } = await supabase.rpc('save_document', {
      p_document_id: null, p_client_id: draft.client_id, p_job_id: null, p_type: targetType, p_number: number,
      p_issue_date: issueDate, p_expiry_date: null, p_status: 'draft', p_subject: draft.subject,
      p_notes: draft.notes, p_payment_terms: draft.payment_terms, p_subtotal: totals.subtotal,
      p_discount_percent: draft.discount_percent, p_tax_rate: draft.tax_rate, p_tax_amount: totals.taxAmount,
      p_total: totals.total, p_items: cleanItems,
    })
    if (duplicateError || typeof data !== 'string') setError('Non è stato possibile duplicare il documento.')
    else {
      await supabase.from('documents').update({ other_amount: totals.otherAmount, ...fiscalPayload }).eq('id', data)
      await advanceDocumentNumber(targetType, Number(issueDate.slice(0, 4)))
      navigate(`/gestionale/documenti/${data}`)
    }
    setDuplicating(false)
  }

  const sendDocument = async (channel: 'email' | 'whatsapp') => {
    if (!documentId || !selectedClient) return
    const recipient = channel === 'email' ? selectedClient.email : selectedClient.phone
    if (!recipient) { setError(channel === 'email' ? 'Il cliente non ha un indirizzo email.' : 'Il cliente non ha un numero di telefono.'); return }
    const popup = channel === 'whatsapp' ? window.open('about:blank', '_blank') : null
    const { error: communicationError } = await supabase.from('document_communications').insert({ document_id: documentId, channel, recipient })
    if (communicationError) { popup?.close(); setError('Non è stato possibile registrare l’invio. Verifica la migrazione Supabase.'); return }
    await supabase.from('documents').update({ status: 'sent' }).eq('id', documentId)
    setDraft((current) => ({ ...current, status: 'sent' }))
    const { data } = await supabase.from('document_communications').select('*').eq('document_id', documentId).order('sent_at', { ascending: false })
    setCommunications((data ?? []) as DocumentCommunication[])
    const subject = `${documentTypeLabels[draft.type]} ${draft.number} - Fastisol`
    const body = `Buongiorno ${selectedClient.contact_name || clientDisplayName(selectedClient)},\n\nin riferimento a ${subject}.\n\nCordiali saluti,\nFastisol`
    if (channel === 'email') window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    else {
      let phone = recipient.replace(/\D/g, '')
      if (!phone.startsWith('39')) phone = `39${phone}`
      if (popup) popup.location.href = `https://wa.me/${phone}?text=${encodeURIComponent(body)}`
    }
  }

  const exportFatturaPa = async (request: FiscalExportRequest) => {
    if (!documentId || draft.type !== 'proforma') return
    setExporting(true); setError(''); setMessage('')
    try {
      const [file] = await executeFiscalExport(request)
      downloadXml(file.xml, file.fileName)
      const { data: fiscalData } = await supabase.from('fiscal_exports').select('*').eq('source_document_id', documentId).order('created_at', { ascending: false })
      setFiscalHistory((fiscalData ?? []) as FiscalExportHistory[])
      setExportModal(false)
      setMessage(`Fattura fiscale ${file.fiscalNumber} archiviata e XML scaricato. Importalo in Aruba e controllalo prima dell’invio allo SDI.`)
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : 'Non è stato possibile generare il file XML.')
    }
    setExporting(false)
  }

  if (loading) return <div className="management-empty">Caricamento documento…</div>

  return <><form className="document-editor" onSubmit={(event) => void handleSave(event)}>
    <div className="management-page-heading document-editor__heading"><div><Link className="management-back-link" to={`/gestionale/documenti/${documentRoute(draft.type)}`}>← {documentListLabel(draft.type)}</Link><h1>{isNew ? `Nuova ${documentTypeLabels[draft.type].toLocaleLowerCase('it')}` : `${documentTypeLabels[draft.type]} ${draft.number}`}</h1><p>Compila i dati e controlla l’anteprima prima di stampare.</p></div><div className="document-editor__top-actions">{!isNew && <><button className="management-secondary-button" type="button" disabled={duplicating} onClick={() => void duplicateDocument(draft.type === 'invoice' ? 'proforma' : draft.type)}><ManagementIcon name="duplicate" /> Nuova versione</button>{draft.type === 'quote' && <button className="management-secondary-button" type="button" disabled={duplicating} onClick={() => void duplicateDocument('proforma')}><ManagementIcon name="documents" /> Crea proforma</button>}{draft.type === 'proforma' && <button className="management-secondary-button" type="button" disabled={exporting} onClick={() => setExportModal(true)}><ManagementIcon name="download" /> Prepara XML per Aruba</button>}<button className="management-secondary-button" type="button" onClick={() => window.print()}><ManagementIcon name="print" /> Stampa / PDF</button></>}<button className="management-primary-button" disabled={saving || !draft.client_id || !draft.number.trim() || !items.some((item) => item.description.trim())}>{saving ? 'Salvataggio…' : 'Salva documento'}</button></div></div>
    {error && <div className="management-alert management-alert--error">{error}</div>}{message && <div className="management-alert management-alert--success">{message}</div>}
    {(draft.type === 'proforma' || draft.type === 'invoice') && <div className="management-alert management-alert--warning"><strong>Questo documento non viene inviato come fattura elettronica dal gestionale.</strong> Il pulsante “XML per Aruba” scarica soltanto il file: dovrai caricarlo, controllarlo e inviarlo da <strong>Aruba Fatturazione</strong>.</div>}
    <div className="document-editor__layout">
      <div className="document-editor__form">
        <section className="management-card document-form-section"><h2>Dati documento</h2><div className="management-form management-form--grid">
          <label><span>Tipo</span><select value={draft.type} onChange={(e) => void changeType(e.target.value as DocumentType)}><option value="quote">Preventivo</option><option value="proforma">Fattura proforma</option>{draft.type === 'invoice' && <option value="invoice">Fattura storica</option>}</select></label>
          <label><span>Numero *</span><input required value={draft.number} onChange={(e) => setDraft((current) => ({ ...current, number: e.target.value }))} /></label>
          <label><span>{draft.type === 'quote' ? 'Valido fino al' : 'Scadenza'}</span><input type="date" value={draft.expiry_date ?? ''} onChange={(e) => setDraft((current) => ({ ...current, expiry_date: e.target.value || null }))} /></label>
          <label className="is-wide"><span>Stato</span><select value={draft.status} onChange={(e) => setDraft((current) => ({ ...current, status: e.target.value as DocumentStatus }))}>{Object.entries(documentStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        </div></section>
        <section className="management-card document-form-section"><h2>Cliente</h2><div className="management-form management-form--grid">
          <label className="is-wide"><span>Cliente *</span><select required value={draft.client_id} onChange={(e) => setDraft((current) => ({ ...current, client_id: e.target.value, job_id: null, project_id: null }))}><option value="">Seleziona un cliente</option>{clients.map((client) => <option key={client.id} value={client.id}>{clientDisplayName(client)}</option>)}</select></label>
          <label className="is-wide"><span>Commessa / cantiere</span><select value={draft.project_id ?? ''} onChange={(e) => setDraft((current) => ({ ...current, project_id: e.target.value || null }))}><option value="">Nessuna commessa</option>{availableProjects.map((project) => <option key={project.id} value={project.id}>{project.code} · {project.name}</option>)}</select></label>
          <label className="is-wide"><span>Oggetto</span><input value={draft.subject} onChange={(e) => setDraft((current) => ({ ...current, subject: e.target.value }))} placeholder="Es. Isolamento termico sottotetto" /></label>
        </div></section>
        <section className="management-card document-form-section"><div className="document-form-section__heading"><h2>Voci</h2><div className="document-item-actions"><select defaultValue="" onChange={event=>{const item=catalog.find(value=>value.id===event.target.value);if(item)setItems(current=>[...current.filter(row=>row.description.trim()),{description:item.description,quantity:1,unit:item.unit,unit_price:item.sale_price,position:current.length,tax_rate:item.tax_rate,nature_code:item.nature_code,discount_percent:0}]);event.target.value=''}}><option value="">Aggiungi dal listino…</option>{catalog.map(item=><option key={item.id} value={item.id}>{item.code} · {item.description}</option>)}</select><button type="button" onClick={() => setItems((current) => [...current, newItem(current.length)])}><ManagementIcon name="plus" /> Voce libera</button></div></div><div className="document-items-editor">
          {items.map((item, index) => <div className="document-item-row" key={index}><label className="item-description"><span>Descrizione</span><textarea rows={2} required={index === 0} value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} /></label><label><span>Quantità</span><input type="number" min="0" step="0.01" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))} /></label><label><span>Unità</span><input value={item.unit} onChange={(e) => updateItem(index, 'unit', e.target.value)} /></label><label><span>Prezzo unitario</span><input type="number" min="0" step="0.01" value={item.unit_price} onChange={(e) => updateItem(index, 'unit_price', Number(e.target.value))} /></label><label><span>Sconto riga %</span><input type="number" min="0" max="100" step="0.01" value={item.discount_percent ?? 0} onChange={(e) => updateItem(index, 'discount_percent', Number(e.target.value))} /></label><label><span>IVA %</span><input type="number" min="0" step="0.01" value={item.tax_rate ?? draft.tax_rate} onChange={(e) => updateItem(index, 'tax_rate', Number(e.target.value))} /></label><label><span>Natura (se IVA 0)</span><select value={item.nature_code ?? ''} onChange={(e) => updateItem(index, 'nature_code', e.target.value)}><option value="">Nessuna</option>{natureCodes.map((code) => <option key={code} value={code}>{code}</option>)}</select></label><strong>{formatCurrency(item.quantity * item.unit_price * (1 - Number(item.discount_percent ?? 0) / 100))}</strong><button type="button" aria-label="Rimuovi voce" disabled={items.length === 1} onClick={() => removeItem(index)}><ManagementIcon name="trash" /></button></div>)}
        </div></section>
        <section className="management-card document-form-section"><h2>Totali e condizioni</h2><div className="management-form management-form--grid"><label><span>Sconto globale %</span><input type="number" min="0" max="100" step="0.01" value={draft.discount_percent} onChange={(e) => setDraft((current) => ({ ...current, discount_percent: Number(e.target.value) }))} /></label><label><span>IVA predefinita %</span><input type="number" min="0" step="0.01" value={draft.tax_rate} onChange={(e) => setDraft((current) => ({ ...current, tax_rate: Number(e.target.value) }))} /></label><label><span>Altri costi</span><input type="number" min="0" step="0.01" value={draft.other_amount} onChange={(e) => setDraft((current) => ({ ...current, other_amount: Number(e.target.value) }))} /></label><label className="is-wide"><span>Condizioni di pagamento</span><input value={draft.payment_terms} onChange={(e) => setDraft((current) => ({ ...current, payment_terms: e.target.value }))} /></label><label className="is-wide"><span>Note da mostrare nel documento</span><textarea rows={4} value={draft.notes} onChange={(e) => setDraft((current) => ({ ...current, notes: e.target.value }))} /></label></div></section>
        {(draft.type === 'proforma' || draft.type === 'invoice') && <FiscalSection draft={draft} setDraft={setDraft} paymentCount={payments.length} />}
        {!isNew && draft.type === 'proforma' && <section className="management-card document-form-section"><div className="document-form-section__heading"><div><h2>Storico fiscale immutabile</h2><p>Ogni riga conserva l’XML esatto validato al momento dell’assegnazione del numero fiscale.</p></div></div>{fiscalHistory.length === 0 ? <p className="management-fiscal-note">Nessuna fattura fiscale ancora generata da questa proforma.</p> : <div className="management-table-wrap"><table className="management-table"><thead><tr><th>Numero fattura</th><th>Data</th><th>Tipo</th><th>Validazione</th><th /></tr></thead><tbody>{fiscalHistory.map((entry) => <tr key={entry.id}><td><strong>{entry.fiscal_number}</strong><small className="management-table__subline">SHA-256 {entry.xml_sha256.slice(0, 12)}…</small></td><td>{formatDate(entry.issue_date)}</td><td>{entry.document_type}</td><td>XSD {entry.xsd_version}</td><td><button className="management-secondary-button" type="button" onClick={() => downloadXml(entry.xml_snapshot, entry.xml_file_name)}><ManagementIcon name="download" /> XML originale</button></td></tr>)}</tbody></table></div>}</section>}
        {!isNew && <section className="management-card document-form-section management-document-send"><h2>Invio documento</h2><p>Scarica prima il PDF se vuoi allegarlo manualmente al messaggio.</p><div><button className="management-secondary-button" type="button" onClick={() => void sendDocument('email')}><ManagementIcon name="mail" /> Apri email</button><button className="management-secondary-button" type="button" onClick={() => void sendDocument('whatsapp')}><ManagementIcon name="whatsapp" /> Apri WhatsApp</button></div>{communications.length > 0 && <ul>{communications.map((communication) => <li key={communication.id}><ManagementIcon name={communication.channel === 'email' ? 'mail' : 'whatsapp'} /><span>Inviato a {communication.recipient}</span><time>{new Intl.DateTimeFormat('it-IT', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(communication.sent_at))}</time></li>)}</ul>}</section>}
      </div>

      <aside className="document-preview-wrap"><p>Anteprima documento</p><DocumentPreview draft={draft} items={items} client={selectedClient} totals={totals} /></aside>
    </div>
  </form>{exportModal && documentId && <FiscalExportModal documents={[{ ...draft, id: documentId, approved: false, work_completed: false, created_at: '', updated_at: '' } as BusinessDocument]} busy={exporting} onClose={() => !exporting && setExportModal(false)} onConfirm={(request) => void exportFatturaPa(request)} />}</>
}

function FiscalSection({ draft, setDraft, paymentCount }: { draft: DocumentDraft; setDraft: (updater: (current: DocumentDraft) => DocumentDraft) => void; paymentCount: number }) {
  const field = (name: keyof DocumentDraft, value: string | number | boolean | null) => setDraft((current) => ({ ...current, [name]: value }))
  return <section className="management-card document-form-section management-fiscal-section"><div className="document-form-section__heading"><div><h2>Dati FatturaPA</h2><p>Campi fiscali e riferimenti esportati nell’XML per Aruba.</p></div></div><div className="management-form management-form--grid">
    <label><span>Tipo documento XML</span><select value={draft.electronic_document_type ?? 'TD01'} onChange={(event) => field('electronic_document_type', event.target.value)}>{['TD01','TD02','TD03','TD04','TD05','TD06','TD24','TD25','TD26'].map((code) => <option key={code} value={code}>{code}</option>)}</select></label>
    <label className="management-check-label"><input type="checkbox" checked={Boolean(draft.split_payment)} onChange={(event) => field('split_payment', event.target.checked)} /><span>Scissione pagamenti</span></label>
    <label className="management-check-label"><input type="checkbox" checked={Boolean(draft.stamp_duty)} onChange={(event) => field('stamp_duty', event.target.checked)} /><span>Bollo virtuale</span></label>
    <label><span>Importo bollo</span><input type="number" min="0" step="0.01" disabled={!draft.stamp_duty} value={draft.stamp_amount ?? 2} onChange={(event) => field('stamp_amount', Number(event.target.value))} /></label>
    <label><span>Tipo ritenuta</span><select value={draft.withholding_type ?? ''} onChange={(event) => field('withholding_type', event.target.value)}><option value="">Nessuna</option>{['RT01','RT02','RT03','RT04','RT05','RT06'].map((code) => <option key={code} value={code}>{code}</option>)}</select></label>
    <label><span>Aliquota ritenuta %</span><input type="number" min="0" step="0.01" value={draft.withholding_rate ?? 0} onChange={(event) => field('withholding_rate', Number(event.target.value))} /></label>
    <label><span>Importo ritenuta (0 = calcolo)</span><input type="number" min="0" step="0.01" value={draft.withholding_amount ?? 0} onChange={(event) => field('withholding_amount', Number(event.target.value))} /></label>
    <label><span>Causale ritenuta</span><input maxLength={2} value={draft.withholding_reason ?? ''} onChange={(event) => field('withholding_reason', event.target.value.toUpperCase())} placeholder="A" /></label>
    <label><span>Tipo cassa previdenziale</span><select value={draft.pension_fund_type ?? ''} onChange={(event) => field('pension_fund_type', event.target.value)}><option value="">Nessuna</option>{Array.from({ length: 22 }, (_, index) => `TC${String(index + 1).padStart(2, '0')}`).map((code) => <option key={code}>{code}</option>)}</select></label>
    <label><span>Aliquota cassa %</span><input type="number" min="0" step="0.01" value={draft.pension_rate ?? 0} onChange={(event) => field('pension_rate', Number(event.target.value))} /></label>
    <label><span>Importo cassa (0 = calcolo)</span><input type="number" min="0" step="0.01" value={draft.pension_amount ?? 0} onChange={(event) => field('pension_amount', Number(event.target.value))} /></label>
    <label><span>IVA cassa %</span><input type="number" min="0" step="0.01" value={draft.pension_tax_rate ?? 22} onChange={(event) => field('pension_tax_rate', Number(event.target.value))} /></label>
    <label className="management-check-label"><input type="checkbox" checked={Boolean(draft.pension_withheld)} onChange={(event) => field('pension_withheld', event.target.checked)} /><span>Cassa soggetta a ritenuta</span></label>
    <div />
    <label><span>Riferimento ordine</span><input value={draft.order_reference ?? ''} onChange={(event) => field('order_reference', event.target.value)} /></label><label><span>Data ordine</span><input type="date" value={draft.order_date ?? ''} onChange={(event) => field('order_date', event.target.value || null)} /></label>
    <label><span>Riferimento contratto</span><input value={draft.contract_reference ?? ''} onChange={(event) => field('contract_reference', event.target.value)} /></label><label><span>Data contratto</span><input type="date" value={draft.contract_date ?? ''} onChange={(event) => field('contract_date', event.target.value || null)} /></label>
    <label><span>Numero DDT</span><input value={draft.ddt_reference ?? ''} onChange={(event) => field('ddt_reference', event.target.value)} /></label><label><span>Data DDT</span><input type="date" value={draft.ddt_date ?? ''} onChange={(event) => field('ddt_date', event.target.value || null)} /></label>
  </div><p className="management-fiscal-note">Scadenze XML: {paymentCount ? `${paymentCount} registrate nella sezione Incassi` : 'verrà usata la scadenza del documento'}. L’XML va comunque controllato in Aruba prima dell’invio allo SDI.</p></section>
}

type PreviewTotals = { subtotal: number; discounted: number; taxAmount: number; otherAmount: number; stampAmount: number; pensionAmount: number; pensionTax: number; withholdingAmount: number; total: number }
function DocumentPreview({ draft, items, client, totals }: { draft: DocumentDraft; items: DocumentItem[]; client?: Client; totals: PreviewTotals }) {
  return <article className="document-sheet">
    <div className="document-sheet__body">
      <header className="document-sheet__header">
        <div className={draft.type !== 'quote' ? 'is-proforma' : undefined}>
          <strong>{draft.type === 'quote' ? 'PREVENTIVO' : draft.type === 'proforma' ? 'FATTURA PROFORMA' : 'FATTURA'} <span>#{draft.number || '—'}</span></strong>
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
        {draft.payment_terms && <p><strong>Condizioni di pagamento:</strong> {draft.payment_terms}</p>}
      </section>

      <table className="document-sheet__items">
        <thead><tr><th>Descrizione</th><th>Quantità</th><th>Prezzo</th><th>Totale</th></tr></thead>
        <tbody>
          {items.filter((item) => item.description.trim()).map((item, index) => <tr key={index}>
            <td>{item.description}</td>
            <td>{item.quantity.toLocaleString('it-IT')} {item.unit}</td>
            <td>{formatCurrency(item.unit_price)}</td>
            <td>{formatCurrency(item.quantity * item.unit_price * (1 - Number(item.discount_percent ?? 0) / 100))}</td>
          </tr>)}
          {!items.some((item) => item.description.trim()) && <tr><td colSpan={4}>Inserisci almeno una voce</td></tr>}
        </tbody>
      </table>

      <div className="document-sheet__summary">
        <dl>
          <div><dt>Subtotale:</dt><dd>{formatCurrency(totals.subtotal)}</dd></div>
          {totals.subtotal > totals.discounted && <div><dt>Sconti:</dt><dd>− {formatCurrency(totals.subtotal - totals.discounted)}</dd></div>}
          <div><dt>IVA:</dt><dd>{formatCurrency(totals.taxAmount)}</dd></div>
          {totals.pensionAmount > 0 && <div><dt>Cassa:</dt><dd>{formatCurrency(totals.pensionAmount + totals.pensionTax)}</dd></div>}
          {totals.stampAmount > 0 && <div><dt>Bollo:</dt><dd>{formatCurrency(totals.stampAmount)}</dd></div>}
          {totals.withholdingAmount > 0 && <div><dt>Ritenuta:</dt><dd>− {formatCurrency(totals.withholdingAmount)}</dd></div>}
          <div><dt>Altri:</dt><dd>{formatCurrency(totals.otherAmount)}</dd></div>
          <div className="document-sheet__total"><dt>Totale:</dt><dd>{formatCurrency(totals.total)}</dd></div>
        </dl>
      </div>

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

function documentRoute(type: DocumentType) { return type === 'quote' ? 'preventivi' : 'proforma' }
function documentListLabel(type: DocumentType) { return type === 'quote' ? 'Preventivi' : 'Fatture proforma' }
