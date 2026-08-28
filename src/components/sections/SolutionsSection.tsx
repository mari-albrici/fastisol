import { services } from '../../data/services'
import { ButtonLink } from '../ui/ButtonLink'
import { Icon } from '../ui/Icon'
import { SectionHeading } from '../ui/SectionHeading'

export function SolutionsSection() {
  return (
    <section className="section section--warm solutions-section">
      <div className="container">
        <div className="section-title-row">
          <SectionHeading
            eyebrow="Soluzioni su misura"
            title="Il punto giusto in cui isolare cambia da edificio a edificio."
            description="Dalla soletta del sottotetto alla falda in legno, fino alle grandi coperture: scegliamo il ciclo in base alla struttura e all’uso degli spazi."
          />
          <ButtonLink href="/soluzioni" variant="text" showArrow>Vedi tutte le soluzioni</ButtonLink>
        </div>

        <div className="service-grid">
          {services.map((service) => (
            <article className="service-card" key={service.slug}>
              <div className="service-card__icon"><Icon name={service.icon} size={29} /></div>
              <p className="service-card__problem">{service.problem}</p>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              <ButtonLink href={service.href} variant="text" showArrow>Scopri la soluzione</ButtonLink>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
