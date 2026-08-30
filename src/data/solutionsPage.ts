import type { IconName } from '../types/content'

export interface SolutionCategory {
  id: string
  title: string
  shortTitle: string
  problem: string
  description: string
  idealFor: string
  icon: IconName
}

export const solutionCategories: SolutionCategory[] = [
  {
    id: 'soluzione-sottotetto-non-abitabile',
    title: 'Isolamento del sottotetto non abitabile',
    shortTitle: 'Sottotetto non abitabile',
    problem: 'L’ultimo piano è caldo d’estate e disperde calore in inverno.',
    description: 'Lo strato isolante viene valutato sulla soletta che separa la casa riscaldata dal vano sottotetto non utilizzato.',
    idealFor: 'Sottotetti visitati solo per manutenzione o accesso agli impianti.',
    icon: 'home',
  },
  {
    id: 'soluzione-sottotetto-calpestabile',
    title: 'Isolamento del sottotetto calpestabile',
    shortTitle: 'Sottotetto calpestabile',
    problem: 'Lo spazio deve rimanere accessibile o utilizzabile come deposito.',
    description: 'Isolamento e piano di passaggio vengono progettati insieme, evitando che il calpestio schiacci o interrompa lo strato.',
    idealFor: 'Sottotetti usati come ripostiglio o con impianti da raggiungere.',
    icon: 'layers',
  },
  {
    id: 'soluzione-muricci-e-tavelloni',
    title: 'Sottotetto con muricci e tavelloni',
    shortTitle: 'Muricci e tavelloni',
    problem: 'Il vano è basso, frammentato e difficile da raggiungere con pannelli.',
    description: 'L’applicazione a spruzzo segue la soletta e i risvolti attorno ai muretti, dopo aver verificato accesso e condizioni del supporto.',
    idealFor: 'Coperture a nido d’ape diffuse negli edifici italiani del Novecento.',
    icon: 'spray',
  },
  {
    id: 'soluzione-tetto-in-legno',
    title: 'Isolamento del tetto in legno',
    shortTitle: 'Tetto in legno',
    problem: 'La mansarda o il locale sotto le falde è utilizzato e poco confortevole.',
    description: 'Si studia l’applicazione tra o sotto gli elementi della copertura, preservando struttura e dettagli che devono restare ispezionabili.',
    idealFor: 'Mansarde, recuperi di sottotetto e tetti con travi in legno.',
    icon: 'home',
  },
  {
    id: 'soluzione-tetto-in-cemento',
    title: 'Isolamento del tetto in cemento o laterizio',
    shortTitle: 'Tetto in cemento',
    problem: 'La copertura esistente disperde ma intervenire dall’esterno sarebbe complesso.',
    description: 'Supporto, umidità e stratigrafia vengono controllati prima di definire un eventuale intervento dal lato interno.',
    idealFor: 'Falde e solai in laterocemento, cemento o muratura stabile.',
    icon: 'building',
  },
  {
    id: 'soluzione-isolamento-interno',
    title: 'Isolamento interno di pareti e soffitti',
    shortTitle: 'Pareti e soffitti',
    problem: 'Non è possibile intervenire sulla facciata o sul lato esterno.',
    description: 'Lo strato isolante viene inserito in un sistema interno completo, verificando ponti termici, passaggio del vapore e finitura.',
    idealFor: 'Riqualificazioni interne, controsoffitti e locali sopra spazi freddi.',
    icon: 'layers',
  },
  {
    id: 'soluzione-edifici-industriali',
    title: 'Isolamento di coperture industriali',
    shortTitle: 'Edifici industriali',
    problem: 'Grandi superfici, caldo, freddo o condensa rendono difficile usare il fabbricato.',
    description: 'L’intervento viene dimensionato sull’attività svolta, sul tipo di lamiera o struttura e sulle condizioni ambientali reali.',
    idealFor: 'Capannoni, laboratori, magazzini, attività commerciali e agricole.',
    icon: 'building',
  },
  {
    id: 'soluzione-condensa',
    title: 'Analisi dei problemi di condensa',
    shortTitle: 'Condensa',
    problem: 'Compaiono gocce, macchie o muffa e non è chiara la causa.',
    description: 'Prima di proporre l’isolamento si distinguono condensa superficiale, condensa interstiziale, infiltrazioni e ventilazione insufficiente.',
    idealFor: 'Abitazioni, sottotetti e coperture metalliche con umidità visibile.',
    icon: 'shield',
  },
]

