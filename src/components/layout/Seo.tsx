import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { company } from '../../data/company'

interface SeoProps {
  title: string
  description: string
  image?: string
  noIndex?: boolean
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>>
}

function setMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector)

  if (!element) {
    element = document.createElement('meta')
    document.head.appendChild(element)
  }

  Object.entries(attributes).forEach(([key, value]) => element?.setAttribute(key, value))
}

export function Seo({ title, description, image, noIndex = false, structuredData }: SeoProps) {
  const { pathname } = useLocation()

  useEffect(() => {
    const canonicalUrl = new URL(pathname, company.websiteUrl).toString()
    const fullTitle = title.includes('Fastisol') ? title : `${title} | Fastisol`
    const shareImage = new URL(image ?? '/images/fastisol-isolamento-tetto-legno-hero.webp', company.websiteUrl).toString()

    document.title = fullTitle
    document.documentElement.lang = 'it'
    setMeta('meta[name="description"]', { name: 'description', content: description })
    setMeta('meta[name="robots"]', { name: 'robots', content: noIndex ? 'noindex, nofollow' : 'index, follow' })
    setMeta('meta[property="og:title"]', { property: 'og:title', content: fullTitle })
    setMeta('meta[property="og:description"]', { property: 'og:description', content: description })
    setMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' })
    setMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl })
    setMeta('meta[property="og:image"]', { property: 'og:image', content: shareImage })
    setMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' })

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = canonicalUrl

    document.getElementById('page-structured-data')?.remove()
    if (structuredData) {
      const script = document.createElement('script')
      script.id = 'page-structured-data'
      script.type = 'application/ld+json'
      script.text = JSON.stringify(structuredData)
      document.head.appendChild(script)
    }
  }, [description, image, noIndex, pathname, structuredData, title])

  return null
}
