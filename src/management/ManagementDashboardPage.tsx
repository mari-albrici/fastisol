import { Link } from 'react-router-dom'
import { ManagementIcon } from './ManagementIcon'

const quickAccess = [
  { to: '/gestionale/materiali', label: 'Materiali e scorte', description: 'Lotti, kit A+B, consumi FIFO, rettifiche e garanzie PDF.', icon: 'warehouse' as const, tone: 'blue' },
  { to: '/gestionale/garanzie', label: 'Garanzie PDF', description: 'Archivia e consulta i documenti originali del fornitore.', icon: 'shield' as const, tone: 'red' },
  { to: '/gestionale/fornitori', label: 'Fornitori', description: 'Anagrafiche, riferimenti fiscali e contatti operativi.', icon: 'truck' as const, tone: 'green' },
  { to: '/gestionale/schede-certificazioni', label: 'Schede e certificazioni', description: 'Documenti tecnici e certificazioni disponibili.', icon: 'folder' as const, tone: 'amber' },
  { to: '/gestionale/controllo', label: 'Ricerca e controlli', description: 'Cerca dati, movimenti e collegamenti nell’archivio.', icon: 'search' as const, tone: 'red' },
]

export function ManagementDashboardPage() {
  return (
    <div>
      <div className="management-page-heading">
        <div><span>Area riservata · Fastisol</span><h1>Panoramica</h1><p>Un punto di partenza chiaro per seguire materiali, documenti e attività operative.</p></div>
        <div className="management-dashboard-hero__mark" aria-hidden="true"><ManagementIcon name="dashboard" size={42} /></div>
      </div>
      <section className="management-dashboard-section" aria-labelledby="quick-access-title">
        <div className="management-dashboard-section__heading"><div><span>Operatività</span><h2 id="quick-access-title">Accessi rapidi</h2></div><small>5 aree attive</small></div>
        <div className="management-dashboard-grid">
          {quickAccess.map((area) => <Link className={`management-dashboard-card tone-${area.tone}`} to={area.to} key={area.to}>
            <span className="management-dashboard-card__icon"><ManagementIcon name={area.icon} size={24} /></span>
            <span className="management-dashboard-card__body"><strong>{area.label}</strong><span>{area.description}</span></span>
            <ManagementIcon className="management-dashboard-card__arrow" name="arrow" size={18} />
          </Link>)}
        </div>
      </section>

      <section className="management-dashboard-note" aria-label="Nota operativa">
        <div className="management-dashboard-note__icon"><ManagementIcon name="shield" size={20} /></div>
        <div><strong>Archivio e tracciabilità</strong><p>I dati del gestionale restano separati dal sito pubblico e accessibili solo agli utenti autenticati.</p></div>
        <Link to="/gestionale/sicurezza">Apri sicurezza</Link>
      </section>
    </div>
  )
}
