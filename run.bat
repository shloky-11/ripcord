@echo off
:: Ensure persistent console session when launched via explorer or secondary process
if not defined RIPCORD_INTERACTIVE (
    set "RIPCORD_INTERACTIVE=1"
    cmd /k ""%~f0" %*"
    exit /b
)

title Ripcord
color 0B

echo ===================================================
echo                     Ripcord
echo ===================================================
echo.

cd /d "%~dp0"

:: Append common local Node.js install paths if omitted from system PATH
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

:: Verify workspace directory integrity
if not exist "package.json" (
    color 0C
    echo [ERROR] package.json not found in working directory (%cd%).
    echo Ensure the application folder has been extracted from any zip archive.
    echo.
    pause
    exit /b 1
)

:: Validate Node.js runtime availability
node -v >nul 2>&1
if errorlevel 1 (
    color 0C
    echo [ERROR] Node.js runtime (v18+) is required to host the local service.
    echo Navigating to https://nodejs.org/en/download/
    explorer "https://nodejs.org/en/download/"
    echo.
    pause
    exit /b 1
)

echo [1/3] Node runtime:
node -v
echo.

:: Ensure project dependencies are installed
if not exist "node_modules\" (
    echo [2/3] Installing dependencies...
    call npm install
    if errorlevel 1 (
        color 0C
        echo [ERROR] Dependency installation failed.
        pause
        exit /b 1
    )
) else (
    echo [2/3] Dependencies verified.
)
echo.

:: Launch default web client
echo [3/3] Opening client at http://localhost:3000...
explorer "http://localhost:3000"

echo.
echo ===================================================
echo  Service active at http://localhost:3000
echo  Press Ctrl+C to stop.
echo ===================================================
echo.

call npm run dev
if errorlevel 1 (
    color 0C
    echo [ERROR] Server exited with code %errorlevel%.
)

pause
