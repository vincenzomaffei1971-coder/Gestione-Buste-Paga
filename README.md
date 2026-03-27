# Gestionale Busta Paga Colf - Standalone

Questa applicazione può essere utilizzata come una "App Standalone" sul tuo computer.

## Come scaricare l'app da AI Studio

1. Vai nel menu **Settings** (Impostazioni) in alto a destra nell'interfaccia di AI Studio.
2. Seleziona **Export to ZIP** (Esporta come ZIP) per scaricare tutti i file sul tuo computer.
3. Estrai la cartella ZIP in una posizione a tua scelta.

## Come avviarla con il file .bat

1. Assicurati di avere **Node.js** installato (scaricalo da [nodejs.org](https://nodejs.org/)).
2. Apri la cartella estratta.
3. Fai doppio clic sul file `start.bat`.
   - La prima volta installerà automaticamente i componenti necessari.
   - Aprirà il browser all'indirizzo `http://localhost:3000`.

## Come "Installarla" come App (PWA)

Una volta aperta l'app nel browser (Chrome o Edge):

1. Guarda nella barra degli indirizzi (a destra).
2. Clicca sull'icona **"Installa Gestionale Busta Paga Colf"** (un piccolo monitor con una freccia).
3. L'app verrà aggiunta al tuo desktop e al menu Start, e si aprirà in una finestra separata senza la barra del browser, proprio come un programma nativo.

## Come Ospitare l'App su GitLab (GitLab Pages)

Per rendere l'app accessibile via web a chiunque (previa autenticazione), puoi caricarla su GitLab:

1. **Crea un nuovo progetto** su GitLab.
2. **Carica tutti i file** dell'applicazione nel repository (inclusi `.gitlab-ci.yml` e `firebase-applet-config.json`).
3. **Configura il base path** (se necessario):
   - Se il tuo URL GitLab sarà `https://username.gitlab.io/nome-progetto/`, apri `vite.config.ts`.
   - Decommenta la riga `base: '/nome-progetto/'` e inserisci il nome del tuo progetto.
4. **Attendi la Pipeline**: GitLab avvierà automaticamente una "Pipeline" (visibile sotto *Build -> Pipelines*). Al termine, l'app sarà pubblicata.
5. **Trova l'URL**: Vai su *Deploy -> Pages* nel menu di sinistra di GitLab per trovare l'indirizzo web della tua app.
6. **Configura Firebase**:
   - Copia l'URL della tua pagina GitLab (es. `https://username.gitlab.io`).
   - Vai nella [Console Firebase](https://console.firebase.google.com/).
   - Vai su *Authentication -> Settings -> Authorized domains*.
   - Clicca su "Add domain" e incolla l'URL di GitLab (senza `https://` e senza percorsi finali, es: `username.gitlab.io`).

L'app sarà ora accessibile da qualsiasi dispositivo connesso a internet, mantenendo le stesse regole di accesso e approvazione amministratore.

Ricorda che l'app utilizza Firebase per il database. Se la esegui localmente, assicurati che le chiavi in `firebase-applet-config.json` siano corrette e che l'URL `http://localhost:3000` sia aggiunto ai domini autorizzati nella console di Firebase (Authentication -> Settings -> Authorized domains).
