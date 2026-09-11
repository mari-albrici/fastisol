export const maintenancePublicRoutes = ['/'] as const

export const legalPublicRoutes = ['/privacy-policy', '/cookie-policy'] as const

export const indexablePublicRoutes = [
  '/soluzioni',
  '/tecnologia',
  '/azienda',
  '/contatti',
  '/preventivo',
  '/faq',
] as const

export const prerenderPublicRoutes = [
  ...maintenancePublicRoutes,
  ...indexablePublicRoutes,
  ...legalPublicRoutes,
] as const

export const consolidatedPublicRoutes = [
  '/soluzioni/isolamento-sottotetto',
  '/soluzioni/sottotetto-non-abitabile',
  '/soluzioni/sottotetto-calpestabile',
  '/soluzioni/isolamento-tetto',
  '/soluzioni/tetto-in-legno',
  '/soluzioni/tetto-in-cemento',
  '/soluzioni/muricci-e-tavelloni',
  '/soluzioni/isolamento-interno',
  '/soluzioni/edifici-industriali',
  '/soluzioni/condensa',
  '/tecnologia/icynene',
  '/tecnologia/come-funziona',
  '/tecnologia/dati-tecnici',
  '/tecnologia/certificazioni',
] as const
