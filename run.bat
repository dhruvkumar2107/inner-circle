@echo off
REM Starts the Inner Circle web app (client) in development mode.
cd /d "%~dp0inner-circle"
npm run dev --workspace client
pause
