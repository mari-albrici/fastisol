import { journeyLocations } from '../../data/companyHistory';

export function WorldJourneyMap() {
	return (
		<div className="journey-map">
			<svg className="journey-map__graphic" viewBox="0 0 1000 500" role="img" aria-labelledby="journey-map-title journey-map-description">
				<title id="journey-map-title">Il percorso internazionale di Fastisol</title>
				<desc id="journey-map-description">
					Mappa con tre punti: Darfo Boario Terme, sede Fastisol; Pletený Újezd in Repubblica Ceca, sede Huntsman Building Solutions Central Europe;
					Kentucky, luogo di formazione sul campo di Daniele.
				</desc>

				<g className="journey-map__grid" aria-hidden="true">
					<path d="M0 100H1000M0 200H1000M0 300H1000M0 400H1000" />
					<path d="M200 0V500M400 0V500M600 0V500M800 0V500" />
				</g>

				<g className="journey-map__land" aria-hidden="true">
					{/* Nord America */}
					<path d="M33,67 L60,50 L110,45 L194,44 L278,47 L330,58 L300,80 L255,95 L300,100 L333,97 L355,120 L320,130 L300,150 L290,168 L283,180 L290,192 L285,228 L263,200 L240,185 L215,172 L198,178 L190,198 L200,215 L218,222 L233,232 L215,235 L195,232 L178,235 L160,242 L148,220 L140,200 L148,178 L110,222 L130,155 L115,125 L112,98 L90,82 L68,68 Z" />
					{/* Groenlandia */}
					<path d="M389,19 L444,56 L410,90 L381,83 L347,58 Z" />
					{/* Sud America */}
					<path d="M286,217 L328,221 L403,272 L390,300 L381,314 L360,330 L344,347 L325,375 L311,403 L297,361 L275,267 L278,247 Z" />
					{/* Europa */}
					<path d="M475,131 L483,150 L500,140 L536,150 L530,163 L540,152 L555,148 L580,155 L600,130 L615,70 L578,80 L569,52 L514,81 L492,100 L494,117 Z" />
					{/* Africa */}
					<path d="M483,151 L531,147 L594,164 L598,188 L612,208 L628,218 L610,235 L599,300 L589,331 L550,346 L533,300 L525,239 L453,208 L470,175 Z" />
					{/* Madagascar */}
					<path d="M628,290 L638,297 L634,322 L623,315 Z" />
					{/* Asia */}
					<path d="M650,70 L700,30 L778,36 L860,35 L960,60 L930,70 L950,89 L889,83 L845,130 L858,144 L839,164 L810,190 L797,219 L786,244 L764,203 L740,205 L714,228 L695,192 L653,172 L662,192 L648,220 L630,208 L614,188 L602,150 L635,140 Z" />
					{/* Australia */}
					<path d="M805,302 L825,285 L850,283 L862,300 L878,282 L895,278 L905,300 L925,330 L915,352 L880,358 L825,348 L812,320 Z" />
					{/* Tasmania */}
					<path d="M895,368 L905,365 L902,378 Z" />
				</g>

				<path className="journey-map__route" d="M300 155C372 90 430 95 495 120C491 126 487 130 483 134" aria-hidden="true" />

				{journeyLocations.map((location) => (
					<g className={`journey-map__pin journey-map__pin--${location.id}`} key={location.id}>
						<line className="journey-map__pin-line" x1={location.mapX} y1={location.mapY} x2={location.labelX} y2={location.labelY - 9} />
						<circle className="journey-map__pin-pulse" cx={location.mapX} cy={location.mapY} r="16" />
						<circle className="journey-map__pin-dot" cx={location.mapX} cy={location.mapY} r="8" />
						<text className="journey-map__pin-label" x={location.labelX} y={location.labelY} textAnchor={location.labelAnchor}>
							{location.id}. {location.place}
						</text>
					</g>
				))}
			</svg>

			<ol className="journey-map__legend">
				{journeyLocations.map((location) => (
					<li className="journey-map__legend-item" key={location.id}>
						<span className="journey-map__legend-number">{location.id.toString().padStart(2, '0')}</span>
						<div>
							<span className="journey-map__legend-kicker">{location.purpose}</span>
							<h3>{location.place}</h3>
							<p className="journey-map__place">{location.detail}</p>
							<p>{location.role}</p>
						</div>
					</li>
				))}
			</ol>
		</div>
	);
}
