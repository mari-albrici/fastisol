export interface TechnicalSpecification {
  label: string
  value: string | null
  unit?: string
  status: 'verified' | 'requires-verification'
  source?: string
}

export const technology = {
  name: 'ICYNENE / Huntsman open-cell spray foam',
  plainLanguageDescription:
    'Un materiale isolante applicato a spruzzo che si espande sul supporto e crea uno strato continuo, adattandosi alla geometria della superficie.',
  manufacturer: 'Huntsman Building Solutions',
  specifications: [
    {
      label: 'Conducibilità termica dichiarata',
      value: null,
      unit: 'W/(m·K)',
      status: 'requires-verification',
    },
    {
      label: 'Densità',
      value: null,
      unit: 'kg/m³',
      status: 'requires-verification',
    },
    {
      label: 'Reazione al fuoco',
      value: null,
      status: 'requires-verification',
    },
    {
      label: 'Permeabilità al vapore',
      value: null,
      status: 'requires-verification',
    },
  ] satisfies TechnicalSpecification[],
  // TODO: Verify product-specific warranty documentation and conditions.
  warranty: {
    years: null as number | null,
    status: 'requires-verification' as const,
  },
} as const
