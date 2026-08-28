import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { SiteLayout } from './components/layout/SiteLayout'

const HomePage = lazy(() => import('./pages/HomePage').then((module) => ({ default: module.HomePage })))
const PlaceholderPage = lazy(() => import('./pages/PlaceholderPage').then((module) => ({ default: module.PlaceholderPage })))
const NotFoundPage = lazy(() => import('./pages/PlaceholderPage').then((module) => ({ default: module.NotFoundPage })))

const placeholderRoutes = [
  { path: '/soluzioni', title: 'Soluzioni di isolamento', eyebrow: 'Soluzioni', description: 'Percorsi chiari per tetti, sottotetti, interni e coperture industriali, organizzati in base al problema e alla struttura dell’edificio.' },
  { path: '/soluzioni/isolamento-sottotetto', title: 'Isolamento del sottotetto', eyebrow: 'Soluzioni residenziali', description: 'Come isolare la parte alta dell’abitazione intervenendo sulla soletta o sulle falde, in base all’uso del sottotetto.' },
  { path: '/soluzioni/sottotetto-non-abitabile', title: 'Sottotetto non abitabile', eyebrow: 'Soluzioni residenziali', description: 'Un intervento mirato per separare il volume riscaldato dallo spazio non utilizzato sotto il tetto.' },
  { path: '/soluzioni/sottotetto-calpestabile', title: 'Sottotetto calpestabile', eyebrow: 'Soluzioni residenziali', description: 'Isolamento e finitura vanno progettati insieme quando lo spazio deve restare accessibile o utilizzabile.' },
  { path: '/soluzioni/isolamento-tetto', title: 'Isolamento del tetto', eyebrow: 'Soluzioni', description: 'Valutiamo struttura, supporto e accessibilità per individuare dove applicare lo strato isolante.' },
  { path: '/soluzioni/tetto-in-legno', title: 'Isolamento del tetto in legno', eyebrow: 'Soluzioni', description: 'Un’applicazione studiata sulla geometria delle falde e sul comportamento della stratigrafia esistente.' },
  { path: '/soluzioni/tetto-in-cemento', title: 'Isolamento del tetto in cemento', eyebrow: 'Soluzioni', description: 'Analisi del supporto e ciclo applicativo definito sulle condizioni effettive della copertura.' },
  { path: '/soluzioni/muricci-e-tavelloni', title: 'Sottotetto con muricci e tavelloni', eyebrow: 'Spazi difficili', description: 'L’applicazione a spruzzo permette di seguire geometrie basse e frammentate, dopo una verifica del supporto.' },
  { path: '/soluzioni/isolamento-interno', title: 'Isolamento interno', eyebrow: 'Soluzioni', description: 'Valutazioni dedicate per pareti e superfici interne, con attenzione alla stratigrafia e alla gestione del vapore.' },
  { path: '/soluzioni/edifici-industriali', title: 'Isolamento di edifici industriali', eyebrow: 'Imprese e professionisti', description: 'Soluzioni per grandi coperture, capannoni e condizioni operative che richiedono un approccio specifico.' },
  { path: '/soluzioni/condensa', title: 'Valutazione dei problemi di condensa', eyebrow: 'Analisi prima dell’intervento', description: 'La condensa ha cause diverse: individuarle è indispensabile prima di proporre un ciclo isolante.' },
  { path: '/tecnologia', title: 'Tecnologia ICYNENE / Huntsman', eyebrow: 'Tecnologia', description: 'Dalla spiegazione semplice alle schede tecniche: come funziona l’isolamento a celle aperte applicato a spruzzo.' },
  { path: '/tecnologia/icynene', title: 'ICYNENE a celle aperte', eyebrow: 'Tecnologia', description: 'Caratteristiche, applicazioni e documentazione del sistema utilizzato da Fastisol, con dati da fonti ufficiali.' },
  { path: '/tecnologia/come-funziona', title: 'Come funziona l’isolamento a spruzzo', eyebrow: 'Tecnologia', description: 'Preparazione, applicazione ed espansione sul supporto spiegate passo dopo passo.' },
  { path: '/tecnologia/dati-tecnici', title: 'Dati tecnici', eyebrow: 'Per professionisti', description: 'Spazio predisposto per prestazioni e valori verificati sulle schede del prodotto effettivamente applicato.' },
  { path: '/tecnologia/certificazioni', title: 'Certificazioni', eyebrow: 'Documentazione', description: 'Documenti ufficiali e riferimenti verificabili, organizzati per una consultazione rapida.' },
  { path: '/realizzazioni', title: 'Realizzazioni Fastisol', eyebrow: 'Casi applicativi', description: 'Interventi organizzati per contesto, problema, soluzione e dettagli di posa.' },
  { path: '/realizzazioni/:slug', title: 'Dettaglio realizzazione', eyebrow: 'Caso applicativo', description: 'Scheda progetto predisposta per fotografie, contesto, problema iniziale e intervento eseguito.' },
  { path: '/preventivo', title: 'Richiedi un preventivo', eyebrow: 'Valutazione guidata', description: 'Raccogli le informazioni utili sul tuo edificio e inviale a Fastisol per una prima valutazione.' },
  { path: '/azienda', title: 'Fastisol, specialisti dell’isolamento', eyebrow: 'Azienda', description: 'Metodo, esperienza applicativa e rapporto diretto con chi segue l’intervento.' },
  { path: '/guide', title: 'Guide all’isolamento', eyebrow: 'Capire prima di scegliere', description: 'Contenuti chiari su tetti, sottotetti, comfort termico, condensa e riqualificazione energetica.' },
  { path: '/faq', title: 'Domande frequenti', eyebrow: 'FAQ', description: 'Risposte su applicazione, tempi, preventivi e valutazioni tecniche.' },
  { path: '/contatti', title: 'Contatta Fastisol', eyebrow: 'Contatti', description: 'Telefono, WhatsApp, sede e richieste di valutazione in un unico punto.' },
  { path: '/privacy-policy', title: 'Privacy policy', eyebrow: 'Informativa', description: 'Pagina predisposta per l’informativa privacy verificata dal consulente incaricato.' },
  { path: '/cookie-policy', title: 'Cookie policy', eyebrow: 'Informativa', description: 'Pagina predisposta per la cookie policy e la gestione del consenso.' },
] as const

export default function App() {
  return (
    <Suspense fallback={<div className="route-loader" aria-label="Caricamento pagina" />}>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<HomePage />} />
          {placeholderRoutes.map((route) => (
            <Route key={route.path} path={route.path} element={<PlaceholderPage title={route.title} eyebrow={route.eyebrow} description={route.description} />} />
          ))}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
