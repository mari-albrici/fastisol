import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ManagementIcon } from './ManagementIcon'
import { supabase } from './supabase'
import type { BusinessDocument } from './types'
import type { FiscalExportRequest } from './fiscalExports'
import { todayIso } from './utils'

export function FiscalExportModal({ documents, busy, onClose, onConfirm }: { documents: BusinessDocument[]; busy: boolean; onClose: () => void; onConfirm: (request: FiscalExportRequest) => void }) {
  const [issueDate, setIssueDate] = useState(todayIso())
  const [documentType, setDocumentType] = useState('TD01')
  const [reason, setReason] = useState(documents.length === 1 && documents[0].subject ? documents[0].subject : 'Prestazioni come da fattura proforma')
  const [includeSourceReference, setIncludeSourceReference] = useState(true)
  const [numbers, setNumbers] = useState<string[]>([])
  const [loadingNumbers, setLoadingNumbers] = useState(true)
  const [error, setError] = useState('')
  const documentIds = useMemo(() => documents.map((document) => document.id), [documents])

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoadingNumbers(true); setError('')
      const year = Number(issueDate.slice(0, 4))
      const { data, error: loadError } = await supabase.from('document_number_settings').select('*').eq('year', year).eq('type', 'invoice').maybeSingle()
      if (!active) return
      if (loadError) setError('Non è stato possibile leggere il progressivo fiscale.')
      else {
        const prefix = data?.prefix ?? 'FT'
        const next = Number(data?.next_number ?? 1)
        const padding = Number(data?.padding ?? 3)
        setNumbers(documentIds.map((_, index) => `${prefix}-${year}-${String(next + index).padStart(padding, '0')}`))
      }
      setLoadingNumbers(false)
    }
    void load()
    return () => { active = false }
  }, [documentIds, issueDate])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (numbers.length !== documents.length) return
    onConfirm({ issueDate, documentType, reason: reason.trim(), includeSourceReference, assignments: documents.map((document, index) => ({ documentId: document.id, fiscalNumber: numbers[index] })) })
  }

  return <div className="management-modal" role="dialog" aria-modal="true" aria-labelledby="fiscal-export-title">
    <button className="management-modal__backdrop" type="button" aria-label="Chiudi" disabled={busy} onClick={onClose} />
    <div className="management-modal__panel management-modal__panel--wide fiscal-export-modal">
      <div className="management-modal__header"><div><span>Esportazione fiscale per Aruba</span><h2 id="fiscal-export-title">Assegna i dati della vera fattura</h2></div><button type="button" disabled={busy} onClick={onClose}><ManagementIcon name="x" /></button></div>
      <div className="management-alert management-alert--warning"><strong>Questa operazione assegna numeri fiscali definitivi.</strong> Gli XML verranno validati e salvati in uno storico immutabile prima del download. Non vengono inviati allo SDI.</div>
      {error && <div className="management-alert management-alert--error">{error}</div>}
      <form className="management-form management-form--grid" onSubmit={submit}>
        <label><span>Data emissione *</span><input required type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} /></label>
        <label><span>Tipo documento *</span><select value={documentType} onChange={(event) => setDocumentType(event.target.value)}>{['TD01','TD02','TD03','TD04','TD05','TD06','TD24','TD25','TD26','TD27','TD28','TD29'].map((code) => <option key={code} value={code}>{code}</option>)}</select></label>
        <label className="is-wide"><span>Causale</span><textarea rows={3} maxLength={180} value={reason} onChange={(event) => setReason(event.target.value)} /></label>
        <label className="management-check-label is-wide"><input type="checkbox" checked={includeSourceReference} onChange={(event) => setIncludeSourceReference(event.target.checked)} /><span>Inserisci in causale il riferimento alla proforma originale</span></label>
        <div className="is-wide fiscal-export-modal__numbers"><strong>Numeri fiscali assegnati</strong>{documents.map((document, index) => <div key={document.id}><span>{document.number} · {document.subject || 'Proforma'}</span><b>{loadingNumbers ? 'Calcolo…' : numbers[index]}</b></div>)}</div>
        <p className="is-wide fiscal-export-modal__note">Il progressivo è separato da quello della proforma. Se nel frattempo cambia, il database bloccherà l’operazione e chiederà di riaprire questa finestra.</p>
        <div className="management-form__actions is-wide"><button className="management-secondary-button" type="button" disabled={busy} onClick={onClose}>Annulla</button><button className="management-primary-button" disabled={busy || loadingNumbers || Boolean(error)}>{busy ? 'Validazione e archiviazione…' : documents.length > 1 ? `Conferma ${documents.length} fatture e scarica ZIP` : 'Conferma fattura e scarica XML'}</button></div>
      </form>
    </div>
  </div>
}
