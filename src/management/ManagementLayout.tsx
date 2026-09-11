import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { BrandLogo } from '../components/ui/BrandLogo'
import { useManagementAuth } from './AuthContext'
import { ManagementIcon, type ManagementIconName } from './ManagementIcon'
import { supabase } from './supabase'

type NavItem = { to: string; label: string; icon: ManagementIconName; end?: boolean }
const navGroups: Array<{ label?: string; items: NavItem[] }> = [
  { items: [{ to: '/gestionale', label: 'Panoramica', icon: 'dashboard', end: true }] },
  { label: 'Commerciale', items: [
    { to: '/gestionale/fornitori', label: 'Fornitori', icon: 'truck' },
  ] },
  { label: 'Operatività', items: [
    { to: '/gestionale/garanzie', label: 'Garanzie', icon: 'shield' },
  ] },
  { label: 'Magazzino', items: [
    { to: '/gestionale/magazzino', label: 'Lotti e barili', icon: 'warehouse' },
    { to: '/gestionale/scorte', label: 'Scorte e tracciabilità', icon: 'warehouse' },
    { to: '/gestionale/listino', label: 'Listino', icon: 'note' },
  ] },
  { label: 'Archivio e sistema', items: [
    { to: '/gestionale/schede-certificazioni', label: 'Schede e certificazioni', icon: 'folder' },
    { to: '/gestionale/controllo', label: 'Ricerca e controlli', icon: 'search' },
    { to: '/gestionale/impostazioni', label: 'Impostazioni', icon: 'settings' },
    { to: '/gestionale/sicurezza', label: 'Sicurezza e backup', icon: 'shield' },
  ] },
]

export function ManagementLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { signOut } = useManagementAuth()
  const navigate = useNavigate()

  useEffect(()=>{const today=new Date().toISOString().slice(0,10);const key='fastisol-last-auto-snapshot';if(localStorage.getItem(key)===today)return;void supabase.rpc('create_management_snapshot',{p_label:`Snapshot automatico ${today}`}).then(({error})=>{if(!error)localStorage.setItem(key,today)})},[])

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
          {navGroups.slice(0, 2).map((group, index) => <div className="management-nav__section" key={group.label ?? index}>
            {group.label && <span className="management-nav__section-label">{group.label}</span>}
            {group.items.map((item) => <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? 'is-active' : undefined}>
              <ManagementIcon name={item.icon} />{item.label}
            </NavLink>)}
          </div>)}
          {navGroups.slice(2).map((group, index) => <div className="management-nav__section" key={group.label ?? index}>
            {group.label && <span className="management-nav__section-label">{group.label}</span>}
            {group.items.map((item) => <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? 'is-active' : undefined}>
              <ManagementIcon name={item.icon} />{item.label}
            </NavLink>)}
          </div>)}
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
