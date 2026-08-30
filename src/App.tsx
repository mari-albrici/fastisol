import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { SiteLayout } from './components/layout/SiteLayout'
import { ManagementAuthProvider } from './management/AuthContext'
import { ManagementGuard } from './management/ManagementGuard'
import { ManagementLayout } from './management/ManagementLayout'

const HomePage = lazy(() => import('./pages/HomePage').then((module) => ({ default: module.HomePage })))
const ContactPage = lazy(() => import('./pages/ContactPage').then((module) => ({ default: module.ContactPage })))
const CompanyPage = lazy(() => import('./pages/CompanyPage').then((module) => ({ default: module.CompanyPage })))
const TechnologyPage = lazy(() => import('./pages/TechnologyPage').then((module) => ({ default: module.TechnologyPage })))
const SolutionsPage = lazy(() => import('./pages/SolutionsPage').then((module) => ({ default: module.SolutionsPage })))
const PlaceholderPage = lazy(() => import('./pages/PlaceholderPage').then((module) => ({ default: module.PlaceholderPage })))
const NotFoundPage = lazy(() => import('./pages/PlaceholderPage').then((module) => ({ default: module.NotFoundPage })))
const ManagementLoginPage = lazy(() => import('./management/ManagementLoginPage').then((module) => ({ default: module.ManagementLoginPage })))
const ManagementDashboardPage = lazy(() => import('./management/ManagementDashboardPage').then((module) => ({ default: module.ManagementDashboardPage })))
const ManagementClientsPage = lazy(() => import('./management/ManagementClientsPage').then((module) => ({ default: module.ManagementClientsPage })))
const ManagementDocumentsPage = lazy(() => import('./management/ManagementDocumentsPage').then((module) => ({ default: module.ManagementDocumentsPage })))
const ManagementDocumentEditorPage = lazy(() => import('./management/ManagementDocumentEditorPage').then((module) => ({ default: module.ManagementDocumentEditorPage })))
const ManagementResourcesPage = lazy(() => import('./management/ManagementResourcesPage').then((module) => ({ default: module.ManagementResourcesPage })))
const ManagementClientDetailPage = lazy(() => import('./management/ManagementClientDetailPage').then((module) => ({ default: module.ManagementClientDetailPage })))
const ManagementDeadlinesPage = lazy(() => import('./management/ManagementDeadlinesPage').then((module) => ({ default: module.ManagementDeadlinesPage })))
const ManagementSettingsPage = lazy(() => import('./management/ManagementSettingsPage').then((module) => ({ default: module.ManagementSettingsPage })))
const ManagementWarrantiesPage = lazy(() => import('./management/ManagementWarrantiesPage').then((module) => ({ default: module.ManagementWarrantiesPage })))
const ManagementInventoryPage = lazy(() => import('./management/ManagementInventoryPage').then((module) => ({ default: module.ManagementInventoryPage })))
const ManagementSuppliersPage = lazy(() => import('./management/ManagementSuppliersPage').then((module) => ({ default: module.ManagementSuppliersPage })))
const ManagementProjectsPage = lazy(() => import('./management/ManagementProjectsPage').then((module) => ({ default: module.ManagementProjectsPage })))
const ManagementAccountingPage = lazy(() => import('./management/ManagementAccountingPage').then((module) => ({ default: module.ManagementAccountingPage })))
const ManagementReceivablesPage = lazy(() => import('./management/ManagementReceivablesPage').then((module) => ({ default: module.ManagementReceivablesPage })))
const ManagementPurchasingPage = lazy(() => import('./management/ManagementPurchasingPage').then((module) => ({ default: module.ManagementPurchasingPage })))
const ManagementSecurityPage = lazy(() => import('./management/ManagementSecurityPage').then((module) => ({ default: module.ManagementSecurityPage })))
const ManagementMfaPage = lazy(() => import('./management/ManagementMfaPage').then((module) => ({ default: module.ManagementMfaPage })))
const ManagementElectronicInvoicesPage = lazy(() => import('./management/ManagementElectronicInvoicesPage').then((module) => ({ default: module.ManagementElectronicInvoicesPage })))
const ManagementCatalogPage = lazy(() => import('./management/ManagementCatalogPage').then((module) => ({ default: module.ManagementCatalogPage })))
const ManagementFieldOperationsPage = lazy(() => import('./management/ManagementFieldOperationsPage').then((module) => ({ default: module.ManagementFieldOperationsPage })))
const ManagementStockControlPage = lazy(() => import('./management/ManagementStockControlPage').then((module) => ({ default: module.ManagementStockControlPage })))
const ManagementControlCenterPage = lazy(() => import('./management/ManagementControlCenterPage').then((module) => ({ default: module.ManagementControlCenterPage })))

