import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ManagementIcon } from './ManagementIcon'
import { supabase } from './supabase'
import { documentStatusLabels, documentTypeLabels, type BusinessDocument } from './types'
import { formatCurrency, formatDate } from './utils'

interface DashboardData {
  clients: number
  jobs: number
  documents: number
  openValue: number
  recentDocuments: BusinessDocument[]
}

const emptyData: DashboardData = { clients: 0, jobs: 0, documents: 0, openValue: 0, recentDocuments: [] }

export function ManagementDashboardPage() {
  const [data, setData] = useState<DashboardData>(emptyData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadDashboard = async () => {
      const [clientsResult, jobsResult, documentsResult, openResult, recentResult] = await Promise.all([
        supabase.from('clients').select('*', { count: 'exact', head: true }),
        supabase.from('jobs').select('*', { count: 'exact', head: true }),
        supabase.from('documents').select('*', { count: 'exact', head: true }),
        supabase.from('documents').select('total').in('status', ['sent', 'accepted']),
        supabase.from('documents').select('*, clients(company_name, contact_name)').order('issue_date', { ascending: false }).limit(5),
      ])

      const firstError = clientsResult.error || jobsResult.error || documentsResult.error || openResult.error || recentResult.error
      if (firstError) {
        setError('Non è stato possibile caricare la panoramica.')
      } else {
        setData({
          clients: clientsResult.count ?? 0,
          jobs: jobsResult.count ?? 0,
          documents: documentsResult.count ?? 0,
          openValue: (openResult.data ?? []).reduce((sum, document) => sum + Number(document.total), 0),
          recentDocuments: (recentResult.data ?? []) as BusinessDocument[],
        })
      }
      setLoading(false)
    }

    void loadDashboard()
  }, [])

  return (
    <div>
      <div className="management-page-heading">
        <div><span>Panoramica</span><h1>Buon lavoro, Daniele</h1><p>Qui trovi la situazione aggiornata dell’attività.</p></div>
        <Link className="management-primary-button" to="/gestionale/documenti/nuovo"><ManagementIcon name="plus" /> Nuovo documento</Link>
      </div>

      {error && <div className="management-alert management-alert--error">{error}</div>}

      <div className="management-stats" aria-busy={loading}>
        <article><span>Clienti</span><strong>{loading ? '—' : data.clients}</strong><ManagementIcon name="clients" /></article>
        <article><span>Lavori registrati</span><strong>{loading ? '—' : data.jobs}</strong><ManagementIcon name="jobs" /></article>
        <article><span>Documenti</span><strong>{loading ? '—' : data.documents}</strong><ManagementIcon name="documents" /></article>
        <article><span>Valore in sospeso</span><strong>{loading ? '—' : formatCurrency(data.openValue)}</strong><ManagementIcon name="dashboard" /></article>
      </div>

      <section className="management-card">
        <div className="management-card__header">
          <div><h2>Documenti recenti</h2><p>Gli ultimi preventivi e proforma creati.</p></div>
          <Link to="/gestionale/documenti">Vedi tutti <ManagementIcon name="arrow" size={17} /></Link>
        </div>
        {loading ? (
          <div className="management-empty">Caricamento…</div>
        ) : data.recentDocuments.length === 0 ? (
          <div className="management-empty"><p>Non hai ancora creato documenti.</p><Link to="/gestionale/documenti/nuovo">Crea il primo documento</Link></div>
        ) : (
          <div className="management-table-wrap">
            <table className="management-table">
              <thead><tr><th>Documento</th><th>Cliente</th><th>Data</th><th>Stato</th><th className="is-number">Totale</th></tr></thead>
              <tbody>{data.recentDocuments.map((document) => (
                <tr key={document.id}>
                  <td><Link className="management-table__main" to={`/gestionale/documenti/${document.id}`}>{documentTypeLabels[document.type]} {document.number}</Link></td>
                  <td>{document.clients?.company_name || document.clients?.contact_name || '—'}</td>
                  <td>{formatDate(document.issue_date)}</td>
                  <td><span className={`management-badge status-${document.status}`}>{documentStatusLabels[document.status]}</span></td>
                  <td className="is-number"><strong>{formatCurrency(document.total)}</strong></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

