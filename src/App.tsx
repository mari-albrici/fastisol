import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { SiteLayout } from './components/layout/SiteLayout'
import { consolidatedPublicRoutes } from './data/publicRoutes'
import { ManagementAuthProvider } from './management/AuthContext'
import { ManagementGuard } from './management/ManagementGuard'
import { ManagementLayout } from './management/ManagementLayout'

const MaintenancePage = lazy(() => import('./pages/MaintenancePage').then((module) => ({ default: module.MaintenancePage })))
const ContactPage = lazy(() => import('./pages/ContactPage').then((module) => ({ default: module.ContactPage })))
const CompanyPage = lazy(() => import('./pages/CompanyPage').then((module) => ({ default: module.CompanyPage })))
const TechnologyPage = lazy(() => import('./pages/TechnologyPage').then((module) => ({ default: module.TechnologyPage })))
const SolutionsPage = lazy(() => import('./pages/SolutionsPage').then((module) => ({ default: module.SolutionsPage })))
const QuotePage = lazy(() => import('./pages/QuotePage').then((module) => ({ default: module.QuotePage })))
const FaqPage = lazy(() => import('./pages/FaqPage').then((module) => ({ default: module.FaqPage })))
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage').then((module) => ({ default: module.PrivacyPolicyPage })))
const CookiePolicyPage = lazy(() => import('./pages/CookiePolicyPage').then((module) => ({ default: module.CookiePolicyPage })))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })))
const ManagementLoginPage = lazy(() => import('./management/ManagementLoginPage').then((module) => ({ default: module.ManagementLoginPage })))
const ManagementDashboardPage = lazy(() => import('./management/ManagementDashboardPage').then((module) => ({ default: module.ManagementDashboardPage })))
const ManagementResourcesPage = lazy(() => import('./management/ManagementResourcesPage').then((module) => ({ default: module.ManagementResourcesPage })))
const ManagementMaterialsPage = lazy(() => import('./management/ManagementMaterialsPage').then((module) => ({ default: module.ManagementMaterialsPage })))
const ManagementWarrantiesPage = lazy(() => import('./management/ManagementWarrantiesPage').then((module) => ({ default: module.ManagementWarrantiesPage })))
const ManagementSuppliersPage = lazy(() => import('./management/ManagementSuppliersPage').then((module) => ({ default: module.ManagementSuppliersPage })))
const ManagementSecurityPage = lazy(() => import('./management/ManagementSecurityPage').then((module) => ({ default: module.ManagementSecurityPage })))
const ManagementMfaPage = lazy(() => import('./management/ManagementMfaPage').then((module) => ({ default: module.ManagementMfaPage })))
const ManagementControlCenterPage = lazy(() => import('./management/ManagementControlCenterPage').then((module) => ({ default: module.ManagementControlCenterPage })))

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
              <Route path="fornitori" element={<ManagementSuppliersPage />} />
              <Route path="controllo" element={<ManagementControlCenterPage />} />
              <Route path="sicurezza" element={<ManagementSecurityPage />} />
              <Route path="schede-certificazioni" element={<ManagementResourcesPage />} />
              <Route path="garanzie" element={<ManagementWarrantiesPage />} />
              <Route path="materiali" element={<ManagementMaterialsPage />} />
            </Route>
          </Route>
          <Route index element={<MaintenancePage />} />
          <Route element={<SiteLayout />}>
            <Route path="/contatti" element={<ContactPage />} />
            <Route path="/azienda" element={<CompanyPage />} />
            <Route path="/tecnologia" element={<TechnologyPage />} />
            <Route path="/soluzioni" element={<SolutionsPage />} />
            <Route path="/preventivo" element={<QuotePage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/cookie-policy" element={<CookiePolicyPage />} />
            {consolidatedPublicRoutes.map((path) => (
              <Route key={path} path={path} element={<Navigate to={path.startsWith('/tecnologia/') ? '/tecnologia' : '/soluzioni'} replace />} />
            ))}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </ManagementAuthProvider>
  )
}
