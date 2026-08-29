import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { BrandLogo } from '../components/ui/BrandLogo'
import { useManagementAuth } from './AuthContext'
import { ManagementIcon, type ManagementIconName } from './ManagementIcon'

const navItems: Array<{ to: string; label: string; icon: ManagementIconName; end?: boolean }> = [
  { to: '/gestionale', label: 'Panoramica', icon: 'dashboard', end: true },
  { to: '/gestionale/clienti', label: 'Clienti', icon: 'clients' },
  { to: '/gestionale/lavori', label: 'Lavori', icon: 'jobs' },
  { to: '/gestionale/documenti', label: 'Documenti', icon: 'documents' },
]

export function ManagementLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { signOut } = useManagementAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/gestionale/login', { replace: true })
  }

  return (
    <div className="management-shell">
      <aside className={`management-sidebar${menuOpen ? ' is-open' : ''}`}>
        <div className="management-sidebar__brand">
          <Link to="/gestionale" aria-label="Fastisol gestionale">
            <BrandLogo variant="onDark" />
            <span>Gestionale</span>
          </Link>
          <button className="management-sidebar__close" type="button" aria-label="Chiudi menu" onClick={() => setMenuOpen(false)}>
            <ManagementIcon name="x" />
          </button>
        </div>
        <nav className="management-nav" aria-label="Navigazione gestionale">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? 'is-active' : undefined}>
              <ManagementIcon name={item.icon} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="management-sidebar__footer">
          <Link to="/">Torna al sito pubblico</Link>
          <button type="button" onClick={() => void handleSignOut()}>
            <ManagementIcon name="logout" /> Esci
          </button>
        </div>
      </aside>
      {menuOpen && <button className="management-overlay" aria-label="Chiudi menu" onClick={() => setMenuOpen(false)} />}
      <div className="management-main">
        <header className="management-topbar">
          <button type="button" className="management-menu-button" aria-label="Apri menu" onClick={() => setMenuOpen(true)}>
            <ManagementIcon name="menu" />
          </button>
          <div>
            <p>Area riservata</p>
            <strong>Fastisol</strong>
          </div>
        </header>
        <main className="management-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
