import { company } from '../../data/company'
import { ButtonLink } from '../ui/ButtonLink'
import { Icon } from '../ui/Icon'

export function FinalCta() {
  return (
    <section className="final-cta">
      <div className="container final-cta__inner">
        <div>
          <p className="eyebrow">Una prima valutazione, senza giri di parole</p>
          <h2>Raccontaci com’è fatto il tuo tetto. Ti aiutiamo a capire il passo successivo.</h2>
          <p>Indica tipo di edificio, zona da isolare e superficie approssimativa. Se hai delle foto, ancora meglio.</p>
        </div>
        <div className="final-cta__actions">
          <ButtonLink href="/preventivo" showArrow>Richiedi un preventivo</ButtonLink>
          <a href={`tel:${company.phoneHref}`}><Icon name="phone" size={18} /> Parla con un tecnico</a>
        </div>
      </div>
    </section>
  )
}
