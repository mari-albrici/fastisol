export const company = {
  name: 'Fastisol',
  legalName: 'Fastisol di Daniele Gualeni',
  description:
    'Specialisti nell’isolamento termico a spruzzo di tetti, sottotetti e coperture con tecnologia ICYNENE / Huntsman.',
  phoneDisplay: '+39 340 321 3998',
  phoneHref: '+393403213998',
  whatsappHref: 'https://wa.me/393403213998',
  // TODO: Add the verified business email before production.
  email: null as string | null,
  address: {
    street: 'Via Manifattura 4',
    postalCode: '25047',
    city: 'Darfo Boario Terme',
    province: 'BS',
    country: 'Italia',
  },
  serviceArea:
    'Operiamo principalmente nel Nord Italia; gli interventi in altre aree vengono valutati in base al progetto.',
  // TODO: Add VAT number and complete legal data after verification.
  vatNumber: null as string | null,
  websiteUrl: import.meta.env.VITE_SITE_URL || 'https://fastisol.it',
  socialLinks: [] as Array<{ label: string; href: string }>,
} as const

export const formattedAddress = `${company.address.street}, ${company.address.postalCode} ${company.address.city} (${company.address.province})`