const placeholderRoutes = [
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
  { path: '/tecnologia/icynene', title: 'ICYNENE a celle aperte', eyebrow: 'Tecnologia', description: 'Caratteristiche, applicazioni e documentazione del sistema utilizzato da Fastisol, con dati da fonti ufficiali.' },
  { path: '/tecnologia/come-funziona', title: 'Come funziona l’isolamento a spruzzo', eyebrow: 'Tecnologia', description: 'Preparazione, applicazione ed espansione sul supporto spiegate passo dopo passo.' },
  { path: '/tecnologia/dati-tecnici', title: 'Dati tecnici', eyebrow: 'Per professionisti', description: 'Spazio predisposto per prestazioni e valori verificati sulle schede del prodotto effettivamente applicato.' },
  { path: '/tecnologia/certificazioni', title: 'Certificazioni', eyebrow: 'Documentazione', description: 'Documenti ufficiali e riferimenti verificabili, organizzati per una consultazione rapida.' },
  { path: '/preventivo', title: 'Richiedi un preventivo', eyebrow: 'Valutazione guidata', description: 'Raccogli le informazioni utili sul tuo edificio e inviale a Fastisol per una prima valutazione.' },
  { path: '/faq', title: 'Domande frequenti', eyebrow: 'FAQ', description: 'Risposte su applicazione, tempi, preventivi e valutazioni tecniche.' },
  { path: '/privacy-policy', title: 'Privacy policy', eyebrow: 'Informativa', description: 'Pagina predisposta per l’informativa privacy verificata dal consulente incaricato.' },
  { path: '/cookie-policy', title: 'Cookie policy', eyebrow: 'Informativa', description: 'Pagina predisposta per la cookie policy e la gestione del consenso.' },
] as const

export default function App() {
  return (
    <ManagementAuthProvider>
      <Suspense fallback={<div className="route-loader" aria-label="Caricamento pagina" />}>
        <Routes>
          <Route path="/gestionale/login" element={<ManagementLoginPage />} />
          <Route path="/gestionale/mfa" element={<ManagementMfaPage />} />
          <Route element={<ManagementGuard />}>
            <Route path="/gestionale" element={<ManagementLayout />}>
              <Route index element={<ManagementDashboardPage />} />
              <Route path="clienti" element={<ManagementClientsPage />} />
              <Route path="clienti/:clientId" element={<ManagementClientDetailPage />} />
              <Route path="fornitori" element={<ManagementSuppliersPage />} />
              <Route path="commesse" element={<ManagementProjectsPage />} />
              <Route path="contabilita" element={<ManagementAccountingPage />} />
              <Route path="incassi" element={<ManagementReceivablesPage />} />
              <Route path="acquisti" element={<ManagementPurchasingPage />} />
              <Route path="importa-fatture-passive" element={<ManagementElectronicInvoicesPage />} />
              <Route path="fatturapa" element={<Navigate to="/gestionale/documenti/proforma" replace />} />
              <Route path="listino" element={<ManagementCatalogPage />} />
              <Route path="operativita" element={<ManagementFieldOperationsPage />} />
              <Route path="scorte" element={<ManagementStockControlPage />} />
              <Route path="controllo" element={<ManagementControlCenterPage />} />
              <Route path="sicurezza" element={<ManagementSecurityPage />} />
              <Route path="scadenziario" element={<ManagementDeadlinesPage />} />
              <Route path="schede-certificazioni" element={<ManagementResourcesPage />} />
              <Route path="garanzie" element={<ManagementWarrantiesPage />} />
              <Route path="magazzino" element={<ManagementInventoryPage />} />
              <Route path="impostazioni" element={<ManagementSettingsPage />} />
              <Route path="documenti" element={<ManagementDocumentsPage />} />
              <Route path="documenti/preventivi" element={<ManagementDocumentsPage documentType="quote" />} />
              <Route path="documenti/proforma" element={<ManagementDocumentsPage documentType="proforma" />} />
              <Route path="documenti/fatture" element={<Navigate to="/gestionale/documenti/proforma" replace />} />
              <Route path="documenti/nuovo" element={<ManagementDocumentEditorPage />} />
              <Route path="documenti/:documentId" element={<ManagementDocumentEditorPage />} />
            </Route>
          </Route>
          <Route element={<SiteLayout />}>
            <Route index element={<HomePage />} />
            <Route path="/contatti" element={<ContactPage />} />
            <Route path="/azienda" element={<CompanyPage />} />
            <Route path="/tecnologia" element={<TechnologyPage />} />
            <Route path="/soluzioni" element={<SolutionsPage />} />
            {placeholderRoutes.map((route) => (
              <Route key={route.path} path={route.path} element={<PlaceholderPage title={route.title} eyebrow={route.eyebrow} description={route.description} />} />
            ))}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </ManagementAuthProvider>
  )
}
