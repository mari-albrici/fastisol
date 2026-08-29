export interface JourneyLocation {
  id: number
  place: string
  detail: string
  purpose: string
  role: string
  mapX: number
  mapY: number
  labelX: number
  labelY: number
  labelAnchor: 'start' | 'middle' | 'end'
}

export const companyMilestones = [
  {
    year: '1991',
    title: 'Esperienza nel settore edile',
    text: 'Il percorso professionale nasce tra progettazione, direzione lavori e conoscenza diretta degli edifici.',
  },
  {
    year: '2014',
    title: 'Nasce Fastisol',
    text: 'La formazione svolta all’estero prende forma in un’attività dedicata esclusivamente all’isolamento specialistico.',
  },
  {
    year: 'Oggi',
    title: 'Un servizio completo',
    text: 'Valutazione, scelta del ciclo, fornitura, applicazione e assistenza vengono seguite da un unico interlocutore.',
  },
] as const

export const journeyLocations: JourneyLocation[] = [
  {
    id: 1,
    place: 'Valle Camonica',
    detail: 'Darfo Boario Terme, Italia',
    purpose: 'Sede aziendale',
    role: 'Qui ha sede Fastisol e da qui partono le squadre per gli interventi.',
    mapX: 527,
    mapY: 151,
    labelX: 500,
    labelY: 194,
    labelAnchor: 'end',
  },
  {
    id: 2,
    place: 'Pletený Újezd',
    detail: 'Repubblica Ceca',
    purpose: 'Origine del materiale',
    role: 'Sede di Huntsman Building Solutions Central Europe, riferimento per il materiale utilizzato.',
    mapX: 539,
    mapY: 137,
    labelX: 571,
    labelY: 111,
    labelAnchor: 'start',
  },
  {
    id: 3,
    place: 'Kentucky',
    detail: 'Stati Uniti',
    purpose: 'Formazione sul campo',
    role: 'Qui Daniele ha approfondito sul campo le tecniche di applicazione dell’isolamento a spruzzo.',
    mapX: 271,
    mapY: 165,
    labelX: 236,
    labelY: 128,
    labelAnchor: 'middle',
  },
]
