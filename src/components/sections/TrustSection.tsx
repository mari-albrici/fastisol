import { testimonials } from '../../data/testimonials'
import { Icon } from '../ui/Icon'
import { SectionHeading } from '../ui/SectionHeading'

export function TrustSection() {
  return (
    <section className="section section--warm trust-section">
      <div className="container trust-grid">
        <div>
          <SectionHeading
            eyebrow="Competenza verificabile"
            title="Tecnica, applicazione e contatto diretto."
            description="Parli con chi conosce il sistema e segue il lavoro, dalla prima valutazione alla posa. Documentazione e dati prestazionali troveranno spazio nella sezione tecnica, sempre collegati alle fonti ufficiali."
          />
          <div className="trust-points">
            <div><Icon name="document" /><p><strong>Dati tecnici</strong><span>Specifiche solo da schede ufficiali verificate</span></p></div>
            <div><Icon name="shield" /><p><strong>Garanzia trasparente</strong><span>Termini e condizioni indicati senza promesse generiche</span></p></div>
          </div>
        </div>

        <div className="testimonial-stack">
          {testimonials.map((testimonial) => (
            <figure key={testimonial.name}>
              <p className="testimonial-summary">{testimonial.quote}</p>
              <figcaption><strong>{testimonial.name}</strong><span>{testimonial.projectType}</span></figcaption>
            </figure>
          ))}
          <p className="testimonial-note">Testimonianze riprese dal sito Fastisol precedente, da riconfermare in versione integrale prima della pubblicazione.</p>
        </div>
      </div>
    </section>
  )
}
