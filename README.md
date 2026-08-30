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

La cartella `dist` è l'unico artefatto da pubblicare nel web root Host.it configurato. Il file `public/.htaccess` gestisce il fallback delle route React e viene copiato automaticamente in `dist`.

### Deploy su Host.it

Il workflow `.github/workflows/deploy.yml` esegue installazione pulita, lint, build e upload SFTP del solo contenuto di `dist`. L'upload sovrascrive i file omonimi ma non elimina file o directory già presenti sul server.

Configurare nell'environment GitHub `production` i secret obbligatori:

- `HOSTIT_HOST`
- `HOSTIT_USERNAME`
- `HOSTIT_PORT`
- `HOSTIT_REMOTE_PATH`
- `HOSTIT_SSH_KEY`
- `HOSTIT_KNOWN_HOSTS`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (chiave anon legacy oppure publishable; mai `service_role` o secret key)

Le altre variabili `VITE_*` elencate in `.env.example` possono essere aggiunte come secret se la relativa funzione è utilizzata. Tutte le variabili `VITE_*` finiscono nel bundle pubblico: non devono mai contenere password, chiavi `service_role`/secret o credenziali incorporate negli URL. Il percorso remoto deve essere quello esatto indicato da Host.it/DirectAdmin: il workflow non presume che sia `public_html`.

## Mini gestionale

Il percorso `/gestionale` contiene l'area riservata per:

- anagrafiche clienti;
- anagrafiche fornitori con dati fiscali, regime, PEC, SDI e IBAN;
- preventivi e fatture proforma;
- controllo di approvazione e lavoro svolto per ogni documento;
- archivio privato di schede tecniche e certificazioni PDF;
- scadenziario con richiami, pagamenti e certificazioni;
- scheda cliente con cronologia, note, telefonate e allegati;
- duplicazione dei documenti e conversione preventivo/proforma;
- invio tramite app email o WhatsApp con registro degli invii;
- numerazione configurabile per anno e tipo di documento;
- calcolo automatico di sconto, IVA e totale;
- stampa dei documenti o salvataggio in PDF dal browser;
- certificati di garanzia per cliente, materiale, lotto e cantiere;
- magazzino con lotti, singoli barili, peso residuo e consumi per cantiere;
- selezione singola o multipla delle proforma ed esportazione XML/ZIP da importare in Aruba Fatturazione;
- cantieri e commesse con ricavi, costi diretti, fatture passive, spese e margine;
- scadenzario incassi con acconti, rate, saldi e insoluti;
- contabilità acquisti con fatture passive, ricevute, allegati e pagamenti;
- ordini fornitori e DDT con creazione automatica dei lotti di magazzino;
- XML FatturaPA avanzato con aliquote e Natura per riga, sconti, bollo, ritenuta, cassa, split payment e riferimenti ordine/contratto/DDT;
- importazione automatica degli XML delle fatture passive;
- listino lavorazioni richiamabile nei documenti;
- agenda del titolare sincronizzabile in entrambe le direzioni con Google Calendar e diario di cantiere con foto, ore, superficie, firma e rapporto PDF;
- confronto tra margine preventivo e consuntivo;
- soglie di scorta, ordini automatici e ricerca lotto → barile → cantiere → cliente → garanzia;
- ricerca globale, controlli di completezza e duplicati, dashboard finanziaria ed export CSV per il commercialista;
- MFA, registro delle modifiche, cestino recuperabile e snapshot automatici dei dati.
- lettura da fotocamera di QR code e codici a barre per individuare lotti e barili e registrare i consumi.

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
VITE_GOOGLE_CLIENT_ID=client-oauth-web.apps.googleusercontent.com
VITE_GOOGLE_CALENDAR_ID=primary
```

Il campo username della pagina di accesso viene associato all'email configurata. Username e chiave pubblica sono visibili nel bundle e non sono segreti; la protezione è data dalla password, da Supabase Auth e dalle policy RLS. Non inserire mai nel frontend la `service_role key`.

Infine eseguire `npm run build` e pubblicare il contenuto di `dist` come per il resto del sito. Dopo il deploy, il gestionale sarà disponibile su `https://fastisol.it/gestionale` e non comparirà nella navigazione pubblica.

Se il database era già stato configurato prima dell'aggiunta dei check **Approvato** e **Lavoro svolto**, eseguire una volta nel SQL Editor anche `supabase/migrations/20260829_document_tracking.sql`.

