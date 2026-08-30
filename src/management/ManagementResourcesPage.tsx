import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useManagementAuth } from './AuthContext'
import { ManagementIcon } from './ManagementIcon'
import { supabase } from './supabase'
import { type ResourceCategory, type ResourceFile } from './types'

const storageBucket = 'management-files'
const maxFileSize = 20 * 1024 * 1024

export function ManagementResourcesPage() {
  const { session } = useManagementAuth()
  const [resources, setResources] = useState<ResourceFile[]>([])
  const [category, setCategory] = useState<'all' | ResourceCategory>('all')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [uploadCategory, setUploadCategory] = useState<ResourceCategory>('technical_sheet')
  const [expiresAt, setExpiresAt] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const loadResources = async () => {
    const { data, error: loadError } = await supabase.from('resource_files').select('*').is('deleted_at',null).order('created_at', { ascending: false })
    if (loadError) setError(resourceErrorMessage(loadError))
    else setResources((data ?? []) as ResourceFile[])
    setLoading(false)
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadResources(), 0)
    return () => window.clearTimeout(timer)
  }, [])

  const filteredResources = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('it')
    return resources.filter((resource) => (category === 'all' || resource.category === category)
      && (!term || [resource.name, resource.description, resource.file_name].some((value) => value.toLocaleLowerCase('it').includes(term))))
  }, [category, resources, search])

  const resetForm = () => {
    setName('')
    setDescription('')
    setUploadCategory('technical_sheet')
    setExpiresAt('')
    setSelectedFile(null)
    setError('')
  }

  const openUpload = () => {
    resetForm()
    setModalOpen(true)
  }

  const handleUpload = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedFile || !session) return
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLocaleLowerCase('it').endsWith('.pdf')) {
      setError('Puoi caricare esclusivamente file PDF.')
      return
    }
    const signature = new TextDecoder().decode(await selectedFile.slice(0, 5).arrayBuffer())
    if (signature !== '%PDF-') {
      setError('Il file selezionato non è un PDF valido.')
      return
    }
    if (selectedFile.size > maxFileSize) {
      setError('Il PDF supera il limite massimo di 20 MB.')
      return
    }

    setUploading(true)
    setError('')
    const safeFileName = selectedFile.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '')
    const filePath = `${session.user.id}/${crypto.randomUUID()}-${safeFileName || 'documento.pdf'}`
    const { error: storageError } = await supabase.storage.from(storageBucket).upload(filePath, selectedFile, {
      contentType: 'application/pdf',
      upsert: false,
    })

    if (storageError) {
      setError('Caricamento non riuscito. Verifica la configurazione del bucket Supabase.')
      setUploading(false)
      return
    }

    const { error: databaseError } = await supabase.from('resource_files').insert({
      name: name.trim(),
      description: description.trim(),
      category: uploadCategory,
      file_name: selectedFile.name,
      file_path: filePath,
      file_size: selectedFile.size,
      expires_at: expiresAt || null,
    })

    if (databaseError) {
      await supabase.storage.from(storageBucket).remove([filePath])
      setError('Il PDF è stato caricato, ma non è stato possibile salvarne la scheda.')
    } else {
      setModalOpen(false)
      resetForm()
      await loadResources()
    }
    setUploading(false)
  }

  const handleDownload = async (resource: ResourceFile) => {
    setDownloadingId(resource.id)
    setError('')
    const { data, error: downloadError } = await supabase.storage.from(storageBucket).download(resource.file_path)
    if (downloadError || !data) {
      setError('Non è stato possibile scaricare il PDF.')
    } else {
      const objectUrl = URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = resource.file_name
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
    }
    setDownloadingId(null)
  }

  const handleDelete = async (resource: ResourceFile) => {
    if (!window.confirm(`Spostare “${resource.name}” nel cestino?`)) return
    setError('')
    const { error: databaseError } = await supabase.from('resource_files').update({deleted_at:new Date().toISOString()}).eq('id', resource.id)
    if (databaseError) setError('Non è stato possibile archiviare il file.')
    else setResources((current) => current.filter((item) => item.id !== resource.id))
  }

  return <div>
    <div className="management-page-heading">
      <div><span>Archivio PDF</span><h1>Schede e certificazioni</h1><p>Schede tecniche e certificazioni sempre disponibili per il download.</p></div>
      <button className="management-primary-button" type="button" onClick={openUpload}><ManagementIcon name="upload" /> Carica PDF</button>
    </div>
    {error && <div className="management-alert management-alert--error">{error}</div>}

    <section className="management-card">
      <div className="management-resource-filters">
        <div className="management-tabs" aria-label="Filtra documenti">
          <button className={category === 'all' ? 'is-active' : undefined} type="button" onClick={() => setCategory('all')}>Tutti</button>
          <button className={category === 'technical_sheet' ? 'is-active' : undefined} type="button" onClick={() => setCategory('technical_sheet')}>Schede tecniche</button>
          <button className={category === 'certification' ? 'is-active' : undefined} type="button" onClick={() => setCategory('certification')}>Certificazioni</button>
        </div>
        <label className="management-search"><ManagementIcon name="search" /><span className="sr-only">Cerca PDF</span><input type="search" placeholder="Cerca per nome o descrizione…" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
      </div>

      {loading ? <div className="management-empty">Caricamento…</div> : filteredResources.length === 0 ? <div className="management-empty"><p>{search || category !== 'all' ? 'Nessun PDF corrisponde ai filtri.' : 'Non hai ancora caricato schede o certificazioni.'}</p>{!search && category === 'all' && <button type="button" onClick={openUpload}>Carica il primo PDF</button>}</div> : <div className="management-table-wrap"><table className="management-table management-table--resources">
        <thead><tr><th>Tipo</th><th>Documento</th><th>Dimensione</th><th>Scadenza</th><th>Caricato il</th><th aria-label="Azioni" /></tr></thead>
        <tbody>{filteredResources.map((resource) => <tr key={resource.id}>
          <td><span className={`management-resource-type type-${resource.category}`}>{resource.category === 'technical_sheet' ? 'ST' : 'CE'}</span></td>
          <td><strong className="management-table__main">{resource.name}</strong>{resource.description && <small>{resource.description}</small>}<small>{resource.file_name}</small></td>
          <td>{formatFileSize(resource.file_size)}</td>
          <td>{resource.expires_at ? new Intl.DateTimeFormat('it-IT').format(new Date(`${resource.expires_at}T12:00:00`)) : '—'}</td>
          <td>{new Intl.DateTimeFormat('it-IT').format(new Date(resource.created_at))}</td>
          <td><div className="management-row-actions"><button type="button" aria-label={`Scarica ${resource.name}`} disabled={downloadingId === resource.id} onClick={() => void handleDownload(resource)}><ManagementIcon name="download" /></button><button className="is-danger" type="button" aria-label={`Elimina ${resource.name}`} onClick={() => void handleDelete(resource)}><ManagementIcon name="trash" /></button></div></td>
        </tr>)}</tbody>
      </table></div>}
    </section>

    {modalOpen && <div className="management-modal" role="dialog" aria-modal="true" aria-labelledby="resource-form-title">
      <button className="management-modal__backdrop" type="button" aria-label="Chiudi" onClick={() => setModalOpen(false)} />
      <div className="management-modal__panel">
        <div className="management-modal__header"><div><span>Archivio PDF</span><h2 id="resource-form-title">Carica un documento</h2></div><button type="button" aria-label="Chiudi" onClick={() => setModalOpen(false)}><ManagementIcon name="x" /></button></div>
        <form className="management-form" onSubmit={(event) => void handleUpload(event)}>
          <label><span>Categoria *</span><select value={uploadCategory} onChange={(event) => setUploadCategory(event.target.value as ResourceCategory)}><option value="technical_sheet">Scheda tecnica</option><option value="certification">Certificazione</option></select></label>
          <label><span>Nome documento *</span><input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Es. Scheda tecnica ICYNENE H2Foam Lite" /></label>
          <label><span>Descrizione</span><textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
          <label><span>Data di scadenza</span><input type="date" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} /></label>
          <label className="management-file-input"><span>File PDF * · massimo 20 MB</span><input required type="file" accept="application/pdf,.pdf" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} /></label>
          {selectedFile && <div className="management-selected-file"><ManagementIcon name="documents" /><div><strong>{selectedFile.name}</strong><span>{formatFileSize(selectedFile.size)}</span></div></div>}
          <div className="management-form__actions"><button className="management-secondary-button" type="button" onClick={() => setModalOpen(false)}>Annulla</button><button className="management-primary-button" disabled={uploading || !selectedFile || !name.trim()}>{uploading ? 'Caricamento…' : 'Carica PDF'}</button></div>
        </form>
      </div>
    </div>}
  </div>
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toLocaleString('it-IT', { maximumFractionDigits: 1 })} MB`
}

function resourceErrorMessage(error: { code?: string; message?: string }) {
  if (error.code === 'PGRST205' || error.code === '42P01') return 'La tabella “resource_files” non esiste nel database. Esegui nel SQL Editor il file supabase/migrations/20260829_operations_and_invoices.sql.'
  if (error.code === '42703') return 'La tabella delle schede non è aggiornata. Esegui la migrazione 20260829_operations_and_invoices.sql.'
  return `Non è stato possibile caricare schede e certificazioni${error.message ? `: ${error.message}` : '.'}`
}
