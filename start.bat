@echo off
setlocal
cd /d %~dp0
echo ==================================================
echo   AVVIO GESTIONALE BUSTA PAGA COLF
echo ==================================================
echo.

:: Controlla se Node.js e installato
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRORE] Node.js non e installato.
    echo Scaricalo da: https://nodejs.org/
    pause
    exit /b
)

:: Installa le dipendenze se necessario
if not exist node_modules (
    echo [INFO] Installazione dipendenze in corso...
    call npm install
)

:: Avvia l'applicazione
echo [INFO] Avvio del server...
start http://localhost:3000
call npm run dev

pause
