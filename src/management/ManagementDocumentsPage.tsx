import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ManagementIcon } from './ManagementIcon'
import { supabase } from './supabase'
import { documentStatusLabels, documentTypeLabels, type BusinessDocument, type DocumentStatus, type DocumentType } from './types'
import { clientDisplayName, formatCurrency, formatDate } from './utils'

export function ManagementDocumentsPage() {
  const [documents, setDocuments] = useState<BusinessDocument[]>([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | DocumentType>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | DocumentStatus>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data, error: loadError } = await supabase.from('documents').select('*, clients(company_name, contact_name)').order('issue_date', { ascending: false }).order('created_at', { ascending: false })
      if (loadError) setError('Non è stato possibile caricare i documenti.')
      else setDocuments((data ?? []) as BusinessDocument[])
      setLoading(false)
    }
    void load()
  }, [])

  const filteredDocuments = useMemo(() => documents.filter((document) => {
    const term = search.trim().toLocaleLowerCase('it')
    return (typeFilter === 'all' || document.type === typeFilter)
      && (statusFilter === 'all' || document.status === statusFilter)
      && (!term || [document.number, document.subject, document.clients?.company_name ?? '', document.clients?.contact_name ?? ''].some((value) => value.toLocaleLowerCase('it').includes(term)))
  }), [documents, search, statusFilter, typeFilter])

  const handleDelete = async (document: BusinessDocument) => {
    if (!window.confirm(`Eliminare ${documentTypeLabels[document.type].toLocaleLowerCase('it')} ${document.number}?`)) return
    const { error: deleteError } = await supabase.from('documents').delete().eq('id', document.id)
    if (deleteError) setError('Non è stato possibile eliminare il documento.')
    else setDocuments((current) => current.filter((item) => item.id !== document.id))
  }

  return <div>
    <div className="management-page-heading"><div><span>Amministrazione</span><h1>Documenti</h1><p>Preventivi e fatture proforma, dalla bozza alla chiusura.</p></div><Link className="management-primary-button" to="/gestionale/documenti/nuovo"><ManagementIcon name="plus" /> Nuovo documento</Link></div>
    {error && <div className="management-alert management-alert--error">{error}</div>}
    <section className="management-card">
      <div className="management-toolbar management-toolbar--documents">
        <label className="management-search"><ManagementIcon name="search" /><span className="sr-only">Cerca documento</span><input type="search" placeholder="Cerca numero, cliente, oggetto…" value={search} onChange={(e) => setSearch(e.target.value)} /></label>
        <select aria-label="Filtra per tipo" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as 'all' | DocumentType)}><option value="all">Tutti i tipi</option>{Object.entries(documentTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <select aria-label="Filtra per stato" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | DocumentStatus)}><option value="all">Tutti gli stati</option>{Object.entries(documentStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      </div>
      {loading ? <div className="management-empty">Caricamento…</div> : filteredDocuments.length === 0 ? <div className="management-empty"><p>{search || typeFilter !== 'all' || statusFilter !== 'all' ? 'Nessun documento corrisponde ai filtri.' : 'Non hai ancora creato documenti.'}</p>{!search && typeFilter === 'all' && statusFilter === 'all' && <Link to="/gestionale/documenti/nuovo">Crea il primo documento</Link>}</div> : <div className="management-table-wrap"><table className="management-table"><thead><tr><th>Documento</th><th>Cliente</th><th>Oggetto</th><th>Data</th><th>Stato</th><th className="is-number">Totale</th><th aria-label="Azioni" /></tr></thead><tbody>{filteredDocuments.map((document) => <tr key={document.id}>
        <td><Link className="management-table__main" to={`/gestionale/documenti/${document.id}`}>{documentTypeLabels[document.type]}<small>{document.number}</small></Link></td>
        <td>{document.clients ? clientDisplayName(document.clients) : '—'}</td><td>{document.subject || '—'}</td><td>{formatDate(document.issue_date)}</td><td><span className={`management-badge status-${document.status}`}>{documentStatusLabels[document.status]}</span></td><td className="is-number"><strong>{formatCurrency(document.total)}</strong></td><td><div className="management-row-actions"><Link aria-label="Modifica documento" to={`/gestionale/documenti/${document.id}`}><ManagementIcon name="edit" /></Link><button className="is-danger" type="button" aria-label="Elimina documento" onClick={() => void handleDelete(document)}><ManagementIcon name="trash" /></button></div></td>
      </tr>)}</tbody></table></div>}
    </section>
  </div>
}

