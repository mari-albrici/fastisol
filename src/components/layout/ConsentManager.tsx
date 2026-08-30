import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  analyticsEvents,
  applyConsent,
  getStoredConsent,
  initializeConsentDefaults,
  isAnalyticsConfigured,
  trackEvent,
  trackPageView,
  type ConsentPreferences,
} from '../../utils/analytics'

const deniedConsent: ConsentPreferences = { analytics: false, marketing: false }
const acceptedConsent: ConsentPreferences = { analytics: true, marketing: true }

export function ConsentManager() {
  const { pathname, search } = useLocation()
  const configured = isAnalyticsConfigured()
  const [isReady, setIsReady] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [preferences, setPreferences] = useState<ConsentPreferences>(deniedConsent)

  useEffect(() => {
    if (!configured) return
    initializeConsentDefaults()
    const stored = getStoredConsent()
    if (stored) {
      applyConsent(stored, false)
    }
    const readyTimer = window.setTimeout(() => {
      if (stored) setPreferences(stored)
      else setIsOpen(true)
      setIsReady(true)
    }, 0)
    return () => window.clearTimeout(readyTimer)
  }, [configured])

  useEffect(() => {
    if (!configured) return
    const openSettings = () => {
      setShowDetails(true)
      setIsOpen(true)
    }
    window.addEventListener(analyticsEvents.openSettings, openSettings)
    return () => window.removeEventListener(analyticsEvents.openSettings, openSettings)
  }, [configured])

  useEffect(() => {
    if (!isReady || (!preferences.analytics && !preferences.marketing)) return
    const animationFrame = window.requestAnimationFrame(() => trackPageView(`${pathname}${search}`, document.title))
    return () => window.cancelAnimationFrame(animationFrame)
  }, [isReady, pathname, preferences.analytics, preferences.marketing, search])

  useEffect(() => {
    if (!configured) return

    const trackContactClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const anchor = target.closest<HTMLAnchorElement>('a[href]')
      if (!anchor) return
      const href = anchor.href
      if (href.startsWith('tel:')) trackEvent('click_phone', { page_path: pathname })
      else if (href.startsWith('mailto:')) trackEvent('click_email', { page_path: pathname })
      else if (href.includes('wa.me/')) trackEvent('click_whatsapp', { page_path: pathname })
      else if (anchor.pathname === '/preventivo') trackEvent('begin_quote', { page_path: pathname })
    }

    document.addEventListener('click', trackContactClick, true)
    return () => document.removeEventListener('click', trackContactClick, true)
  }, [configured, pathname])

  if (!configured || !isReady || !isOpen) return null

  const save = (nextPreferences: ConsentPreferences) => {
    setPreferences(nextPreferences)
    applyConsent(nextPreferences)
    setIsOpen(false)
    setShowDetails(false)
  }

  return (
    <section className="consent-panel" aria-label="Preferenze cookie" role="region">
      <div className="consent-panel__content">
        <div>
          <p className="consent-panel__title">La tua privacy, senza sorprese.</p>
          <p>
            I cookie necessari mantengono operativo il sito. Con il tuo consenso possiamo misurare le visite e l’efficacia delle campagne. Puoi cambiare scelta in qualsiasi momento.{' '}
            <Link to="/cookie-policy">Cookie policy</Link>
          </p>
        </div>

        {showDetails && (
          <div className="consent-panel__preferences">
            <label><input type="checkbox" checked disabled /> <span><strong>Necessari</strong><small>Sempre attivi per il funzionamento del sito.</small></span></label>
            <label><input type="checkbox" checked={preferences.analytics} onChange={(event) => setPreferences((current) => ({ ...current, analytics: event.target.checked }))} /> <span><strong>Analitici</strong><small>Ci aiutano a capire quali pagine sono utili.</small></span></label>
            <label><input type="checkbox" checked={preferences.marketing} onChange={(event) => setPreferences((current) => ({ ...current, marketing: event.target.checked }))} /> <span><strong>Marketing</strong><small>Misurano le campagne e i contatti generati.</small></span></label>
          </div>
        )}

        <div className="consent-panel__actions">
          <button type="button" className="button button--primary" onClick={() => save(acceptedConsent)}>Accetta tutti</button>
          {showDetails ? (
            <button type="button" className="button consent-panel__secondary" onClick={() => save(preferences)}>Salva preferenze</button>
          ) : (
            <button type="button" className="button consent-panel__secondary" onClick={() => setShowDetails(true)}>Personalizza</button>
          )}
          <button type="button" className="consent-panel__reject" onClick={() => save(deniedConsent)}>Rifiuta non necessari</button>
        </div>
      </div>
    </section>
  )
}
