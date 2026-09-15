import { Link } from 'react-router-dom'
import { Seo } from '../components/layout/Seo'

export function HiddenRoutePage() {
  return (
    <>
      <Seo title="Pagina non disponibile" description="Questa pagina non è al momento disponibile." noIndex />
      <main className="maintenance-page">
        <div className="maintenance-page__pattern" aria-hidden="true" />
        <div className="container maintenance-page__inner">
          <div className="maintenance-page__content">
            <p className="eyebrow">Pagina non disponibile</p>
            <h1>Questo indirizzo non è al momento raggiungibile.</h1>
            <p className="maintenance-page__message">
              <Link to="/">Torna alla home</Link>
            </p>
          </div>
        </div>
      </main>
    </>
  )
}
