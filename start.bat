@echo off
title Ripcord - High-Speed Stream Ripper
echo ===================================================
echo             Launching Ripcord in 1-Click
echo ===================================================

cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please download and install Node.js from https://nodejs.org
    pause
    exit /b
)

if not exist "node_modules\" (
    echo [1/3] Installing dependencies (first run only)...
    call npm install
)

echo [2/3] Opening Ripcord in your default browser...
start http://localhost:3000

echo [3/3] Starting server...
call npm run dev
pause
