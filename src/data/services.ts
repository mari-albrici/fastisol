import type { Service } from '../types/content'

export const services: Service[] = [
  {
    slug: 'isolamento-sottotetto',
    title: 'Isolamento del sottotetto',
    shortTitle: 'Sottotetti',
    description:
      'Creiamo uno strato isolante continuo sulla soletta o sulle falde, anche quando lo spazio è basso o irregolare.',
    problem: 'La casa si surriscalda d’estate e disperde calore dal piano più alto.',
    href: '/soluzioni#soluzione-sottotetto-non-abitabile',
    icon: 'home',
  },
  {
    slug: 'isolamento-tetto',
    title: 'Isolamento del tetto',
    shortTitle: 'Tetti',
    description:
      'Valutiamo la struttura esistente e applichiamo l’isolante dal lato più adatto, limitando le lavorazioni invasive quando possibile.',
    problem: 'Il tetto non isola a sufficienza, ma aprire la copertura sarebbe complesso.',
    href: '/soluzioni#tetto-o-sottotetto',
    icon: 'layers',
  },
  {
    slug: 'edifici-industriali',
    title: 'Coperture industriali',
    shortTitle: 'Industriale',
    description:
      'Interveniamo su capannoni e grandi coperture con un’applicazione progettata sulle condizioni reali dell’edificio.',
    problem: 'Condensa, temperature difficili da gestire o dispersioni su grandi superfici.',
    href: '/soluzioni#soluzione-edifici-industriali',
    icon: 'building',
  },
]

export const problemStatements = [
  {
    title: 'Troppo caldo all’ultimo piano',
    text: 'Il tetto e il sottotetto sono tra le prime parti dell’edificio da valutare quando il caldo entra dall’alto.',
    icon: 'temperature' as const,
  },
  {
    title: 'Calore che si disperde in inverno',
    text: 'Una superficie superiore poco isolata può ridurre il comfort e aumentare il lavoro dell’impianto.',
    icon: 'home' as const,
  },
  {
    title: 'Spazi bassi o difficili da raggiungere',
    text: 'L’applicazione a spruzzo segue geometrie irregolari e raggiunge punti complessi senza posare pannelli uno a uno.',
    icon: 'spray' as const,
  },
  {
    title: 'Condensa sulle coperture',
    text: 'Prima di intervenire analizziamo supporto, uso dell’edificio e condizioni che generano il problema.',
    icon: 'building' as const,
  },
]
