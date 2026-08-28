import { company } from '../../data/company'
import { ButtonLink } from '../ui/ButtonLink'
import { Icon } from '../ui/Icon'

export function HomeHero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <img
        className="hero__image"
        src="/images/fastisol-isolamento-tetto-legno-hero.webp"
        alt="Tecnico specializzato durante l’applicazione dell’isolamento a spruzzo sotto un tetto in legno"
        width="1536"
        height="1024"
        fetchPriority="high"
      />
      <div className="hero__overlay" />
      <div className="container hero__content">
        <p className="hero__eyebrow">Specialisti in isolamento termico a spruzzo</p>
        <h1 id="hero-title">Il comfort di casa comincia dal tetto.</h1>
        <p className="hero__lead">
          Isoliamo tetti e sottotetti creando uno strato continuo anche negli spazi più difficili da raggiungere. Spesso senza dover aprire la copertura.
        </p>
        <div className="hero__actions">
          <ButtonLink href="/preventivo" showArrow>Richiedi un preventivo</ButtonLink>
          <ButtonLink href="/soluzioni" variant="light">Scopri le soluzioni</ButtonLink>
        </div>
        <div className="hero__contact">
          <span>Preferisci parlarne?</span>
          <a href={`tel:${company.phoneHref}`}><Icon name="phone" size={17} /> {company.phoneDisplay}</a>
        </div>
      </div>
      <div className="container hero__facts" aria-label="Punti di forza Fastisol">
        <div><Icon name="spray" /><span>Applicazione professionale</span></div>
        <div><Icon name="clock" /><span>Interventi rapidi, quando le condizioni lo consentono</span></div>
        <div><Icon name="shield" /><span>Tecnologia ICYNENE / Huntsman</span></div>
      </div>
    </section>
  )
}
