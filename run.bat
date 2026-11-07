@echo off
:: Force the command prompt window to STAY OPEN under cmd /k so it NEVER closes or flashes
if not defined RIPCORD_INTERACTIVE (
    set "RIPCORD_INTERACTIVE=1"
    cmd /k ""%~f0" %*"
    exit /b
)

title Ripcord - Media Downloader
color 0B

echo ===================================================
echo             Launching Ripcord
echo ===================================================
echo.

cd /d "%~dp0"

:: Auto-detect standard Node.js directories in case Windows PATH is not updated yet
if exist "%ProgramFiles%\nodejs\node.exe" (
    set "PATH=%ProgramFiles%\nodejs;%PATH%"
)
if exist "%ProgramFiles(x86)%\nodejs\node.exe" (
    set "PATH=%ProgramFiles(x86)%\nodejs;%PATH%"
)
if exist "%LOCALAPPDATA%\Programs\node\node.exe" (
    set "PATH=%LOCALAPPDATA%\Programs\node;%PATH%"
)
if exist "%APPDATA%\npm" (
    set "PATH=%APPDATA%\npm;%PATH%"
)

:: 1. Check if package.json exists (verifies folder is extracted from ZIP)
if not exist "package.json" (
    color 0C
    echo [ERROR] package.json was not found in this folder.
    echo.
    echo It looks like you ran this file directly from inside a ZIP file.
    echo.
    echo HOW TO FIX:
    echo  1. Right-click the downloaded zip archive
    echo  2. Click "Extract All..." and extract to a normal folder
    echo  3. Open that extracted folder and double-click Ripcord.exe (or run.bat)
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

:: 2. Check if Node.js is installed
node -v >nul 2>&1
if errorlevel 1 (
    color 0C
    echo ===================================================
    echo  ERROR: Node.js was not detected on your computer!
    echo ===================================================
    echo.
    echo Ripcord needs Node.js (version 18 or newer) to run locally.
    echo.
    echo Opening https://nodejs.org/en/download/ in your browser...
    explorer "https://nodejs.org/en/download/"
    echo.
    echo Once you install Node.js, run Ripcord.exe again!
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo [1/3] Node.js detected:
node -v
echo.

:: 3. Check / Install dependencies
if not exist "node_modules\" (
    echo [2/3] Installing dependencies (first run only, please wait 1-2 minutes)...
    call npm install
    if errorlevel 1 (
        color 0C
        echo.
        echo [ERROR] npm install encountered an error. Please check your internet connection.
        echo Press any key to exit...
        pause >nul
        exit /b 1
    )
) else (
    echo [2/3] Dependencies ready.
)
echo.

:: 4. Launch browser using explorer.exe
echo [3/3] Opening Ripcord at http://localhost:3000...
explorer "http://localhost:3000"

echo.
echo ===================================================
echo  Ripcord is now RUNNING at http://localhost:3000
echo  Keep this console window open while using Ripcord!
echo  To stop the server, press Ctrl+C or close this window.
echo ===================================================
echo.

call npm run dev
if errorlevel 1 (
    color 0C
    echo.
    echo [ERROR] Ripcord stopped unexpectedly (code %errorlevel%).
)

echo.
echo Ripcord server stopped.
echo Press any key to close this window...
pause >nul
