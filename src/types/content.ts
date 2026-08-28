export type IconName =
  | 'arrow'
  | 'building'
  | 'check'
  | 'clock'
  | 'document'
  | 'home'
  | 'layers'
  | 'menu'
  | 'message'
  | 'phone'
  | 'shield'
  | 'spray'
  | 'temperature'
  | 'x'

export interface NavigationItem {
  label: string
  href: string
}

export interface Service {
  slug: string
  title: string
  shortTitle: string
  description: string
  problem: string
  href: string
  icon: IconName
}

export interface Project {
  slug: string
  title: string
  location?: string
  category: 'sottotetti' | 'tetti' | 'residenziale' | 'industriale' | 'condensa'
  buildingType?: string
  problem: string
  solution: string
  description: string
  images: Array<{
    src: string
    alt: string
    width: number
    height: number
  }>
  featured: boolean
}

export interface Faq {
  question: string
  answer: string
  category: 'intervento' | 'tecnologia' | 'preventivo'
}

export interface Testimonial {
  name: string
  projectType: string
  quote: string
  verificationStatus: 'published-on-legacy-site' | 'pending'
}