export const exampleScenarios = [
  {
    title: 'Sottotetto non abitabile con passaggio tecnico',
    category: 'Scenario residenziale',
    image: '/images/fastisol-esempio-sottotetto-placeholder.webp',
    imageAlt: 'Esempio illustrativo di sottotetto non abitabile con isolamento sulla soletta e passerella in legno',
    problem: 'La soletta sopra l’ultimo piano separa l’abitazione da un vano freddo usato solo per raggiungere antenna e impianti.',
    assessment: 'Conviene valutare l’isolamento sul pavimento del sottotetto, mantenendo un percorso rialzato per la manutenzione.',
  },
  {
    title: 'Falde in legno sopra uno spazio utilizzato',
    category: 'Scenario mansarda',
    image: '/images/fastisol-esempio-tetto-legno-placeholder.webp',
    imageAlt: 'Esempio illustrativo di isolamento a spruzzo applicato sotto le falde di un tetto in legno',
    problem: 'Lo spazio sotto il tetto diventerà una mansarda e deve rientrare nel volume riscaldato della casa.',
    assessment: 'Si valuta uno strato continuo sulle falde, coordinato con struttura, impianti, verifica del vapore e finitura interna.',
  },
  {
    title: 'Copertura metallica di un laboratorio',
    category: 'Scenario industriale',
    image: '/images/fastisol-esempio-copertura-industriale-placeholder.webp',
    imageAlt: 'Esempio illustrativo dell’interno di una copertura industriale isolata a spruzzo',
    problem: 'L’ampia copertura rende instabile la temperatura interna e può presentare fenomeni di condensa.',
    assessment: 'Il ciclo va scelto dopo aver considerato supporto, attività, umidità prodotta, ventilazione e requisiti di reazione al fuoco.',
  },
] as const

export const solutionsFaqs = [
  {
    question: 'È meglio isolare il tetto o il pavimento del sottotetto?',
    answer: 'Dipende da quale spazio deve restare dentro il volume riscaldato. Se il sottotetto non è abitato né usato con continuità, spesso si valuta la soletta sopra l’ultimo piano. Se la mansarda è abitata, si considerano invece le falde del tetto.',
  },
  {
    question: 'Un sottotetto isolato può rimanere calpestabile?',
    answer: 'Sì, ma isolamento e calpestio devono essere progettati insieme. Si può prevedere una passerella per gli impianti oppure una superficie più estesa, evitando di comprimere o interrompere lo strato isolante.',
  },
  {
    question: 'Bisogna togliere tegole o demolire il tetto?',
    answer: 'Non sempre. In molti casi l’accesso dal sottotetto permette di intervenire dall’interno. La fattibilità dipende però da struttura, stato del supporto, spazio disponibile e posizione corretta dell’isolante.',
  },
  {
    question: 'Come si sceglie lo spessore dell’isolamento?',
    answer: 'Lo spessore non si sceglie con una misura standard. Occorre considerare zona climatica, struttura esistente, prestazione del prodotto, obiettivo energetico e verifiche igrometriche.',
  },
  {
    question: 'La schiuma a spruzzo è adatta a qualsiasi edificio?',
    answer: 'No. Supporti instabili o bagnati, infiltrazioni, dettagli non ispezionabili e stratigrafie non verificate richiedono prima altri interventi o una soluzione differente. Fastisol valuta il caso prima di proporre la posa.',
  },
  {
    question: 'Da cosa dipende il costo dell’intervento?',
    answer: 'Incidono superficie, spessore, accessibilità, protezioni necessarie, preparazione del supporto, eventuale calpestio e finiture. Foto e misure permettono una prima valutazione; per i casi complessi può servire un sopralluogo.',
  },
  {
    question: 'Fastisol esegue interventi in tutta Italia?',
    answer: 'Fastisol opera principalmente nel Nord Italia e valuta lavori nelle altre regioni in base a dimensione, tipologia e organizzazione del progetto. La fattibilità geografica viene confermata durante il primo contatto.',
  },
] as const
