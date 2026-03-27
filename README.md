# Gestionale Colf & Badanti - Standalone

Questa applicazione può essere utilizzata come una "App Standalone" sul tuo computer.

## Come avviarla con il file .bat

1. Assicurati di avere **Node.js** installato (scaricalo da [nodejs.org](https://nodejs.org/)).
2. Scarica o clona questa cartella sul tuo computer.
3. Fai doppio clic sul file `start.bat`.
   - La prima volta installerà automaticamente i componenti necessari.
   - Aprirà il browser all'indirizzo `http://localhost:3000`.

## Come "Installarla" come App (PWA)

Una volta aperta l'app nel browser (Chrome o Edge):

1. Guarda nella barra degli indirizzi (a destra).
2. Clicca sull'icona **"Installa Gestionale Colf & Badanti"** (un piccolo monitor con una freccia).
3. L'app verrà aggiunta al tuo desktop e al menu Start, e si aprirà in una finestra separata senza la barra del browser, proprio come un programma nativo.

## Configurazione Firebase

Ricorda che l'app utilizza Firebase per il database. Se la esegui localmente, assicurati che le chiavi in `firebase-applet-config.json` siano corrette e che l'URL `http://localhost:3000` sia aggiunto ai domini autorizzati nella console di Firebase (Authentication -> Settings -> Authorized domains).
