import { Link } from 'react-router-dom'
import { Seo } from '../components/layout/Seo'
import { ButtonLink } from '../components/ui/ButtonLink'

export function NotFoundPage() {
  return (
    <>
      <Seo title="Pagina non trovata" description="La pagina richiesta non è disponibile." noIndex />
      <section className="page-hero">
        <div className="container page-hero__inner">
          <div>
            <p className="eyebrow">Errore 404</p>
            <h1>Questa pagina non isola più qui.</h1>
            <p>Il collegamento potrebbe essere cambiato. Torna alla Home o esplora le soluzioni Fastisol.</p>
            <div className="page-hero__actions">
              <ButtonLink href="/">Torna alla Home</ButtonLink>
              <Link className="button button--light" to="/soluzioni">Vedi le soluzioni</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
