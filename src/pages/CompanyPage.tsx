import { Seo } from '../components/layout/Seo';
import { WorldJourneyMap } from '../components/sections/WorldJourneyMap';
import { ButtonLink } from '../components/ui/ButtonLink';
import { company } from '../data/company';
import { companyMilestones } from '../data/companyHistory';

const companyStructuredData = [
	{
		'@context': 'https://schema.org',
		'@type': 'AboutPage',
		name: 'Azienda Fastisol',
		url: `${company.websiteUrl}/azienda`,
		description: 'Storia, metodo e percorso professionale di Fastisol e del fondatore Daniele Gualeni.',
	},
	{
		'@context': 'https://schema.org',
		'@type': 'HomeAndConstructionBusiness',
		name: company.name,
		legalName: company.legalName,
		url: company.websiteUrl,
		telephone: company.phoneDisplay,
		email: company.email,
		logo: new URL(company.logos.onLight.src, company.websiteUrl).toString(),
		address: {
			'@type': 'PostalAddress',
			streetAddress: company.address.street,
			postalCode: company.address.postalCode,
			addressLocality: company.address.city,
			addressRegion: company.address.province,
			addressCountry: 'IT',
		},
		founder: {
			'@type': 'Person',
			name: 'Daniele Gualeni',
			jobTitle: 'Titolare e responsabile operativo',
		},
	},
];

export function CompanyPage() {
	return (
		<>
			<Seo
				title="Azienda Fastisol"
				description="Conosci Fastisol: la storia dell’azienda, il percorso professionale di Daniele Gualeni e le esperienze tra Valle Camonica, Repubblica Ceca e Kentucky."
				structuredData={companyStructuredData}
			/>

			<section className="company-hero">
				<div className="container company-hero__inner">
					<div>
						<p className="eyebrow">Azienda</p>
						<h1 className="company-hero__title">Specialisti per scelta, applicatori per esperienza.</h1>
					</div>
					<div className="company-hero__aside">
						<p className="company-hero__intro">
							Fastisol nasce in Valle Camonica con un obiettivo preciso: occuparsi di isolamento con competenza verticale, seguendo ogni intervento
							dalla prima valutazione alla posa.
						</p>
					</div>
				</div>
			</section>

			<section className="section company-story">
				<div className="container company-story__grid">
					<figure className="company-photo company-photo--landscape">
						<img
							src="/images/fastisol-azienda-storia-placeholder.webp"
							alt="Immagine provvisoria di tecnici che preparano l’attrezzatura per un intervento di isolamento"
							width="1400"
							height="1050"
						/>
						<figcaption>Fotografia provvisoria — da sostituire con un’immagine reale Fastisol.</figcaption>
					</figure>

					<div className="company-story__content">
						<p className="eyebrow">La storia di Fastisol</p>
						<h2>Dall’esperienza in edilizia a una specializzazione precisa.</h2>
						<div className="company-prose">
							<p>
								Il percorso di Fastisol parte dalla conoscenza degli edifici: strutture, coperture, dettagli costruttivi e problemi che emergono nel
								tempo. È da questa esperienza che nasce la scelta di concentrarsi sull’isolamento termico, evitando l’approccio generico di chi
								propone lo stesso intervento in ogni situazione.
							</p>
							<p>
								Dopo un periodo di confronto e formazione all’estero, nel 2014 prende forma Fastisol. L’azienda si dedica all’applicazione
								professionale dell’isolamento a spruzzo, adattando il sistema alle tipologie costruttive italiane: tetti in legno, solai in
								laterocemento, sottotetti bassi e strutture a muricci e tavelloni.
							</p>
							<p>
								Oggi il metodo resta lo stesso: osservare prima di proporre, definire il ciclo sulle condizioni reali e seguire direttamente il
								lavoro. Il risultato è un servizio completo, con un interlocutore unico dalla valutazione iniziale al controllo dell’applicazione.
							</p>
						</div>
					</div>
				</div>

				<div className="container company-timeline">
					{companyMilestones.map((milestone) => (
						<article className="company-timeline__item" key={milestone.year}>
							<span className="company-timeline__year">{milestone.year}</span>
							<h3>{milestone.title}</h3>
							<p>{milestone.text}</p>
						</article>
					))}
				</div>
			</section>

			<section className="section owner-story">
				<div className="container owner-story__grid">
					<div className="owner-story__content">
						<p className="eyebrow">Daniele Gualeni</p>
						<h2>La tecnica si impara studiando. Il mestiere, lavorando sul campo.</h2>
						<div className="company-prose">
							<p>
								Daniele arriva all’isolamento dopo anni trascorsi nel settore edile, tra progettazione e direzione lavori. Conoscere come è costruito
								un tetto gli permette di guardare oltre il materiale e capire prima di tutto dove, come e perché intervenire.
							</p>
							<p>
								La curiosità per i sistemi a spruzzo lo porta prima in Repubblica Ceca, nel cuore della filiera europea, e poi negli Stati Uniti. In
								Kentucky lavora accanto ad applicatori già abituati a utilizzare questa tecnologia ogni giorno, approfondendo preparazione, posa e
								controllo del risultato.
							</p>
							<p>
								Fastisol nasce da qui: unire quella pratica alle esigenze degli edifici italiani e mantenere un rapporto diretto con il cliente. Chi
								chiama non parla con un call center, ma con chi conosce il sistema e segue davvero il cantiere.
							</p>
						</div>
						<ButtonLink href="/contatti" variant="secondary" showArrow>
							Parla con Fastisol
						</ButtonLink>
					</div>

					<figure className="company-photo company-photo--portrait">
						<img
							src="/images/fastisol-daniele-placeholder.webp"
							alt="Ritratto provvisorio per la sezione dedicata a Daniele Gualeni"
							width="900"
							height="1125"
							loading="lazy"
						/>
						<figcaption>Ritratto provvisorio — non raffigura Daniele e deve essere sostituito.</figcaption>
					</figure>
				</div>
			</section>

			<section className="section company-journey">
				<div className="container">
					<div className="company-journey__heading">
						<div>
							<p className="eyebrow">Tre luoghi, un unico percorso</p>
							<h2>La competenza Fastisol ha radici locali e formazione internazionale.</h2>
						</div>
						<p className="company-journey__intro">
							Dalla sede in Valle Camonica all’esperienza pratica negli Stati Uniti, poi la filiera europea Huntsman come fornitore: ogni tappa
							contribuisce al metodo applicativo di oggi.
						</p>
					</div>
					<WorldJourneyMap />
				</div>
			</section>

			<section className="section company-cta">
				<div className="container company-cta__inner">
					<div>
						<p className="eyebrow">Un rapporto diretto</p>
						<h2>Hai un tetto o un sottotetto da valutare?</h2>
					</div>
					<ButtonLink href="/preventivo" showArrow>
						Richiedi un preventivo
					</ButtonLink>
				</div>
			</section>
		</>
	);
}
