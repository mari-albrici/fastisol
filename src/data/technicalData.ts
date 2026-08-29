export interface TechnicalSpecification {
  label: string
  value: string | null
  unit?: string
  status: 'verified' | 'requires-verification'
  source?: string
}

export const technology = {
  name: 'ICYNENE H2Foam Lite / Huntsman a celle aperte',
  plainLanguageDescription:
    'Un materiale isolante applicato a spruzzo che si espande sul supporto e crea uno strato continuo, adattandosi alla geometria della superficie.',
  manufacturer: 'Huntsman Building Solutions',
  specifications: [
    {
      label: 'Conducibilità termica dichiarata',
      value: '0,037',
      unit: 'W/(m·K)',
      status: 'verified',
      source: 'DoP H2Foam Lite V6 n. 0011/09-2020',
    },
    {
      label: 'Densità',
      value: null,
      unit: 'kg/m³',
      status: 'requires-verification',
    },
    {
      label: 'Reazione al fuoco',
      value: 'Euroclasse E',
      status: 'verified',
      source: 'DoP H2Foam Lite V6 n. 0011/09-2020',
    },
    {
      label: 'Permeabilità al vapore',
      value: 'μ 2,2',
      status: 'verified',
      source: 'DoP H2Foam Lite V6 n. 0011/09-2020',
    },
  ] satisfies TechnicalSpecification[],
  // TODO: Verify product-specific warranty documentation and conditions.
  warranty: {
    years: null as number | null,
    status: 'requires-verification' as const,
  },
} as const
