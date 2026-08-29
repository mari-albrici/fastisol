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

export interface Faq {
  question: string
  answer: string
  category: 'intervento' | 'tecnologia' | 'preventivo'
}

export interface Testimonial {
  name: string
  projectType: string
  stars: number
  quote: string
  verificationStatus: 'published-on-legacy-site' | 'pending'
}
