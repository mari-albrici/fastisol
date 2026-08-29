import { FaqSection } from '../components/sections/FaqSection'
import { FinalCta } from '../components/sections/FinalCta'
import { HomeHero } from '../components/sections/HomeHero'
import { ProblemsSection } from '../components/sections/ProblemsSection'
import { ProcessSection } from '../components/sections/ProcessSection'
import { SolutionsSection } from '../components/sections/SolutionsSection'
import { TechnologySection } from '../components/sections/TechnologySection'
import { TrustSection } from '../components/sections/TrustSection'
import { Seo } from '../components/layout/Seo'
import { company, formattedAddress } from '../data/company'
import { faqs } from '../data/faqs'

const homeStructuredData = [
  {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    name: company.name,
    legalName: company.legalName,
    url: company.websiteUrl,
    telephone: company.phoneDisplay,
    description: company.description,
    logo: new URL(company.logos.onLight.src, company.websiteUrl).toString(),
    image: new URL('/images/fastisol-isolamento-tetto-legno-hero.webp', company.websiteUrl).toString(),
    address: {
      '@type': 'PostalAddress',
      streetAddress: company.address.street,
      postalCode: company.address.postalCode,
      addressLocality: company.address.city,
      addressRegion: company.address.province,
      addressCountry: 'IT',
    },
    areaServed: 'Nord Italia',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.slice(0, 4).map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  },
]

export function HomePage() {
  return (
    <>
      <Seo
        title="Fastisol | Isolamento termico di tetti e sottotetti"
        description={`Fastisol isola tetti, sottotetti e coperture con applicazione professionale a spruzzo. Valutazioni e preventivi da ${formattedAddress}.`}
        structuredData={homeStructuredData}
      />
      <HomeHero />
      <ProblemsSection />
      <SolutionsSection />
      <TechnologySection />
      <ProcessSection />
      <TrustSection />
      <FaqSection />
      <FinalCta />
    </>
  )
}
