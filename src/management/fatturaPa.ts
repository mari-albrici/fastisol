import type { BusinessDocument, Client, DocumentItem, InvoiceSettings, SalesPayment } from './types'

const esc = (value: string | number) => String(value).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c] ?? c)
const money = (value: number) => Number(value).toFixed(2)
const cleanVat = (value: string) => value.toUpperCase().replace(/^IT/, '').replace(/\s/g, '')
const numeric = (value: unknown) => Number(value) || 0
type VatGroup = { rate: number; nature: string; taxable: number; tax: number }
export type FiscalInvoiceData = { number: string; issueDate: string; documentType: string; reason: string; sourceReference?: string }

export function createFatturaPaXml({ document, items, client, settings, payments = [], fiscal }: { document: BusinessDocument; items: DocumentItem[]; client: Client; settings: InvoiceSettings; payments?: SalesPayment[]; fiscal: FiscalInvoiceData }) {
  const lines = items.filter((item) => item.description.trim())
  const missing: string[] = []
  if (document.type !== 'proforma' && document.type !== 'invoice') missing.push('il documento deve essere una proforma')
  if (!lines.length) missing.push('almeno una riga documento')
  if (!settings.denomination.trim()) missing.push('denominazione Fastisol nelle impostazioni')
  if (!settings.vat_number.trim()) missing.push('partita IVA Fastisol nelle impostazioni')
  if ((settings.country || 'IT').toUpperCase() === 'IT' && !settings.tax_code.trim()) missing.push('codice fiscale Fastisol nelle impostazioni')
  if (!settings.fiscal_regime.trim()) missing.push('regime fiscale nelle impostazioni')
  if (!settings.address.trim() || !settings.postal_code.trim() || !settings.city.trim() || !settings.province.trim()) missing.push('sede completa Fastisol nelle impostazioni')
  if (!client.company_name.trim() && !client.contact_name.trim()) missing.push('nome del cliente')
  if (!client.vat_number.trim() && !client.tax_code.trim()) missing.push('partita IVA o codice fiscale del cliente')
  if (!client.address.trim() || !client.postal_code.trim() || !client.city.trim()) missing.push('indirizzo completo del cliente')
  if (numeric(document.other_amount) !== 0) missing.push('trasforma “Altri costi” in una riga fattura esplicita')
  if (!fiscal.number.trim() || fiscal.number.length > 20) missing.push('numero fiscale da 1 a 20 caratteri')
  if (!/^TD\d{2}$/.test(fiscal.documentType)) missing.push('tipo documento fiscale valido')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fiscal.issueDate)) missing.push('data di emissione fiscale valida')
  lines.forEach((line, index) => {
    const rate = numeric(line.tax_rate ?? document.tax_rate)
    const nature = (line.nature_code ?? '').trim()
    if (rate === 0 && !nature) missing.push(`Natura IVA della riga ${index + 1}`)
    if (rate > 0 && nature) missing.push(`rimuovi la Natura IVA dalla riga ${index + 1}`)
  })
  if (document.pension_fund_type && numeric(document.pension_tax_rate) <= 0) missing.push('aliquota IVA della cassa previdenziale maggiore di zero')
  const clientCountry = (client.country || 'IT').toUpperCase()
  const destinationCode = clientCountry === 'IT' ? (client.sdi_code.trim().toUpperCase() || '0000000') : 'XXXXXXX'
  if (destinationCode.length !== 7) missing.push('codice SDI cliente di 7 caratteri')
  if (missing.length) throw new Error(`Per generare l’XML completa: ${missing.join(', ')}.`)

  const globalDiscount = Math.min(100, Math.max(0, numeric(document.discount_percent)))
  const groups = new Map<string, VatGroup>()
  let lineNet = 0
  const detailLines = lines.map((line, index) => {
    const rate = numeric(line.tax_rate ?? document.tax_rate)
    const nature = (line.nature_code ?? '').trim()
    const rowDiscount = Math.min(100, Math.max(0, numeric(line.discount_percent)))
    const gross = numeric(line.quantity) * numeric(line.unit_price)
    const net = gross * (1 - rowDiscount / 100) * (1 - globalDiscount / 100)
    lineNet += net
    const key = `${rate}|${nature}`
    const group = groups.get(key) ?? { rate, nature, taxable: 0, tax: 0 }
    group.taxable += net; group.tax += net * rate / 100; groups.set(key, group)
    const discounts = `${rowDiscount ? `<ScontoMaggiorazione><Tipo>SC</Tipo><Percentuale>${money(rowDiscount)}</Percentuale></ScontoMaggiorazione>` : ''}${globalDiscount ? `<ScontoMaggiorazione><Tipo>SC</Tipo><Percentuale>${money(globalDiscount)}</Percentuale></ScontoMaggiorazione>` : ''}`
    return `<DettaglioLinee><NumeroLinea>${index + 1}</NumeroLinea><Descrizione>${esc(line.description.trim())}</Descrizione><Quantita>${money(numeric(line.quantity))}</Quantita>${line.unit.trim() ? `<UnitaMisura>${esc(line.unit.trim().slice(0, 10))}</UnitaMisura>` : ''}<PrezzoUnitario>${money(numeric(line.unit_price))}</PrezzoUnitario>${discounts}<PrezzoTotale>${money(net)}</PrezzoTotale><AliquotaIVA>${money(rate)}</AliquotaIVA>${nature ? `<Natura>${esc(nature)}</Natura>` : ''}</DettaglioLinee>`
  }).join('')

  const stamp = document.stamp_duty ? Math.max(0, numeric(document.stamp_amount) || 2) : 0
  const withholding = document.withholding_type ? Math.max(0, numeric(document.withholding_amount) || lineNet * numeric(document.withholding_rate) / 100) : 0
  const pension = document.pension_fund_type ? Math.max(0, numeric(document.pension_amount) || lineNet * numeric(document.pension_rate) / 100) : 0
  const pensionTax = pension * numeric(document.pension_tax_rate) / 100
  if (pension > 0) {
    const rate = numeric(document.pension_tax_rate)
    const key = `${rate}|`
    const group = groups.get(key) ?? { rate, nature: '', taxable: 0, tax: 0 }
    group.taxable += pension; group.tax += pensionTax; groups.set(key, group)
  }
  const tax = [...groups.values()].reduce((sum, group) => sum + group.tax, 0)
  const other = Math.max(0, numeric(document.other_amount))
  const documentTotal = lineNet + tax + stamp + pension + other - withholding
  const payable = document.split_payment ? documentTotal - tax : documentTotal
  if (payments.length && Math.abs(payments.reduce((sum, payment) => sum + numeric(payment.amount), 0) - payable) > 0.02) throw new Error('La somma delle scadenze di incasso deve coincidere con il totale da pagare.')

  const sellerVat = cleanVat(settings.vat_number)
  const progressive = String(Math.max(1, numeric(settings.transmission_sequence) || 1)).padStart(5, '0').slice(-10)
  const clientName = client.company_name.trim() || client.contact_name.trim()
  const sellerTaxCode = settings.tax_code.trim() ? `<CodiceFiscale>${esc(settings.tax_code.trim())}</CodiceFiscale>` : ''
  const clientVat = client.vat_number.trim() ? `<IdFiscaleIVA><IdPaese>${esc(clientCountry)}</IdPaese><IdCodice>${esc(cleanVat(client.vat_number))}</IdCodice></IdFiscaleIVA>` : ''
  const clientTaxCode = client.tax_code.trim() && clientCountry === 'IT' ? `<CodiceFiscale>${esc(client.tax_code.trim())}</CodiceFiscale>` : ''
  const pec = destinationCode === '0000000' && client.pec.trim() ? `<PECDestinatario>${esc(client.pec.trim())}</PECDestinatario>` : ''
  const iban = settings.iban.trim() ? `<IBAN>${esc(settings.iban.replace(/\s/g, '').toUpperCase())}</IBAN>` : ''
  const withholdingBlock = document.withholding_type ? `<DatiRitenuta><TipoRitenuta>${esc(document.withholding_type)}</TipoRitenuta><ImportoRitenuta>${money(withholding)}</ImportoRitenuta><AliquotaRitenuta>${money(numeric(document.withholding_rate))}</AliquotaRitenuta><CausalePagamento>${esc((document.withholding_reason || 'A').slice(0, 2))}</CausalePagamento></DatiRitenuta>` : ''
  const stampBlock = document.stamp_duty ? `<DatiBollo><BolloVirtuale>SI</BolloVirtuale><ImportoBollo>${money(stamp)}</ImportoBollo></DatiBollo>` : ''
  const pensionBlock = document.pension_fund_type ? `<DatiCassaPrevidenziale><TipoCassa>${esc(document.pension_fund_type)}</TipoCassa><AlCassa>${money(numeric(document.pension_rate))}</AlCassa><ImportoContributoCassa>${money(pension)}</ImportoContributoCassa><ImponibileCassa>${money(lineNet)}</ImponibileCassa><AliquotaIVA>${money(numeric(document.pension_tax_rate))}</AliquotaIVA>${document.pension_withheld ? '<Ritenuta>SI</Ritenuta>' : ''}</DatiCassaPrevidenziale>` : ''
  const referenceBlock = `${reference('DatiOrdineAcquisto', document.order_reference, document.order_date)}${reference('DatiContratto', document.contract_reference, document.contract_date)}${document.ddt_reference ? `<DatiDDT><NumeroDDT>${esc(document.ddt_reference)}</NumeroDDT>${document.ddt_date ? `<DataDDT>${document.ddt_date}</DataDDT>` : ''}</DatiDDT>` : ''}`
  const summaries = [...groups.values()].map((group) => `<DatiRiepilogo><AliquotaIVA>${money(group.rate)}</AliquotaIVA>${group.nature ? `<Natura>${esc(group.nature)}</Natura>` : ''}<ImponibileImporto>${money(group.taxable)}</ImponibileImporto><Imposta>${money(group.tax)}</Imposta>${group.rate > 0 ? `<EsigibilitaIVA>${document.split_payment ? 'S' : 'I'}</EsigibilitaIVA>` : ''}</DatiRiepilogo>`).join('')
  const paymentRows = (payments.length ? payments : [{ due_date: document.expiry_date, amount: payable }]).map((payment) => `<DettaglioPagamento><ModalitaPagamento>MP05</ModalitaPagamento>${payment.due_date ? `<DataScadenzaPagamento>${payment.due_date}</DataScadenzaPagamento>` : ''}<ImportoPagamento>${money(numeric(payment.amount))}</ImportoPagamento>${iban}</DettaglioPagamento>`).join('')
  const causalText = [fiscal.reason.trim(), fiscal.sourceReference?.trim()].filter(Boolean).join(' · ').slice(0, 200)

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<p:FatturaElettronica versione="FPR12" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:p="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2">
<FatturaElettronicaHeader><DatiTrasmissione><IdTrasmittente><IdPaese>IT</IdPaese><IdCodice>${esc(sellerVat)}</IdCodice></IdTrasmittente><ProgressivoInvio>${progressive}</ProgressivoInvio><FormatoTrasmissione>FPR12</FormatoTrasmissione><CodiceDestinatario>${esc(destinationCode)}</CodiceDestinatario>${pec}</DatiTrasmissione><CedentePrestatore><DatiAnagrafici><IdFiscaleIVA><IdPaese>${esc(settings.country || 'IT')}</IdPaese><IdCodice>${esc(sellerVat)}</IdCodice></IdFiscaleIVA>${sellerTaxCode}<Anagrafica><Denominazione>${esc(settings.denomination.trim())}</Denominazione></Anagrafica><RegimeFiscale>${esc(settings.fiscal_regime)}</RegimeFiscale></DatiAnagrafici><Sede><Indirizzo>${esc(settings.address)}</Indirizzo><CAP>${esc(settings.postal_code)}</CAP><Comune>${esc(settings.city)}</Comune><Provincia>${esc(settings.province)}</Provincia><Nazione>${esc(settings.country || 'IT')}</Nazione></Sede></CedentePrestatore><CessionarioCommittente><DatiAnagrafici>${clientVat}${clientTaxCode}<Anagrafica><Denominazione>${esc(clientName)}</Denominazione></Anagrafica></DatiAnagrafici><Sede><Indirizzo>${esc(client.address)}</Indirizzo><CAP>${esc(client.postal_code)}</CAP><Comune>${esc(client.city)}</Comune>${client.province ? `<Provincia>${esc(client.province)}</Provincia>` : ''}<Nazione>${esc(clientCountry)}</Nazione></Sede></CessionarioCommittente></FatturaElettronicaHeader>
<FatturaElettronicaBody><DatiGenerali><DatiGeneraliDocumento><TipoDocumento>${esc(fiscal.documentType)}</TipoDocumento><Divisa>EUR</Divisa><Data>${fiscal.issueDate}</Data><Numero>${esc(fiscal.number)}</Numero>${withholdingBlock}${stampBlock}${pensionBlock}<ImportoTotaleDocumento>${money(documentTotal)}</ImportoTotaleDocumento>${causalText ? `<Causale>${esc(causalText)}</Causale>` : ''}</DatiGeneraliDocumento>${referenceBlock}</DatiGenerali><DatiBeniServizi>${detailLines}${summaries}</DatiBeniServizi><DatiPagamento><CondizioniPagamento>${payments.length > 1 ? 'TP01' : 'TP02'}</CondizioniPagamento>${paymentRows}</DatiPagamento></FatturaElettronicaBody>
</p:FatturaElettronica>`
  return { xml, fileName: `IT${sellerVat}_${progressive}.xml` }
}

function reference(tag: string, value?: string, date?: string | null) { return value ? `<${tag}><IdDocumento>${esc(value)}</IdDocumento>${date ? `<Data>${date}</Data>` : ''}</${tag}>` : '' }

export function downloadXml(xml: string, fileName: string) {
  const url = URL.createObjectURL(new Blob([xml], { type: 'application/xml;charset=utf-8' }))
  const link = document.createElement('a'); link.href = url; link.download = fileName; document.body.appendChild(link); link.click(); link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
