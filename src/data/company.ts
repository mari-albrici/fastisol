export const company = {
  name: 'Fastisol',
  legalName: 'Fastisol di Daniele Gualeni',
  description:
    'Specialisti nell’isolamento termico a spruzzo di tetti, sottotetti e coperture con tecnologia ICYNENE / Huntsman.',
  logos: {
    onDark: {
      src: '/images/fastisol-logo-bianco.png',
      width: 300,
      height: 80,
    },
    onLight: {
      src: '/images/fastisol-logo-blu.png',
      width: 200,
      height: 63,
    },
  },
  phoneDisplay: '+39 340 321 3998',
  phoneHref: '+393403213998',
  whatsappHref: 'https://wa.me/393403213998',
  email: 'info@fastisol.it',
  address: {
    street: 'Via Manifattura 4',
    postalCode: '25047',
    city: 'Darfo Boario Terme',
    province: 'BS',
    country: 'Italia',
  },
  serviceArea:
    'Operiamo principalmente nel Nord Italia; gli interventi in altre aree vengono valutati in base al progetto.',
  vatNumber: '03608650986',
  websiteUrl: import.meta.env.VITE_SITE_URL || 'https://fastisol.it',
  socialLinks: [] as Array<{ label: string; href: string }>,
} as const

export const formattedAddress = `${company.address.street}, ${company.address.postalCode} ${company.address.city} (${company.address.province})`
