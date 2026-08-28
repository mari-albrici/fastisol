import { projects } from '../../data/projects'
import { ButtonLink } from '../ui/ButtonLink'
import { SectionHeading } from '../ui/SectionHeading'

export function ProjectsSection() {
  return (
    <section className="section projects-section">
      <div className="container">
        <div className="section-title-row">
          <SectionHeading
            eyebrow="Lavori e contesti reali"
            title="Dove i dettagli fanno la differenza."
            description="Ogni struttura presenta vincoli diversi. Questi esempi mostrano come cambia l’approccio tra un sottotetto residenziale e una copertura industriale."
          />
          <ButtonLink href="/realizzazioni" variant="text" showArrow>Guarda le realizzazioni</ButtonLink>
        </div>

        <div className="project-grid">
          {projects.map((project) => (
            <article className="project-card" key={project.slug}>
              <div className="project-card__image-wrap">
                <img
                  src={project.images[0].src}
                  alt={project.images[0].alt}
                  width={project.images[0].width}
                  height={project.images[0].height}
                  loading="lazy"
                />
                <span>{project.buildingType}</span>
              </div>
              <div className="project-card__content">
                <h3>{project.title}</h3>
                <dl>
                  <div><dt>Problema</dt><dd>{project.problem}</dd></div>
                  <div><dt>Intervento</dt><dd>{project.solution}</dd></div>
                </dl>
                <ButtonLink href={`/realizzazioni/${project.slug}`} variant="text" showArrow>Vedi il progetto</ButtonLink>
              </div>
            </article>
          ))}
        </div>
        <p className="image-disclaimer">Immagini dimostrative generate per la fase progettuale: saranno sostituite con fotografie e dati dei cantieri Fastisol.</p>
      </div>
    </section>
  )
}
