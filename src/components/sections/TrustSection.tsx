import { testimonials } from '../../data/testimonials';
import { Icon } from '../ui/Icon';
import { SectionHeading } from '../ui/SectionHeading';

function StarRating({ value }: { value: number }) {
	return (
		<div className="testimonial-stars" aria-label={`${value} su 5 stelle`}>
			{Array.from({ length: 5 }, (_, i) => (
				<span key={i} className="star" style={{ color: i < value ? '#f5b301' : '#d9d9d9' }}>
					★
				</span>
			))}
		</div>
	);
}

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
						<div>
							<Icon name="document" />
							<p>
								<strong>Dati tecnici</strong>
								<span>Specifiche solo da schede ufficiali verificate</span>
							</p>
						</div>
						<div>
							<Icon name="shield" />
							<p>
								<strong>Garanzia trasparente</strong>
								<span>Termini e condizioni indicati senza promesse generiche</span>
							</p>
						</div>
					</div>
				</div>

				<div className="testimonial-stack">
					{testimonials.map((testimonial) => (
						<figure key={testimonial.name}>
							<p className="testimonial-summary">{testimonial.quote}</p>
							<figcaption>
								<StarRating value={testimonial.stars} />
								<strong>{testimonial.name}</strong>
								<span>{testimonial.projectType}</span>
							</figcaption>
						</figure>
					))}
					<p className="testimonial-note">
						Testimonianze riprese dal sito Fastisol precedente, da riconfermare in versione integrale prima della pubblicazione.
					</p>
				</div>
			</div>
		</section>
	);
}
