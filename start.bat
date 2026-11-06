@echo off
title Ripcord - High-Speed Stream Ripper

echo ===================================================
echo             Launching Ripcord in 1-Click
echo ===================================================
echo.

cd /d "%~dp0"

:: 1. Check if package.json exists (protects against running from unextracted zip)
if not exist "%~dp0package.json" (
    echo [ERROR] package.json was not found in this directory.
    echo.
    echo It looks like you ran start.bat directly from inside a ZIP file.
    echo.
    echo How to fix:
    echo  1. Right-click the downloaded zip file
    echo  2. Select "Extract All..." and extract to a normal folder
    echo  3. Open the extracted folder and double-click start.bat
    echo.
    pause
    exit /b 1
)

:: 2. Check if Node.js is installed
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ===================================================
    echo  ERROR: Node.js is not installed on this computer.
    echo ===================================================
    echo.
    echo Ripcord requires Node.js (version 18 or newer).
    echo.
    echo Opening https://nodejs.org/en/download/ in your browser...
    start "" "https://nodejs.org/en/download/"
    echo.
    echo Please download and install Node.js, then double-click start.bat again.
    echo.
    pause
    exit /b 1
)

echo [1/3] Node.js detected:
node -v
echo.

:: 3. Check / Install dependencies
if not exist "%~dp0node_modules\" (
    echo [2/3] Installing dependencies (first run only, please wait)...
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] npm install encountered an error. Please check your internet connection.
        echo.
        pause
        exit /b 1
    )
) else (
    echo [2/3] Dependencies ready.
)
echo.

:: 4. Launch browser and dev server
echo [3/3] Opening Ripcord in your browser...
start "" "http://localhost:3000"

echo.
echo ===================================================
echo  Ripcord is now RUNNING at http://localhost:3000
echo  Keep this window open while using the app.
echo  To stop Ripcord, press Ctrl+C or close this window.
echo ===================================================
echo.

call npm run dev
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Ripcord stopped unexpectedly (code %errorlevel%).
)

echo.
echo Server stopped.
pause
