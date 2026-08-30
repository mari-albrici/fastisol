import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { company } from '../../data/company'
import { collectServerSeo, type SeoSnapshot } from '../../utils/seoCollector'

interface SeoProps {
  title: string
  description: string
  image?: string
  imageAlt?: string
  imageWidth?: number
  imageHeight?: number
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

export function Seo({
  title,
  description,
  image,
  imageAlt = 'Intervento di isolamento termico Fastisol',
  imageWidth = 1536,
  imageHeight = 1024,
  noIndex = false,
  structuredData,
}: SeoProps) {
  const { pathname } = useLocation()
  const normalizedPath = pathname === '/' ? '/' : pathname.replace(/\/+$/, '')
  const canonicalUrl = new URL(normalizedPath, company.websiteUrl).toString()
  const fullTitle = title.includes('Fastisol') ? title : `${title} | Fastisol`
  const shareImage = new URL(image ?? '/images/fastisol-isolamento-tetto-legno-hero.webp', company.websiteUrl).toString()
  const snapshot: SeoSnapshot = {
    title: fullTitle,
    description,
    canonicalUrl,
    imageUrl: shareImage,
    imageAlt,
    imageWidth,
    imageHeight,
    noIndex,
    structuredData,
  }

  if (typeof document === 'undefined') collectServerSeo(snapshot)

  useEffect(() => {
    document.title = fullTitle
    document.documentElement.lang = 'it'
    setMeta('meta[name="description"]', { name: 'description', content: description })
    setMeta('meta[name="robots"]', { name: 'robots', content: noIndex ? 'noindex, nofollow, noarchive' : 'index, follow, max-image-preview:large' })
    setMeta('meta[property="og:title"]', { property: 'og:title', content: fullTitle })
    setMeta('meta[property="og:description"]', { property: 'og:description', content: description })
    setMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' })
    setMeta('meta[property="og:locale"]', { property: 'og:locale', content: 'it_IT' })
    setMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: company.name })
    setMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl })
    setMeta('meta[property="og:image"]', { property: 'og:image', content: shareImage })
    setMeta('meta[property="og:image:alt"]', { property: 'og:image:alt', content: imageAlt })
    setMeta('meta[property="og:image:width"]', { property: 'og:image:width', content: String(imageWidth) })
    setMeta('meta[property="og:image:height"]', { property: 'og:image:height', content: String(imageHeight) })
    setMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' })
    setMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: fullTitle })
    setMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description })
    setMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: shareImage })
    setMeta('meta[name="twitter:image:alt"]', { name: 'twitter:image:alt', content: imageAlt })

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
  }, [canonicalUrl, description, fullTitle, imageAlt, imageHeight, imageWidth, noIndex, shareImage, structuredData])

  return null
}
