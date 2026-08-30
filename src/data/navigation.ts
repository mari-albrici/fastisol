import type { NavigationItem } from '../types/content'

export const navigationItems: NavigationItem[] = [
  { label: 'Soluzioni', href: '/soluzioni' },
  { label: 'Tecnologia', href: '/tecnologia' },
  { label: 'Azienda', href: '/azienda' },
  { label: 'Contatti', href: '/contatti' },
]

export const footerSolutionLinks: NavigationItem[] = [
  { label: 'Isolamento sottotetto', href: '/soluzioni#soluzione-sottotetto-non-abitabile' },
  { label: 'Isolamento tetto', href: '/soluzioni#tetto-o-sottotetto' },
  { label: 'Tetti in legno', href: '/soluzioni#soluzione-tetto-in-legno' },
  { label: 'Muricci e tavelloni', href: '/soluzioni#soluzione-muricci-e-tavelloni' },
  { label: 'Edifici industriali', href: '/soluzioni#soluzione-edifici-industriali' },
]
