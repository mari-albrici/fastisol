import { faqs } from '../../data/faqs'
import { Accordion } from '../ui/Accordion'
import { ButtonLink } from '../ui/ButtonLink'
import { SectionHeading } from '../ui/SectionHeading'

export function FaqSection() {
  return (
    <section className="section faq-section">
      <div className="container faq-grid">
        <div>
          <SectionHeading
            eyebrow="Domande prima di iniziare"
            title="Risposte chiare, senza semplificazioni rischiose."
            description="Tempi, accessibilità e soluzione dipendono dall’edificio. Qui trovi le prime risposte; per il tuo caso serve una valutazione dedicata."
          />
          <ButtonLink href="/faq" variant="secondary" showArrow>Leggi tutte le FAQ</ButtonLink>
        </div>
        <div className="accordion-list">
          {faqs.slice(0, 4).map((faq) => <Accordion key={faq.question} question={faq.question} answer={faq.answer} />)}
        </div>
      </div>
    </section>
  )
}
