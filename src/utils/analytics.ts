export const analyticsConfig = {
  gaMeasurementId: import.meta.env.VITE_GA_MEASUREMENT_ID || null,
  gtmContainerId: import.meta.env.VITE_GTM_CONTAINER_ID || null,
  metaPixelId: import.meta.env.VITE_META_PIXEL_ID || null,
} as const

// Analytics providers will be initialized here only after consent handling
// and production tracking identifiers are available.
export function isAnalyticsConfigured() {
  return Object.values(analyticsConfig).some(Boolean)
}
