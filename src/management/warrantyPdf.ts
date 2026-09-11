import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'

export interface ExtractedWarrantyData {
  clientName: string
  materialName: string
  quantityText: string
  lotNumber: string
  warrantyNumber: string
  issueDate: string
  expiryDate: string
  supplierName: string
  rawText: string
}

export async function extractWarrantyPdf(file: File): Promise<ExtractedWarrantyData> {
  const options = { data: new Uint8Array(await file.arrayBuffer()), disableWorker: true } as Parameters<typeof getDocument>[0] & { disableWorker: boolean }
  const pdf = await getDocument(options).promise
  const pages: string[] = []
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber)
    const content = await page.getTextContent()
    pages.push(content.items.map((item) => 'str' in item ? item.str : '').join(' '))
  }
  const rawText = pages.join('\n').replace(/[ \t]+/g, ' ').trim()
  return parseWarrantyText(rawText)
}

export function parseWarrantyText(rawText: string): ExtractedWarrantyData {
  const text = rawText.replace(/\r/g, '')
  return {
    clientName: findValue(text, [/cliente\s*[:-]\s*([^\n]+)/i, /intestatario\s*[:-]\s*([^\n]+)/i, /committente\s*[:-]\s*([^\n]+)/i]),
    materialName: findValue(text, [/materiale\s*(?:applicato|utilizzato)?\s*[:-]\s*([^\n]+)/i, /prodotto\s*[:-]\s*([^\n]+)/i]),
    quantityText: findValue(text, [/quantit[aà]\s*[:-]\s*([^\n]+)/i, /superficie\s*(?:applicata|trattata)?\s*[:-]\s*([^\n]+)/i, /mq\s*[:-]\s*([^\n]+)/i]),
    lotNumber: findValue(text, [/numero\s*lotto\s*[:-]\s*([^\n]+)/i, /lotto\s*[:-]\s*([^\n]+)/i]),
    warrantyNumber: findValue(text, [/(?:numero|codice)\s*(?:di\s*)?garanzia\s*[:-]\s*([^\n]+)/i, /garanzia\s*n[.]?\s*[:-]?\s*([^\n]+)/i]),
    issueDate: normalizeDate(findValue(text, [/(?:data\s*(?:di\s*)?emissione|emessa\s*il|data\s*garanzia)\s*[:-]?\s*([^\n]+)/i])),
    expiryDate: normalizeDate(findValue(text, [/(?:data\s*scadenza|scadenza|valida\s*fino\s*al)\s*[:-]?\s*([^\n]+)/i])),
    supplierName: findValue(text, [/fornitore\s*[:-]\s*([^\n]+)/i, /emittente\s*[:-]\s*([^\n]+)/i]),
    rawText,
  }
}

function findValue(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) return cleanValue(match[1])
  }
  return ''
}

function cleanValue(value: string) {
  return value.replace(/\s+/g, ' ').replace(/[|;,]+$/, '').trim()
}

function normalizeDate(value: string) {
  const match = value.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/)
  if (!match) return ''
  const year = match[3].length === 2 ? `20${match[3]}` : match[3]
  return `${year}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`
}
