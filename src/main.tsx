import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/global.css'
import './styles/layout.css'
import './styles/home.css'
import './styles/maintenance.css'
import './styles/contact.css'
import './styles/company.css'
import './styles/technology.css'
import './styles/solutions.css'
import './styles/public-pages.css'
import './styles/management.css'

const rootElement = document.getElementById('root')!
const application = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)

if (rootElement.hasChildNodes()) hydrateRoot(rootElement, application)
else createRoot(rootElement).render(application)