Per attivare **Schede e certificazioni**, eseguire una volta nel SQL Editor anche `supabase/migrations/20260829_resources.sql`. La migrazione crea la tabella dei documenti, il bucket privato `management-files`, il limite di 20 MB e le policy di accesso per l'unico utente autenticato.

Per attivare scadenziario, scheda cliente completa, registro invii e numerazione configurabile, eseguire una volta `supabase/migrations/20260829_management_extensions.sql`. La migrazione crea anche il bucket privato `client-files` per PDF e immagini dei clienti.

Per applicare in un solo passaggio la riparazione di **Schede e certificazioni** e attivare **Garanzie**, **Magazzino**, **Fatture** ed esportazione **XML FatturaPA**, eseguire nel SQL Editor `supabase/migrations/20260829_operations_and_invoices.sql`. Il file è ripetibile in sicurezza e forza anche il ricaricamento dello schema PostgREST.

Per attivare l'**anagrafica Fornitori** e collegare i fornitori ai lotti di magazzino, eseguire subito dopo `supabase/migrations/20260829_suppliers.sql`.

Per attivare **Cantieri e commesse**, **Fatture passive e spese**, **Incassi e insoluti**, **Ordini e DDT**, automazioni di magazzino e i campi FatturaPA avanzati, eseguire infine `supabase/migrations/20260830_full_operations.sql`. Questa migrazione deve essere eseguita dopo le due migrazioni indicate nel paragrafo precedente.

Per attivare tutte le utility avanzate — **audit e cestino, MFA, listino, agenda del titolare, diario cantiere, importazione XML passive, scorte minime, backup e ricerca globale** — eseguire per ultima `supabase/migrations/20260830_business_suite.sql`.

Per aggiungere i riferimenti necessari alla sincronizzazione Google Calendar, eseguire poi `supabase/migrations/20260830_calendar_and_codes.sql`.

Per attivare la numerazione della fattura fiscale separata dalla proforma, la prenotazione atomica dei progressivi e lo storico XML immutabile, eseguire per ultima `supabase/migrations/20260830_fiscal_export_history.sql`.

Per collegare Google Calendar occorre inoltre creare in Google Cloud un client OAuth 2.0 di tipo **Applicazione web**, attivare la Google Calendar API e aggiungere tra le origini JavaScript autorizzate sia l’indirizzo locale (per esempio `http://localhost:5174`) sia il dominio di produzione. Inserire il relativo client ID in `.env`, riavviare Vite e usare **Collega Google Calendar** nell’Agenda. L’accesso Google dura per la sessione del browser; il pulsante **Sincronizza Google** importa e aggiorna le modifiche in entrambe le direzioni.

L'invio documenti apre l'applicazione email o WhatsApp già configurata sul dispositivo e registra data, canale e destinatario nel gestionale. Per allegare il PDF occorre prima salvarlo e aggiungerlo al messaggio; un invio completamente automatico richiederebbe un provider email esterno.

Il gestionale **non trasmette direttamente fatture elettroniche allo SDI**. Le proforma sono documenti non fiscali. Prima del download viene assegnato un progressivo fiscale distinto, l’XML viene validato contro lo schema FatturaPA 1.2.3 e ne viene conservata una copia immutabile; il file deve comunque essere importato, controllato e inviato dal titolare tramite **Aruba Fatturazione**. Se vengono selezionate più proforma, il gestionale produce un unico ZIP contenente tutti gli XML validati.

### Backup e documenti fiscali

Attivare un piano di backup adeguato in Supabase oppure esportare periodicamente il database. Gli snapshot JSON creati dal gestionale coprono i record e i metadati degli allegati, ma non sostituiscono un backup esterno dei file presenti in Supabase Storage. Le fatture proforma prodotte dal gestionale sono documenti non fiscali. L'XML delle fatture va importato in Aruba, controllato e poi trasmesso allo SDI dal titolare; emissione e conservazione restano gestite nel servizio fiscale. Prima dell'uso, completare in **Impostazioni** il regime fiscale e gli altri dati FatturaPA concordati con il commercialista.

## Dati da verificare

I recapiti, i termini di garanzia, i dati societari e le specifiche tecniche sono centralizzati in `src/data`. I valori non disponibili non sono stati inventati e sono marcati con TODO.
