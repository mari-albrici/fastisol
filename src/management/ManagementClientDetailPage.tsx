import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useManagementAuth } from './AuthContext'
import { ManagementIcon } from './ManagementIcon'
import { supabase } from './supabase'
import { documentTypeLabels, type BusinessDocument, type Client, type ClientFile, type ClientInteraction, type InteractionType } from './types'
import { clientDisplayName, formatCurrency, formatDate } from './utils'

const clientFilesBucket = 'client-files'
const maxFileSize = 20 * 1024 * 1024

export function ManagementClientDetailPage() {
  const { clientId } = useParams()
  const { session } = useManagementAuth()
  const [client, setClient] = useState<Client | null>(null)
  const [documents, setDocuments] = useState<BusinessDocument[]>([])
  const [interactions, setInteractions] = useState<ClientInteraction[]>([])
  const [files, setFiles] = useState<ClientFile[]>([])
  const [interactionType, setInteractionType] = useState<InteractionType>('note')
  const [interactionContent, setInteractionContent] = useState('')
  const [fileName, setFileName] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!clientId) return
    const [clientResult, documentsResult, interactionsResult, filesResult] = await Promise.all([
      supabase.from('clients').select('*').is('deleted_at',null).eq('id', clientId).single(),
      supabase.from('documents').select('*').is('deleted_at',null).eq('client_id', clientId).in('type', ['quote', 'proforma']).order('issue_date', { ascending: false }),
      supabase.from('client_interactions').select('*').is('deleted_at',null).eq('client_id', clientId).order('occurred_at', { ascending: false }),
      supabase.from('client_files').select('*').is('deleted_at',null).eq('client_id', clientId).order('created_at', { ascending: false }),
    ])
    if (clientResult.error) setError('Cliente non trovato o non accessibile.')
    else setClient(clientResult.data as Client)
    if (!documentsResult.error) setDocuments((documentsResult.data ?? []) as BusinessDocument[])
    if (!interactionsResult.error) setInteractions((interactionsResult.data ?? []) as ClientInteraction[])
    if (!filesResult.error) setFiles((filesResult.data ?? []) as ClientFile[])
    if (interactionsResult.error || filesResult.error) setError('La scheda cliente richiede la nuova migrazione Supabase.')
    setLoading(false)
  }, [clientId])

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(timer)
  }, [load])

  const addInteraction = async (event: FormEvent) => {
    event.preventDefault(); if (!clientId) return; setSaving(true); setError('')
    const { error: saveError } = await supabase.from('client_interactions').insert({ client_id: clientId, type: interactionType, content: interactionContent.trim() })
    if (saveError) setError('Non è stato possibile salvare la nota.')
    else { setInteractionContent(''); await load() }
    setSaving(false)
  }

  const deleteInteraction = async (interaction: ClientInteraction) => {
    const { error: deleteError } = await supabase.from('client_interactions').update({deleted_at:new Date().toISOString()}).eq('id', interaction.id)
    if (deleteError) setError('Eliminazione non riuscita.')
    else setInteractions((current) => current.filter((item) => item.id !== interaction.id))
  }

  const uploadFile = async (event: FormEvent) => {
    event.preventDefault(); if (!selectedFile || !clientId || !session) return
    if (selectedFile.size > maxFileSize) { setError('Il file supera il limite di 20 MB.'); return }
    setSaving(true); setError('')
    const safeName = selectedFile.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]+/g, '-')
    const path = `${session.user.id}/${clientId}/${crypto.randomUUID()}-${safeName}`
    const { error: uploadError } = await supabase.storage.from(clientFilesBucket).upload(path, selectedFile, { contentType: selectedFile.type, upsert: false })
    if (uploadError) setError('Caricamento non riuscito. Verifica il bucket Supabase.')
    else {
      const { error: databaseError } = await supabase.from('client_files').insert({ client_id: clientId, name: fileName.trim() || selectedFile.name, file_name: selectedFile.name, file_path: path, file_size: selectedFile.size })
      if (databaseError) { await supabase.storage.from(clientFilesBucket).remove([path]); setError('Non è stato possibile registrare l’allegato.') }
      else { setFileName(''); setSelectedFile(null); await load() }
    }
    setSaving(false)
  }

  const downloadFile = async (file: ClientFile) => {
    const { data, error: downloadError } = await supabase.storage.from(clientFilesBucket).download(file.file_path)
    if (downloadError || !data) { setError('Download non riuscito.'); return }
    const url = URL.createObjectURL(data); const link = document.createElement('a'); link.href = url; link.download = file.file_name; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const deleteFile = async (file: ClientFile) => {
    if (!window.confirm(`Eliminare “${file.name}”?`)) return
    await supabase.from('client_files').update({deleted_at:new Date().toISOString()}).eq('id', file.id)
    setFiles((current) => current.filter((item) => item.id !== file.id))
  }

  if (loading) return <div className="management-empty">Caricamento cliente…</div>
  if (!client) return <div className="management-alert management-alert--error">{error || 'Cliente non trovato.'}</div>

  return <div>
    <div className="management-page-heading"><div><Link className="management-back-link" to="/gestionale/clienti">← Clienti</Link><h1>{clientDisplayName(client)}</h1><p>{[client.address, client.postal_code, client.city, client.province && `(${client.province})`].filter(Boolean).join(' ')}</p></div><div className="management-contact-actions">{client.phone && <a className="management-secondary-button" href={`tel:${client.phone}`}><ManagementIcon name="phone" /> Chiama</a>}{client.email && <a className="management-secondary-button" href={`mailto:${client.email}`}><ManagementIcon name="mail" /> Email</a>}</div></div>
    {error && <div className="management-alert management-alert--error">{error}</div>}
    <div className="management-client-summary"><article><span>Telefono</span><strong>{client.phone || '—'}</strong></article><article><span>Email</span><strong>{client.email || '—'}</strong></article><article><span>Partita IVA</span><strong>{client.vat_number || '—'}</strong></article><article><span>Documenti</span><strong>{documents.length}</strong></article></div>

    <div className="management-client-grid">
      <section className="management-card"><div className="management-card__header"><div><h2>Cronologia documenti</h2><p>Preventivi e proforma del cliente.</p></div><Link to={`/gestionale/documenti/nuovo?tipo=quote&cliente=${client.id}`}>Nuovo preventivo</Link></div>{documents.length === 0 ? <div className="management-empty">Nessun documento.</div> : <div className="management-client-timeline">{documents.map((document) => <Link to={`/gestionale/documenti/${document.id}`} key={document.id}><span className={`management-document-type type-${document.type}`}>{document.type === 'quote' ? 'PR' : 'PF'}</span><div><strong>{document.subject || `${documentTypeLabels[document.type]} ${document.number}`}</strong><small>{formatDate(document.issue_date)} · {document.number}</small></div><strong>{formatCurrency(document.total)}</strong></Link>)}</div>}</section>

      <section className="management-card management-client-activity"><div className="management-card__header"><div><h2>Note e telefonate</h2><p>Cronologia dei contatti con il cliente.</p></div></div><form onSubmit={(event) => void addInteraction(event)}><select value={interactionType} onChange={(event) => setInteractionType(event.target.value as InteractionType)}><option value="note">Nota</option><option value="call">Telefonata</option></select><textarea required rows={3} placeholder="Scrivi una nota…" value={interactionContent} onChange={(event) => setInteractionContent(event.target.value)} /><button className="management-primary-button" disabled={saving || !interactionContent.trim()}>Aggiungi</button></form><div className="management-activity-list">{interactions.map((interaction) => <article key={interaction.id}><ManagementIcon name={interaction.type === 'call' ? 'phone' : 'note'} /><div><strong>{interaction.type === 'call' ? 'Telefonata' : 'Nota'}</strong><small>{new Intl.DateTimeFormat('it-IT', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(interaction.occurred_at))}</small><p>{interaction.content}</p></div><button aria-label="Elimina" onClick={() => void deleteInteraction(interaction)}><ManagementIcon name="trash" /></button></article>)}</div></section>

      <section className="management-card management-client-files"><div className="management-card__header"><div><h2>Allegati</h2><p>PDF e immagini collegati al cliente.</p></div></div><form onSubmit={(event) => void uploadFile(event)}><input placeholder="Nome allegato" value={fileName} onChange={(event) => setFileName(event.target.value)} /><input required type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} /><button className="management-primary-button" disabled={saving || !selectedFile}><ManagementIcon name="upload" /> Carica</button></form>{files.length === 0 ? <div className="management-empty">Nessun allegato.</div> : <div className="management-file-list">{files.map((file) => <article key={file.id}><ManagementIcon name="folder" /><div><strong>{file.name}</strong><small>{file.file_name}</small></div><button aria-label="Scarica" onClick={() => void downloadFile(file)}><ManagementIcon name="download" /></button><button className="is-danger" aria-label="Elimina" onClick={() => void deleteFile(file)}><ManagementIcon name="trash" /></button></article>)}</div>}</section>
    </div>
  </div>
}
