import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { ManagementIcon } from './ManagementIcon'
import { applyWarrantyStock } from './materials'
import { extractWarrantyPdf, type ExtractedWarrantyData } from './warrantyPdf'
import { supabase } from './supabase'
import type { Client, Project, WarrantyArchive } from './types'
import { clientDisplayName, todayIso } from './utils'

const emptyForm = { client_id: '', project_id: '', material_name: '', quantity_text: '', lot_number: '', warranty_number: '', issue_date: todayIso(), expiry_date: '', supplier_name: '', notes: '' }

export function ManagementWarrantiesPage({ embedded = false, onOpenReady }: { embedded?: boolean; onOpenReady?: (action: () => void) => void }) {
  const [warranties, setWarranties] = useState<WarrantyArchive[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [form, setForm] = useState({ ...emptyForm })
  const [file, setFile] = useState<File | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [extracted, setExtracted] = useState<ExtractedWarrantyData | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [stockMessage, setStockMessage] = useState('')

  const load = async () => {
    const [warrantyResult, clientResult, projectResult] = await Promise.all([
      supabase.from('warranties_archive').select('*, clients(company_name, contact_name), projects(code, name)').not('file_path', 'is', null).order('created_at', { ascending: false }),
      supabase.from('clients').select('*').order('company_name').order('contact_name'),
      supabase.from('projects').select('*').order('code'),
    ])
    if (warrantyResult.error) setError('Non è stato possibile caricare le garanzie PDF. Applica la migrazione materiali.')
    else setWarranties((warrantyResult.data ?? []) as WarrantyArchive[])
    if (!clientResult.error) setClients((clientResult.data ?? []) as Client[])
    if (!projectResult.error) setProjects((projectResult.data ?? []) as Project[])
    setLoading(false)
  }

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer) }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('it')
    return warranties.filter((item) => !term || [item.file_name, item.warranty_number, item.material_name, item.quantity_text, item.lot_number, item.supplier_name, item.clients ? clientDisplayName(item.clients) : '', item.projects?.code ?? ''].some((value) => (value ?? '').toLocaleLowerCase('it').includes(term)))
  }, [search, warranties])

  const openNew = useCallback(() => { setForm({ ...emptyForm, issue_date: todayIso() }); setFile(null); setExtracted(null); setError(''); setStockMessage(''); setModalOpen(true) }, [])
  useEffect(() => {
    if (!embedded || !onOpenReady) return
    onOpenReady(openNew)
    return () => onOpenReady(() => undefined)
  }, [embedded, onOpenReady, openNew])
  const setField = (field: keyof typeof emptyForm, value: string) => setForm((current) => ({ ...current, [field]: value }))

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null
    setFile(selectedFile); setExtracted(null); setError('')
    if (!selectedFile) return
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLocaleLowerCase('it').endsWith('.pdf')) { setError('Seleziona un singolo file PDF generato dal fornitore.'); return }
    setExtracting(true)
    try {
      const result = await extractWarrantyPdf(selectedFile)
      setExtracted(result)
      setForm((current) => ({ ...current, material_name: result.materialName || current.material_name, quantity_text: result.quantityText || current.quantity_text, lot_number: result.lotNumber || current.lot_number, warranty_number: result.warrantyNumber || current.warranty_number, issue_date: result.issueDate || current.issue_date, expiry_date: result.expiryDate || current.expiry_date, supplier_name: result.supplierName || current.supplier_name }))
      const matchingClient = clients.find((client) => result.clientName && clientDisplayName(client).toLocaleLowerCase('it').includes(result.clientName.toLocaleLowerCase('it')))
      if (matchingClient) setForm((current) => ({ ...current, client_id: matchingClient.id }))
    } catch (extractError) { setError(extractError instanceof Error ? `PDF caricato, ma estrazione non riuscita: ${extractError.message}` : 'PDF caricato, ma non è stato possibile estrarre i dati.') }
    setExtracting(false)
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!file || (file.type !== 'application/pdf' && !file.name.toLocaleLowerCase('it').endsWith('.pdf'))) { setError('Seleziona un singolo file PDF generato dal fornitore.'); return }
    setSaving(true); setError('')
    let filePath: string | null = null
    try {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) throw new Error('Sessione non valida')
      filePath = `${user.id}/warranties/${crypto.randomUUID()}-${file.name}`
      const upload = await supabase.storage.from('management-files').upload(filePath, file, { contentType: 'application/pdf' })
      if (upload.error) throw upload.error
      const { data: warranty, error: insertError } = await supabase.from('warranties_archive').insert({ ...form, issue_date: form.issue_date || null, expiry_date: form.expiry_date || null, file_name: file.name, file_path: filePath, file_type: 'application/pdf', file_size: file.size, status: 'uploaded' }).select('id').single()
      if (insertError || !warranty) throw insertError ?? new Error('Garanzia non archiviata')
      const firstLot = await supabase.from('material_lots').select('yield_sqm_per_kit, reference_thickness_cm').order('entry_date').order('created_at').limit(1).maybeSingle()
      const quantity = parseWarrantyQuantity(form.quantity_text, Number(firstLot.data?.yield_sqm_per_kit ?? 0))
      if (quantity && form.client_id && form.project_id) {
        try {
          await applyWarrantyStock({ warrantyId: warranty.id, clientId: form.client_id, projectId: form.project_id, applicationDate: form.issue_date || todayIso(), declaredSqm: quantity, referenceThicknessCm: Number(firstLot.data?.reference_thickness_cm ?? 14), notes: `Consumo automatico da garanzia ${form.warranty_number || file.name}` })
          setStockMessage(`Scorta aggiornata automaticamente: ${quantity.toLocaleString('it-IT')} m² consumati secondo FIFO.`)
        } catch (stockError) {
          setStockMessage(stockError instanceof Error ? `PDF archiviato. Scorta non aggiornata automaticamente: ${stockError.message}` : 'PDF archiviato. Scorta da aggiornare manualmente.')
        }
      } else setStockMessage('PDF archiviato. Quantità non interpretabile in m²: aggiorna la scorta manualmente dalla scheda Scorte.')
      setModalOpen(false); await load()
    } catch (saveError) {
      if (filePath) await supabase.storage.from('management-files').remove([filePath])
      setError(saveError instanceof Error ? saveError.message : 'Non è stato possibile archiviare il PDF.')
    }
    setSaving(false)
  }

  const download = async (item: WarrantyArchive) => {
    if (!item.file_path) return
    const { data, error: downloadError } = await supabase.storage.from('management-files').download(item.file_path)
    if (downloadError || !data) { setError('Non è stato possibile scaricare il PDF.'); return }
    const url = URL.createObjectURL(data); const link = document.createElement('a'); link.href = url; link.download = item.file_name ?? 'garanzia.pdf'; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return <div className={`management-warranties${embedded ? ' management-warranties--embedded' : ''}`}>
    {!embedded && <div className="management-page-heading"><div><span>Archivio documenti fornitore</span><h1>Garanzie PDF</h1><p>Carica il documento originale del fornitore: i dati riconosciuti vengono proposti e possono essere verificati prima dell’archiviazione.</p></div><button className="management-primary-button" type="button" onClick={openNew}><ManagementIcon name="upload" /> Carica PDF</button></div>}
    {error && <div className="management-alert management-alert--error">{error}</div>}{stockMessage && <div className="management-alert management-alert--success">{stockMessage}</div>}
    <section className={embedded ? 'management-materials-warranties-content' : 'management-card'}><div className="management-toolbar"><label className="management-search"><ManagementIcon name="search" /><span className="sr-only">Cerca PDF</span><input type="search" placeholder="Cerca file, cliente, commessa, lotto…" value={search} onChange={(event) => setSearch(event.target.value)} /></label><span>{filtered.length} PDF archiviati</span></div>{loading ? <div className="management-empty">Caricamento…</div> : filtered.length === 0 ? <div className="management-empty"><p>Nessun PDF di garanzia archiviato.</p><button type="button" onClick={openNew}>Carica il primo PDF</button></div> : <div className="management-table-wrap"><table className="management-table"><thead><tr><th>Documento</th><th>Cliente</th><th>Commessa</th><th>Materiale / quantità</th><th>Lotto</th><th aria-label="Azioni" /></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td><strong>{item.file_name}</strong><small>{item.warranty_number || 'Codice non indicato'}</small></td><td>{item.clients ? clientDisplayName(item.clients) : '—'}</td><td>{item.projects?.code || '—'}</td><td>{item.material_name || '—'}<small>{item.quantity_text || 'Quantità non indicata'}</small></td><td>{item.lot_number || '—'}</td><td><div className="management-row-actions"><button type="button" title="Scarica PDF" onClick={() => void download(item)}><ManagementIcon name="download" /></button></div></td></tr>)}</tbody></table></div>}</section>
    {modalOpen && <div className="management-modal" role="dialog" aria-modal="true"><button className="management-modal__backdrop" type="button" aria-label="Chiudi" onClick={() => setModalOpen(false)} /><div className="management-modal__panel management-modal__panel--wide"><div className="management-modal__header"><div><span>Archivio garanzie</span><h2>Carica PDF del fornitore</h2></div><button type="button" aria-label="Chiudi" onClick={() => setModalOpen(false)}><ManagementIcon name="x" /></button></div><form className="management-form management-form--grid" onSubmit={(event) => void save(event)}><div className="management-alert management-alert--success is-wide">Il PDF originale viene letto automaticamente. Controlla i dati proposti prima di archiviare il documento.</div><label className="is-wide"><span>Documento PDF *</span><input required type="file" accept="application/pdf,.pdf" onChange={(event) => void handleFile(event)} /></label>{extracting && <div className="management-alert management-alert--success is-wide">Estrazione dati in corso…</div>}{extracted && <div className="management-alert management-alert--success is-wide">Dati estratti: {extracted.clientName || 'cliente non riconosciuto'}, {extracted.materialName || 'materiale non riconosciuto'}. Verifica i campi prima del salvataggio.</div>}<label><span>Cliente *</span><select required value={form.client_id} onChange={(event) => setField('client_id', event.target.value)}><option value="">Seleziona cliente</option>{clients.map((item) => <option key={item.id} value={item.id}>{clientDisplayName(item)}</option>)}</select></label><label><span>Commessa *</span><select required value={form.project_id} onChange={(event) => setField('project_id', event.target.value)}><option value="">Seleziona commessa</option>{projects.filter((item) => !form.client_id || item.client_id === form.client_id).map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select></label><label><span>Materiale</span><input value={form.material_name} onChange={(event) => setField('material_name', event.target.value)} /></label><label><span>Quantità</span><input value={form.quantity_text} onChange={(event) => setField('quantity_text', event.target.value)} /></label><label><span>Lotto</span><input value={form.lot_number} onChange={(event) => setField('lot_number', event.target.value)} /></label><label><span>Numero/codice garanzia</span><input value={form.warranty_number} onChange={(event) => setField('warranty_number', event.target.value)} /></label><label><span>Data emissione</span><input type="date" value={form.issue_date} onChange={(event) => setField('issue_date', event.target.value)} /></label><label><span>Scadenza</span><input type="date" value={form.expiry_date} onChange={(event) => setField('expiry_date', event.target.value)} /></label><label><span>Fornitore emittente</span><input value={form.supplier_name} onChange={(event) => setField('supplier_name', event.target.value)} /></label><label className="is-wide"><span>Note</span><textarea rows={3} value={form.notes} onChange={(event) => setField('notes', event.target.value)} /></label><div className="management-form__actions is-wide"><button className="management-secondary-button" type="button" onClick={() => setModalOpen(false)}>Annulla</button><button className="management-primary-button" disabled={saving || extracting}>{saving ? 'Caricamento…' : 'Archivia PDF'}</button></div></form></div></div>}
  </div>
}

function parseWarrantyQuantity(value: string, yieldSqmPerKit: number) {
  const normalized = value.replace(',', '.')
  const amount = normalized.match(/(\d+(?:\.\d+)?)/)
  if (!amount) return null
  const quantity = Number(amount[1])
  if (/(?:m2|m²|mq|metri quadrati)/i.test(normalized)) return quantity
  if (/(?:kit|kits)/i.test(normalized) && yieldSqmPerKit > 0) return quantity * yieldSqmPerKit
  return null
}
