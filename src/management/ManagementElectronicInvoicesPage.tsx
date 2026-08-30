import { useState } from 'react'
import { useManagementAuth } from './AuthContext'
import { ManagementIcon } from './ManagementIcon'
import { supabase } from './supabase'

export function ManagementElectronicInvoicesPage() {
  const { session } = useManagementAuth()
  const [importFile, setImportFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const upload = async (source: File) => {
    if (!session) throw new Error('Sessione scaduta.')
    const path = `${session.user.id}/${crypto.randomUUID()}-${source.name.replace(/[^\w.-]/g, '-')}`
    const { error: uploadError } = await supabase.storage.from('accounting-files').upload(path, source, { contentType: source.type || 'application/xml' })
    if (uploadError) throw new Error('Caricamento file non riuscito.')
    return path
  }

  const importPassive = async () => {
    if (!importFile || !session) return
    setBusy(true); setError(''); setMessage('')
    try {
      const xml = await importFile.text()
      const documentXml = new DOMParser().parseFromString(xml, 'application/xml')
      if (documentXml.querySelector('parsererror')) throw new Error('Il file XML non è valido.')
      const seller = first(documentXml, 'CedentePrestatore')
      if (!seller) throw new Error('CedentePrestatore non trovato.')
      const vat = tag(seller, 'IdCodice')
      const name = tag(seller, 'Denominazione') || [tag(seller, 'Nome'), tag(seller, 'Cognome')].filter(Boolean).join(' ')
      if (!vat || !name) throw new Error('Fornitore non riconoscibile.')
      let supplierId = ''
      const found = await supabase.from('suppliers').select('id').eq('vat_number', vat).is('deleted_at', null).maybeSingle()
      if (found.data) supplierId = found.data.id
      else {
        const created = await supabase.from('suppliers').insert({ company_name: name, contact_name: '', tax_code: tag(seller, 'CodiceFiscale'), vat_number: vat, fiscal_regime: tag(seller, 'RegimeFiscale'), email: '', phone: '', pec: '', sdi_code: '0000000', address: tag(seller, 'Indirizzo'), postal_code: tag(seller, 'CAP'), city: tag(seller, 'Comune'), province: tag(seller, 'Provincia'), country: tag(seller, 'Nazione') || 'IT', iban: '', notes: 'Creato automaticamente da XML fattura passiva' }).select('id').single()
        if (created.error || !created.data) throw new Error('Fornitore non creato.')
        supplierId = created.data.id
      }
      const general = first(documentXml, 'DatiGeneraliDocumento')
      if (!general) throw new Error('Dati fattura non trovati.')
      const summaries = [...documentXml.getElementsByTagName('DatiRiepilogo')]
      const taxable = summaries.reduce((sum, node) => sum + numeric(tag(node, 'ImponibileImporto')), 0)
      const tax = summaries.reduce((sum, node) => sum + numeric(tag(node, 'Imposta')), 0)
      const total = numeric(tag(general, 'ImportoTotaleDocumento')) || taxable + tax
      const path = await upload(importFile)
      const number = tag(general, 'Numero')
      const { error: insertError } = await supabase.from('purchase_documents').insert({ supplier_id: supplierId, kind: tag(general, 'TipoDocumento') === 'TD04' ? 'credit_note' : 'invoice', number, issue_date: tag(general, 'Data'), due_date: tag(documentXml, 'DataScadenzaPagamento') || null, taxable_amount: taxable, tax_amount: tax, total, paid_amount: 0, payment_date: null, notes: 'Importata automaticamente da XML FatturaPA', file_name: importFile.name, file_path: path, file_type: importFile.type || 'application/xml', file_size: importFile.size })
      if (insertError) { await supabase.storage.from('accounting-files').remove([path]); throw new Error(insertError.code === '23505' ? 'Questa fattura passiva risulta già importata.' : 'Importazione non riuscita.') }
      setMessage(`Fattura passiva ${number} di ${name} importata correttamente.`)
      setImportFile(null)
    } catch (importError) { setError(importError instanceof Error ? importError.message : 'Importazione non riuscita.') }
    setBusy(false)
  }

  return <div><div className="management-page-heading"><div><span>Amministrazione</span><h1>Importa fatture passive</h1><p>Carica gli XML ricevuti dai fornitori per registrarli tra costi e scadenze.</p></div></div>
    {error && <div className="management-alert management-alert--error">{error}</div>}{message && <div className="management-alert management-alert--success">{message}</div>}
    <section className="management-card management-import-panel"><div><ManagementIcon name="upload" size={34} /><h2>Importa XML ricevuto</h2><p>Il gestionale legge fornitore, numero, data, imponibile, IVA, totale e scadenza; se necessario crea l’anagrafica fornitore.</p></div><input type="file" accept=".xml,application/xml,text/xml" onChange={(event) => setImportFile(event.target.files?.[0] ?? null)} /><button className="management-primary-button" disabled={!importFile || busy} onClick={() => void importPassive()}>{busy ? 'Importazione…' : 'Importa fattura passiva'}</button></section>
  </div>
}

function first(root: Document | Element, tagName: string) { return root.getElementsByTagName(tagName)[0] ?? null }
function tag(root: Document | Element, tagName: string) { return first(root, tagName)?.textContent?.trim() ?? '' }
function numeric(value: string) { return Number(value.replace(',', '.')) || 0 }
