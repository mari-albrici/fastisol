import { Link } from 'react-router-dom'
import { Seo } from '../components/layout/Seo'
import { ButtonLink } from '../components/ui/ButtonLink'
import { Icon } from '../components/ui/Icon'

interface PlaceholderPageProps {
  title: string
  eyebrow: string
  description: string
}

export function PlaceholderPage({ title, eyebrow, description }: PlaceholderPageProps) {
  return (
    <>
      <Seo
        title={title}
        description={description}
        noIndex
      />
      <section className="page-hero">
        <div className="container page-hero__inner">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p>{description}</p>
            <div className="page-hero__actions">
              <ButtonLink href="/preventivo" showArrow>Richiedi un preventivo</ButtonLink>
              <ButtonLink href="/" variant="light">Torna alla Home</ButtonLink>
            </div>
          </div>
          <div className="page-hero__status">
            <Icon name="document" size={34} />
            <p><strong>Sezione predisposta</strong><span>I contenuti completi saranno sviluppati nella prossima fase.</span></p>
          </div>
        </div>
      </section>
    </>
  )
}

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
