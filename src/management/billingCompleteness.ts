type BillingParty = {
  company_name: string
  contact_name: string
  tax_code: string
  vat_number: string
  address: string
  postal_code: string
  city: string
  province: string
  country: string
}

export function customerBillingMissing(party: BillingParty) {
  const missing = commonMissing(party)
  if (!party.vat_number.trim() && !party.tax_code.trim()) missing.push('Partita IVA o codice fiscale')
  return missing
}

export function supplierBillingMissing(party: BillingParty & { fiscal_regime: string }) {
  const missing = commonMissing(party)
  if (!party.vat_number.trim()) missing.push('Partita IVA / identificativo IVA')
  if ((party.country || 'IT').toUpperCase() === 'IT' && !party.tax_code.trim()) missing.push('Codice fiscale')
  if (!party.fiscal_regime.trim()) missing.push('Regime fiscale')
  return missing
}

function commonMissing(party: BillingParty) {
  const missing: string[] = []
  if (!party.company_name.trim() && !party.contact_name.trim()) missing.push('Denominazione o nome e cognome')
  if (!party.address.trim()) missing.push('Indirizzo')
  if (!party.postal_code.trim()) missing.push('CAP')
  if (!party.city.trim()) missing.push('Comune')
  if (!party.country.trim()) missing.push('Nazione')
  if ((party.country || 'IT').toUpperCase() === 'IT' && !party.province.trim()) missing.push('Provincia')
  return missing
}
