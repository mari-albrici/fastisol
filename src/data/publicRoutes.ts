export const maintenancePublicRoutes = ['/'] as const

export const legalPublicRoutes = [] as const

export const indexablePublicRoutes = [] as const

export const prerenderPublicRoutes = [
  ...maintenancePublicRoutes,
  ...indexablePublicRoutes,
  ...legalPublicRoutes,
] as const

export const consolidatedPublicRoutes = [] as const

