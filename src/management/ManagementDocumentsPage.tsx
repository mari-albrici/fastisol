import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import JSZip from 'jszip'
import { downloadXml } from './fatturaPa'
import { FiscalExportModal } from './FiscalExportModal'
import { executeFiscalExport, type FiscalExportRequest } from './fiscalExports'
import { ManagementIcon } from './ManagementIcon'
import { supabase } from './supabase'
import { documentTypeLabels, type BusinessDocument, type DocumentType } from './types'
import { clientDisplayName, formatDate } from './utils'

export function ManagementDocumentsPage({ documentType }: { documentType?: DocumentType }) {
  const [documents, setDocuments] = useState<BusinessDocument[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [exportModal, setExportModal] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      let query = supabase.from('documents').select('*, clients(company_name, contact_name)').is('deleted_at',null).order('issue_date', { ascending: false }).order('created_at', { ascending: false })
      if (documentType) query = query.eq('type', documentType)
      else query = query.in('type', ['quote', 'proforma'])
      const { data, error: loadError } = await query
      if (loadError) setError('Non è stato possibile caricare i documenti.')
      else setDocuments((data ?? []) as BusinessDocument[])
      setLoading(false)
    }
    void load()
  }, [documentType])

  const filteredDocuments = useMemo(() => documents.filter((document) => {
    const term = search.trim().toLocaleLowerCase('it')
    return !term || [document.number, document.subject, document.clients?.company_name ?? '', document.clients?.contact_name ?? ''].some((value) => value.toLocaleLowerCase('it').includes(term))
  }), [documents, search])

  const handleCheck = async (document: BusinessDocument, field: 'approved' | 'work_completed', checked: boolean) => {
    setError('')
    setDocuments((current) => current.map((item) => item.id === document.id ? { ...item, [field]: checked } : item))
    const { error: updateError } = await supabase.from('documents').update({ [field]: checked }).eq('id', document.id)
    if (updateError) {
      setDocuments((current) => current.map((item) => item.id === document.id ? { ...item, [field]: !checked } : item))
      setError('Non è stato possibile aggiornare il documento. Verifica di aver eseguito la migrazione del database.')
    }
  }

  const toggleSelection = (id: string, checked: boolean) => setSelectedIds((current) => { const next = new Set(current); if (checked) next.add(id); else next.delete(id); return next })

  const exportSelected = async (request: FiscalExportRequest) => {
    setExporting(true); setError(''); setMessage('')
    try {
      const generated = await executeFiscalExport(request)
      if (generated.length === 1) downloadXml(generated[0].xml, generated[0].fileName)
      else {
        const zip = new JSZip()
        generated.forEach((file) => zip.file(file.fileName, file.xml))
        const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
        downloadBlob(blob, `XML-per-Aruba-${new Date().toISOString().slice(0, 10)}.zip`)
      }
      setExportModal(false); setSelectedIds(new Set())
      setMessage(generated.length === 1 ? 'XML scaricato. Ora caricalo e controllalo in Aruba Fatturazione: il gestionale non lo invia.' : `ZIP con ${generated.length} XML scaricato. Ora caricali e controllali in Aruba Fatturazione: il gestionale non li invia.`)
    } catch (exportError) { setError(exportError instanceof Error ? exportError.message : 'Non è stato possibile generare gli XML.') }
    setExporting(false)
  }

  return <div>
    <div className="management-page-heading"><div><span>Documenti commerciali</span><h1>{pageTitle(documentType)}</h1><p>{pageDescription(documentType)}</p></div><div className="document-editor__top-actions">{documentType === 'proforma' && <button className="management-secondary-button" type="button" disabled={!selectedIds.size || exporting} onClick={() => setExportModal(true)}><ManagementIcon name="download" /> {selectedIds.size > 1 ? `Prepara ZIP (${selectedIds.size})` : 'Prepara XML per Aruba'}</button>}<Link className="management-primary-button" to={`/gestionale/documenti/nuovo?tipo=${documentType ?? 'quote'}`}><ManagementIcon name="plus" /> {newDocumentLabel(documentType)}</Link></div></div>
    {error && <div className="management-alert management-alert--error">{error}</div>}
    {message && <div className="management-alert management-alert--success">{message}</div>}
    {documentType === 'proforma' && <div className="management-alert management-alert--warning"><strong>Le proforma non sono fatture elettroniche e non vengono inviate allo SDI.</strong> Seleziona una o più righe, scarica l’XML o lo ZIP e caricalo in <strong>Aruba Fatturazione</strong>, dove dovrai controllarlo e inviarlo.</div>}
    <section className="management-card">
      <div className="management-toolbar management-toolbar--documents">
        <label className="management-search"><ManagementIcon name="search" /><span className="sr-only">Cerca documento</span><input type="search" placeholder="Cerca numero, cliente, oggetto…" value={search} onChange={(e) => setSearch(e.target.value)} /></label>
      </div>
      {loading ? <div className="management-empty">Caricamento…</div> : filteredDocuments.length === 0 ? <div className="management-empty"><p>{search ? 'Nessun documento corrisponde alla ricerca.' : 'Non hai ancora creato documenti di questo tipo.'}</p>{!search && <Link to={`/gestionale/documenti/nuovo?tipo=${documentType ?? 'quote'}`}>Crea il primo documento</Link>}</div> : <div className="management-table-wrap"><table className="management-table management-table--documents"><thead><tr><th>{documentType === 'proforma' && <input className="management-document-check" type="checkbox" aria-label="Seleziona tutte le proforma" checked={filteredDocuments.length > 0 && filteredDocuments.every((document) => selectedIds.has(document.id))} onChange={(event) => setSelectedIds(event.target.checked ? new Set(filteredDocuments.map((document) => document.id)) : new Set())} />} Tipo</th><th>Data documento</th><th>Nome documento</th><th className="is-check">Approvato</th><th className="is-check">Lavoro svolto</th></tr></thead><tbody>{filteredDocuments.map((document) => <tr key={document.id}>
        <td><div className="management-document-type-cell">{documentType === 'proforma' && <input className="management-document-check" type="checkbox" checked={selectedIds.has(document.id)} aria-label={`Seleziona ${document.number} per l’esportazione XML`} onChange={(event) => toggleSelection(document.id, event.target.checked)} />}<span className={`management-document-type type-${document.type}`}>{document.type === 'quote' ? 'PR' : 'PF'}</span></div></td>
        <td>{formatDate(document.issue_date)}</td>
        <td><Link className="management-table__main" to={`/gestionale/documenti/${document.id}`}>{document.subject || `${documentTypeLabels[document.type]} ${document.number}`}<small>{document.number}{document.clients ? ` · ${clientDisplayName(document.clients)}` : ''}</small></Link></td>
        <td className="is-check"><input className="management-document-check" type="checkbox" checked={Boolean(document.approved)} aria-label={`Segna ${document.number} come approvato`} onChange={(event) => void handleCheck(document, 'approved', event.target.checked)} /></td>
        <td className="is-check"><input className="management-document-check" type="checkbox" checked={Boolean(document.work_completed)} aria-label={`Segna il lavoro di ${document.number} come svolto`} onChange={(event) => void handleCheck(document, 'work_completed', event.target.checked)} /></td>
      </tr>)}</tbody></table></div>}
    </section>
    {exportModal && <FiscalExportModal documents={documents.filter((document) => selectedIds.has(document.id))} busy={exporting} onClose={() => !exporting && setExportModal(false)} onConfirm={(request) => void exportSelected(request)} />}
  </div>
}

function pageTitle(type?: DocumentType) { return type === 'quote' ? 'Preventivi' : type === 'proforma' ? 'Fatture proforma' : 'Documenti' }
function pageDescription(type?: DocumentType) { return type === 'quote' ? 'Tutti i preventivi emessi.' : type === 'proforma' ? 'Documenti non fiscali da trasformare in XML e caricare manualmente su Aruba Fatturazione.' : 'Preventivi e proforma in un’unica lista.' }
function newDocumentLabel(type?: DocumentType) { return type === 'quote' ? 'Nuovo preventivo' : type === 'proforma' ? 'Nuova proforma' : 'Nuovo documento' }
function downloadBlob(blob: Blob, fileName: string) { const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = fileName; document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000) }
