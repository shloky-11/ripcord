@echo off
setlocal enabledelayedexpansion
title Ripcord - High-Speed Stream Ripper

echo ===================================================
echo             Launching Ripcord in 1-Click
echo ===================================================
echo.

cd /d "%~dp0"

:: 1. Check if user ran directly inside an unextracted ZIP
echo "%~dp0" | findstr /i /c:"\AppData\Local\Temp" >nul
if %errorlevel% equ 0 (
    echo [ERROR] You ran start.bat directly from inside a ZIP file!
    echo.
    echo Fix:
    echo 1. Right-click the downloaded ripcord.zip
    echo 2. Click "Extract All..." and extract to a normal folder
    echo 3. Open that folder and run start.bat
    echo.
    pause
    exit /b
)

:: 2. Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed on your computer!
    echo.
    echo Opening Node.js download page in your browser...
    start https://nodejs.org/en/download/
    echo.
    echo Please install Node.js (LTS version) and run start.bat again.
    echo.
    pause
    exit /b
)

echo [1/3] Node.js detected:
node -v

:: 3. Check / Install dependencies
if not exist "node_modules\" (
    echo.
    echo [2/3] Installing dependencies (first-time only, please wait 30 seconds)...
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] npm install failed. Make sure you have an internet connection.
        pause
        exit /b
    )
) else (
    echo [2/3] Dependencies ready.
)

echo.
echo [3/3] Opening Ripcord at http://localhost:3000...
start http://localhost:3000

echo.
echo ===================================================
echo Ripcord is now RUNNING! 
echo Keep this command prompt window open while using the app.
echo Access URL: http://localhost:3000
echo ===================================================
echo.

call npm run dev

echo.
echo Ripcord server stopped.
pause
