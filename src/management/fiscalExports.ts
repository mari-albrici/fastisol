import type { BusinessDocument, Client, DocumentItem, InvoiceSettings, SalesPayment } from './types'
import { createFatturaPaXml } from './fatturaPa'
import { supabase } from './supabase'

export type FiscalExportRequest = {
  issueDate: string
  documentType: string
  reason: string
  includeSourceReference: boolean
  assignments: Array<{ documentId: string; fiscalNumber: string }>
}

export type GeneratedFiscalFile = {
  document: BusinessDocument
  fiscalNumber: string
  xml: string
  fileName: string
}

type FullDocument = BusinessDocument & { clients: Client; document_items: DocumentItem[] }

let schemasPromise: Promise<{ invoice: string; signature: string }> | null = null

async function loadSchemas() {
  if (!schemasPromise) {
    const base = import.meta.env.BASE_URL || '/'
    schemasPromise = Promise.all([
      fetch(`${base}xsd/FatturaPA_FPR12_v1.2.3.xsd`).then(assertResponse).then((response) => response.text()),
      fetch(`${base}xsd/xmldsig-core-schema.xsd`).then(assertResponse).then((response) => response.text()),
    ]).then(([invoice, signature]) => ({ invoice, signature }))
  }
  return schemasPromise
}

function assertResponse(response: Response) {
  if (!response.ok) throw new Error('Schema XSD FatturaPA non disponibile nell’applicazione.')
  return response
}

export async function validateFatturaPaXml(xml: string, fileName: string) {
  const [{ validateXML }, schemas] = await Promise.all([import('xmllint-wasm'), loadSchemas()])
  const result = await validateXML({
    xml: { fileName, contents: xml },
    schema: { fileName: 'FatturaPA_FPR12_v1.2.3.xsd', contents: schemas.invoice },
    preload: { fileName: 'xmldsig-core-schema.xsd', contents: schemas.signature },
  })
  if (!result.valid) {
    const details = result.errors.slice(0, 6).map((error) => `${error.loc?.lineNumber ? `riga ${error.loc.lineNumber}: ` : ''}${error.message}`).join(' — ')
    throw new Error(`XML non conforme allo schema FatturaPA 1.2.3: ${details || 'errore XSD non specificato'}`)
  }
}

export async function executeFiscalExport(request: FiscalExportRequest): Promise<GeneratedFiscalFile[]> {
  const ids = request.assignments.map((assignment) => assignment.documentId)
  if (!ids.length) throw new Error('Seleziona almeno una proforma.')
  const [settingsResult, documentsResult, paymentsResult] = await Promise.all([
    supabase.from('invoice_settings').select('*').maybeSingle(),
    supabase.from('documents').select('*, clients(*), document_items(*)').in('id', ids).eq('type', 'proforma'),
    supabase.from('sales_payments').select('*').in('document_id', ids).order('due_date'),
  ])
  if (settingsResult.error || !settingsResult.data) throw new Error('Completa e salva prima i dati XML per Aruba nella sezione Impostazioni.')
  if (documentsResult.error || (documentsResult.data ?? []).length !== ids.length) throw new Error('Non è stato possibile caricare tutte le proforma selezionate.')
  if (paymentsResult.error) throw new Error('Non è stato possibile caricare le scadenze di pagamento.')

  const settings = settingsResult.data as InvoiceSettings
  const byId = new Map((documentsResult.data ?? []).map((row) => [row.id, row as FullDocument]))
  const generated: GeneratedFiscalFile[] = []
  const records: Record<string, unknown>[] = []

  for (let index = 0; index < request.assignments.length; index += 1) {
    const assignment = request.assignments[index]
    const row = byId.get(assignment.documentId)
    if (!row?.clients) throw new Error(`La proforma selezionata non ha un cliente valido.`)
    const document = normalizeDocument(row)
    const documentPayments = (paymentsResult.data ?? []).filter((payment) => payment.document_id === document.id).map((payment) => ({ ...payment, amount: Number(payment.amount) })) as SalesPayment[]
    const sourceReference = request.includeSourceReference ? `Rif. proforma ${document.number} del ${document.issue_date}` : ''
    const transmissionProgressive = String(Number(settings.transmission_sequence) + index).padStart(5, '0')
    const { xml, fileName } = createFatturaPaXml({
      document,
      items: document.document_items ?? [],
      client: document.clients,
      settings: { ...settings, transmission_sequence: Number(settings.transmission_sequence) + index },
      payments: documentPayments,
      fiscal: { number: assignment.fiscalNumber, issueDate: request.issueDate, documentType: request.documentType, reason: request.reason, sourceReference },
    })
    await validateFatturaPaXml(xml, fileName)
    const xmlSha256 = await sha256(xml)
    generated.push({ document, fiscalNumber: assignment.fiscalNumber, xml, fileName })
    records.push({
      source_document_id: document.id,
      fiscal_number: assignment.fiscalNumber,
      issue_date: request.issueDate,
      document_type: request.documentType,
      reason: request.reason,
      source_reference: sourceReference,
      transmission_progressive: transmissionProgressive,
      xml_file_name: fileName,
      xml_size: new Blob([xml]).size,
      xml_sha256: xmlSha256,
      xml_snapshot: xml,
      source_snapshot: { document, client: document.clients, items: document.document_items ?? [], payments: documentPayments, invoice_settings: settings, fiscal: { ...request, assignments: [assignment] } },
    })
  }

  const { error: recordError } = await supabase.rpc('record_fiscal_exports', { p_exports: records })
  if (recordError) {
    if (recordError.message.includes('record_fiscal_exports')) throw new Error('Esegui la nuova migrazione Supabase per numerazione e storico fiscale, poi riprova.')
    throw new Error(recordError.message || 'Non è stato possibile registrare lo storico fiscale immutabile.')
  }

  const { data: userData } = await supabase.auth.getUser()
  for (const file of generated) {
    if (userData.user) {
      const blob = new Blob([file.xml], { type: 'application/xml' })
      const path = `${userData.user.id}/${crypto.randomUUID()}-${file.fileName}`
      const uploaded = await supabase.storage.from('sdi-files').upload(path, blob, { contentType: 'application/xml' })
      await supabase.from('electronic_invoice_events').insert({
        document_id: file.document.id,
        status: 'exported',
        event_at: new Date().toISOString(),
        reason: `Fattura fiscale ${file.fiscalNumber}: XML validato XSD 1.2.3 e archiviato; non inviato allo SDI. Da controllare e caricare in Aruba Fatturazione.`,
        file_name: file.fileName,
        file_path: uploaded.error ? null : path,
        file_type: 'application/xml',
        file_size: blob.size,
      })
    }
    await supabase.from('documents').update({ electronic_status: 'exported' }).eq('id', file.document.id)
  }
  return generated
}

function normalizeDocument(row: FullDocument): FullDocument {
  return {
    ...row,
    subtotal: Number(row.subtotal), tax_amount: Number(row.tax_amount), other_amount: Number(row.other_amount), total: Number(row.total),
    document_items: (row.document_items ?? []).map((item) => ({ ...item, quantity: Number(item.quantity), unit_price: Number(item.unit_price), tax_rate: Number(item.tax_rate), discount_percent: Number(item.discount_percent) })),
  }
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}
