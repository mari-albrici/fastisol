import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'
import { useEffect, useRef, useState } from 'react'
import { ManagementIcon } from './ManagementIcon'

export function BarcodeScannerModal({ onClose, onDetected }: { onClose: () => void; onDetected: (value: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const detectedRef = useRef(false)
  const [manual, setManual] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const reader = new BrowserMultiFormatReader()
    const start = async () => {
      try {
        if (!videoRef.current) return
        controlsRef.current = await reader.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
          if (!active || !result || detectedRef.current) return
          detectedRef.current = true
          controlsRef.current?.stop()
          onDetected(result.getText().trim())
        })
      } catch {
        if (active) setError('Fotocamera non disponibile. Consenti l’accesso oppure inserisci il codice manualmente.')
      }
    }
    void start()
    return () => { active = false; controlsRef.current?.stop() }
  }, [onDetected])

  const submitManual = () => {
    const value = manual.trim()
    if (!value) return
    detectedRef.current = true
    controlsRef.current?.stop()
    onDetected(value)
  }

  return <div className="management-modal management-scanner" role="dialog" aria-modal="true" aria-labelledby="scanner-title">
    <button className="management-modal__backdrop" type="button" aria-label="Chiudi scanner" onClick={onClose} />
    <div className="management-modal__panel">
      <div className="management-modal__header"><div><span>Magazzino</span><h2 id="scanner-title">Scansiona QR o codice a barre</h2></div><button type="button" onClick={onClose}><ManagementIcon name="x" /></button></div>
      <div className="management-scanner__body">
        <div className="management-scanner__camera"><video ref={videoRef} muted playsInline /><i aria-hidden="true" /></div>
        {error && <div className="management-alert management-alert--warning">{error}</div>}
        <p>Inquadra il codice del lotto o del barile. Sono supportati QR, EAN, Code 128 e i principali formati industriali.</p>
        <div className="management-scanner__manual"><label><span>Codice manuale</span><input value={manual} onChange={(event) => setManual(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); submitManual() } }} placeholder="Es. LOTTO-123 oppure LOTTO=123;BARILE=2" /></label><button className="management-secondary-button" type="button" disabled={!manual.trim()} onClick={submitManual}>Usa codice</button></div>
      </div>
    </div>
  </div>
}
