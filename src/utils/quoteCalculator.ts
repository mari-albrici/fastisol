export interface QuoteInput {
  buildingType?: string
  areaToInsulate?: string
  roofType?: string
  approximateSurfaceM2?: number
  currentCondition?: string
  mainProblem?: string
  location?: string
}

export interface QuoteEstimate {
  status: 'requires-rules' | 'requires-technical-review'
  estimatedPrice: null
  message: string
}

/**
 * Pricing is intentionally disabled during Phase 1.
 * Add only verified commercial rules approved by Fastisol.
 */
export function calculateQuote(input: QuoteInput): QuoteEstimate {
  void input
  return {
    status: 'requires-rules',
    estimatedPrice: null,
    message: 'I dati sono pronti per una valutazione personalizzata Fastisol.',
  }
}
