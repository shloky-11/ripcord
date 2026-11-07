@echo off
setlocal EnableDelayedExpansion

REM Ensure persistent console session
if not defined RIPCORD_INTERACTIVE (
    set "RIPCORD_INTERACTIVE=1"
    cmd.exe /k ""%~f0" %*"
    exit /b
)

title Ripcord
color 0B

echo ===================================================
echo                     Ripcord
echo ===================================================
echo.

cd /d "%~dp0"

REM Detect Node.js installation paths if missing from system PATH
if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;%PATH%"
if exist "%ProgramFiles(x86)%\nodejs\node.exe" set "PATH=%ProgramFiles(x86)%\nodejs;%PATH%"
if exist "%LOCALAPPDATA%\Programs\node\node.exe" set "PATH=%LOCALAPPDATA%\Programs\node;%PATH%"
if exist "%APPDATA%\npm" set "PATH=%APPDATA%\npm;%PATH%"

REM Check workspace files
if exist "package.json" goto :check_node
color 0C
echo [ERROR] package.json not found in working directory.
echo Please extract the entire archive before launching Ripcord.
echo.
pause
exit /b 1

:check_node
REM Validate Node runtime
node -v >nul 2>&1
if not errorlevel 1 goto :node_found
color 0C
echo [ERROR] Node.js 18 or newer was not detected on this system.
echo Opening download page at https://nodejs.org/en/download/
explorer "https://nodejs.org/en/download/"
echo.
echo Install Node.js, then launch Ripcord again.
pause
exit /b 1

:node_found
echo [1/3] Node.js detected:
node -v
echo.

REM Verify dependencies
if exist "node_modules\" goto :deps_ready
echo [2/3] Installing dependencies...
call npm install
if errorlevel 1 (
    echo [INFO] Retrying with --legacy-peer-deps...
    call npm install --legacy-peer-deps
)
if errorlevel 1 (
    color 0C
    echo.
    echo [ERROR] npm install encountered an error.
    echo Try running: npm install --legacy-peer-deps manually.
    pause
    exit /b 1
)
:deps_ready
echo [2/3] Dependencies ready.
echo.

REM Open client browser
echo [3/3] Opening client at http://localhost:3000...
explorer "http://localhost:3000"

echo.
echo ===================================================
echo  Ripcord server is active at http://localhost:3000
echo  Keep this console window open while using Ripcord.
echo  Press Ctrl+C to stop.
echo ===================================================
echo.

call npm run dev
if errorlevel 1 (
    color 0C
    echo.
    echo [ERROR] Process stopped with code %errorlevel%.
)

pause
