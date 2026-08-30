export interface SeoSnapshot {
  title: string
  description: string
  canonicalUrl: string
  imageUrl: string
  imageAlt: string
  imageWidth: number
  imageHeight: number
  noIndex: boolean
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>>
}

let serverSeoCollector: ((snapshot: SeoSnapshot) => void) | null = null

export function collectServerSeo(snapshot: SeoSnapshot) {
  serverSeoCollector?.(snapshot)
}

export function setServerSeoCollector(collector: ((snapshot: SeoSnapshot) => void) | null) {
  serverSeoCollector = collector
}
