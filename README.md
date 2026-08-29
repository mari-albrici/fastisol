# Fastisol

Nuovo sito statico Fastisol realizzato con Vite, React e TypeScript.

## Sviluppo

```bash
npm install
npm run dev
```

## Verifiche e build

```bash
npm run lint
npm run build
```

La cartella `dist` è pronta per essere pubblicata nella `public_html` di SiteGround. Il file `public/.htaccess` gestisce il fallback delle route React.

## Mini gestionale

Il percorso `/gestionale` contiene l'area riservata per:

- anagrafiche clienti;
- lavori pianificati e storico degli interventi;
- preventivi e fatture proforma;
- calcolo automatico di sconto, IVA e totale;
- stampa dei documenti o salvataggio in PDF dal browser.

Autenticazione e dati sono gestiti da Supabase. Il frontend usa soltanto la chiave pubblica; le policy Row Level Security in `supabase/schema.sql` impediscono l'accesso senza una sessione valida e isolano tutti i record per proprietario.

### Prima configurazione

1. Creare un progetto su Supabase.
2. Aprire il **SQL Editor**, incollare ed eseguire tutto il file `supabase/schema.sql`.
3. In **Authentication > Users**, creare manualmente l'unico utente del titolare con email e password.
4. Nelle impostazioni Authentication disattivare la registrazione di nuovi utenti. Nel sito non è comunque presente alcun modulo di registrazione.
5. Copiare `.env.example` in `.env` e compilare:

```dotenv
VITE_SUPABASE_URL=https://ID-PROGETTO.supabase.co
VITE_SUPABASE_ANON_KEY=CHIAVE_PUBBLICA_ANON_O_PUBLISHABLE
VITE_MANAGEMENT_USERNAME=fastisol
VITE_MANAGEMENT_EMAIL=email-usata-per-utente-supabase@example.com
```

Il campo username della pagina di accesso viene associato all'email configurata. Username e chiave pubblica sono visibili nel bundle e non sono segreti; la protezione è data dalla password, da Supabase Auth e dalle policy RLS. Non inserire mai nel frontend la `service_role key`.

Infine eseguire `npm run build` e pubblicare il contenuto di `dist` come per il resto del sito. Dopo il deploy, il gestionale sarà disponibile su `https://fastisol.it/gestionale` e non comparirà nella navigazione pubblica.

### Backup e documenti fiscali

Attivare un piano di backup adeguato in Supabase oppure esportare periodicamente il database. Le fatture proforma prodotte dal gestionale sono documenti non fiscali; l'emissione e la conservazione delle fatture elettroniche continuano a dover essere gestite tramite il canale fiscale utilizzato dall'azienda.

## Dati da verificare

I recapiti, i termini di garanzia, i dati societari e le specifiche tecniche sono centralizzati in `src/data`. I valori non disponibili non sono stati inventati e sono marcati con TODO.
