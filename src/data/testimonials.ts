import type { Testimonial } from '../types/content'

// Testimonials are adapted from the legacy Fastisol website and must be
// re-approved, completed and linked to their original source before production.
export const testimonials: Testimonial[] = [
  {
    name: 'Marco Loregian',
    projectType: 'Sottotetto calpestabile',
    quote:
      'Isolamento della soletta del sottotetto con finitura calpestabile: un lavoro descritto come completo e adatto all’uso dello spazio.',
    verificationStatus: 'published-on-legacy-site',
  },
  {
    name: 'Edoardo Eseni',
    projectType: 'Coibentazione sottotetto',
    quote:
      'Ha segnalato una differenza percepibile di temperatura sia nel periodo invernale sia in quello estivo.',
    verificationStatus: 'published-on-legacy-site',
  },
  {
    name: 'Roberto Congiu',
    projectType: 'Isolamento abitazione',
    quote:
      'Dopo il sopralluogo, due operatori hanno completato l’applicazione nel sottotetto in poche ore.',
    verificationStatus: 'published-on-legacy-site',
  },
]
