export interface TechnologySpecification {
  label: string
  value: string
  explanation: string
}

export const technologySpecifications: TechnologySpecification[] = [
  {
    label: 'Conducibilità termica dichiarata λD',
    value: '0,037 W/(m·K)',
    explanation: 'Indica quanto calore attraversa il materiale. Il risultato dell’intervento dipende anche dallo spessore applicato e dall’intera struttura.',
  },
  {
    label: 'Resistenza al passaggio del vapore μ',
    value: '2,2',
    explanation: 'Un valore basso indica che il materiale oppone poca resistenza al passaggio del vapore. Non significa che possa sostituire la verifica della condensa.',
  },
  {
    label: 'Permeabilità all’acqua dichiarata',
    value: 'W0,3',
    explanation: 'È una caratteristica di prodotto definita dalla dichiarazione di prestazione; non rende impermeabile una copertura che presenta infiltrazioni.',
  },
  {
    label: 'Reazione al fuoco',
    value: 'Euroclasse E',
    explanation: 'È la classificazione del materiale nudo. Protezioni e finiture devono essere definite in base al luogo di posa e al progetto.',
  },
  {
    label: 'Norma di riferimento',
    value: 'EN 14315-1:2013',
    explanation: 'Riguarda i prodotti isolanti termici in poliuretano espanso rigido applicati a spruzzo e formati direttamente in cantiere.',
  },
]

export const technologyFaqs = [
  {
    question: 'Che cos’è la schiuma isolante a celle aperte?',
    answer: 'È un isolante poliuretanico applicato a spruzzo. Durante la posa si espande e aderisce al supporto, formando uno strato leggero e continuo. La sua struttura interna è simile a una spugna: molte celle comunicano tra loro e consentono il passaggio del vapore.',
  },
  {
    question: 'Celle aperte e celle chiuse sono la stessa cosa?',
    answer: 'No. La schiuma a celle aperte è più leggera, flessibile e permeabile al vapore; quella a celle chiuse è più densa, rigida e oppone maggiore resistenza al vapore. Nessuna è sempre migliore: la scelta dipende da supporto, posizione dell’isolante e obiettivo del lavoro.',
  },
  {
    question: 'Com’è possibile che sia permeabile al vapore ma limiti gli spifferi?',
    answer: 'Aria e vapore non si muovono allo stesso modo. Lo strato continuo può ridurre il passaggio incontrollato di aria attraverso fessure e giunti, mentre la struttura del materiale lascia migrare il vapore per diffusione. La stratigrafia completa deve comunque essere verificata.',
  },
  {
    question: 'La schiuma risolve sempre muffa e condensa?',
    answer: 'No. Muffa e condensa possono dipendere da ponti termici, infiltrazioni, ventilazione insufficiente, umidità interna o errori nella stratigrafia. L’isolamento può contribuire alla soluzione soltanto dopo aver individuato la causa.',
  },
  {
    question: 'Quanto spessore serve per isolare un tetto o un sottotetto?',
    answer: 'Non esiste uno spessore valido per tutti. Si definisce considerando zona climatica, struttura esistente, superficie di posa, obiettivo energetico e prestazione dichiarata del prodotto. Fastisol lo indica dopo la valutazione del caso.',
  },
  {
    question: 'La schiuma a spruzzo si può applicare da soli?',
    answer: 'No. I componenti vengono dosati e miscelati con attrezzature professionali. Durante l’applicazione servono protezione dell’area, ventilazione, dispositivi di protezione individuale e personale formato. Anche tempi di accesso e finiture seguono le istruzioni del produttore.',
  },
  {
    question: 'Su quali superfici può essere applicata?',
    answer: 'La scheda H2Foam Lite E cita, tra gli altri, legno, calcestruzzo, muratura, cartongesso, pannelli truciolari, acciaio e membrane. Il supporto deve però essere stabile, pulito e asciutto; adesione e compatibilità vanno verificate prima del lavoro.',
  },
] as const

export const technologySources = [
  {
    label: 'Huntsman Building Solutions — prodotti e caratteristiche',
    href: 'https://huntsmanbuildingsolutions.com/it-IT/',
  },
  {
    label: 'H2Foam Lite E — scheda tecnica ufficiale',
    href: 'https://manage.huntsmanbuildingsolutions.com/en-GB/sites/en_gb/files/2023-09/HBS_UK_H2Foam_Lite_E-TDS-V9.pdf',
  },
  {
    label: 'H2Foam Lite V6 — dichiarazione di prestazione',
    href: 'https://www.fastisol.it/fastisol_documenti/ICYNENE-H2-Foam-Lite-DOP-20.pdf',
  },
] as const
