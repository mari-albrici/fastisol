import type { Project } from '../types/content'

// Phase 1 demo entries. Replace titles and locations with verified Fastisol job data.
export const projects: Project[] = [
  {
    slug: 'sottotetto-muricci-tavelloni',
    title: 'Sottotetto con muricci e tavelloni',
    category: 'sottotetti',
    buildingType: 'Abitazione',
    problem: 'Spazio basso e frammentato, difficile da isolare con pannelli rigidi.',
    solution: 'Applicazione continua sulla soletta, attorno alle murature esistenti.',
    description:
      'Un esempio visivo della tipologia di intervento. Dati, località e fotografie reali del cantiere sono da inserire.',
    images: [
      {
        src: '/images/fastisol-sottotetto-muricci-realizzazione.webp',
        alt: 'Esempio di isolamento continuo nella soletta di un sottotetto con muricci',
        width: 1280,
        height: 919,
      },
    ],
    featured: true,
  },
  {
    slug: 'copertura-industriale-condensa',
    title: 'Copertura industriale in lamiera',
    category: 'industriale',
    buildingType: 'Capannone',
    problem: 'Condensa sulla copertura e comfort interno non uniforme.',
    solution: 'Valutazione del supporto e applicazione all’intradosso della copertura.',
    description:
      'Un esempio visivo della tipologia di intervento. Dati, località e fotografie reali del cantiere sono da inserire.',
    images: [
      {
        src: '/images/fastisol-copertura-industriale-condensa.webp',
        alt: 'Esempio di applicazione isolante all’interno di una copertura industriale',
        width: 1280,
        height: 853,
      },
    ],
    featured: true,
  },
]
