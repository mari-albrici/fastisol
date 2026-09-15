import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { ManagementAuthProvider } from './management/AuthContext'
import { ManagementGuard } from './management/ManagementGuard'
import { ManagementLayout } from './management/ManagementLayout'

const MaintenancePage = lazy(() => import('./pages/MaintenancePage').then((module) => ({ default: module.MaintenancePage })))
const HiddenRoutePage = lazy(() => import('./pages/HiddenRoutePage').then((module) => ({ default: module.HiddenRoutePage })))
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
          <Route path="*" element={<HiddenRoutePage />} />
        </Routes>
      </Suspense>
    </ManagementAuthProvider>
  )
}