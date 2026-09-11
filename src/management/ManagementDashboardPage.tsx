import { Link } from 'react-router-dom'
import { ManagementIcon } from './ManagementIcon'

const managementAreas = [
  { to: '/gestionale/fornitori', label: 'Fornitori', description: 'Gestisci le anagrafiche dei fornitori.', icon: 'truck' as const },
  { to: '/gestionale/magazzino', label: 'Magazzino', description: 'Controlla lotti e materiali disponibili.', icon: 'warehouse' as const },
  { to: '/gestionale/scorte', label: 'Scorte e tracciabilità', description: 'Segui consumi e movimenti dei materiali.', icon: 'warehouse' as const },
  { to: '/gestionale/listino', label: 'Listino', description: 'Consulta e aggiorna il listino prodotti.', icon: 'note' as const },
  { to: '/gestionale/garanzie', label: 'Garanzie', description: 'Archivia i certificati del materiale applicato.', icon: 'shield' as const },
]

export function ManagementDashboardPage() {
  return (
    <div>
      <div className="management-page-heading">
        <div>
          <span>Area gestionale</span>
          <h1>Buon lavoro, Daniele</h1>
          <p>Accesso rapido alle funzioni disponibili.</p>
        </div>
      </div>
      <section className="management-dashboard-grid">
        {managementAreas.map((area) => (
          <Link className="management-card" to={area.to} key={area.to}>
            <ManagementIcon name={area.icon} size={28} />
            <h2>{area.label}</h2>
            <p>{area.description}</p>
          </Link>
        ))}
      </section>
    </div>
  )
}
