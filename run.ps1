# PowerShell 1-Click Launcher for Windows
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "            Launching Ripcord in 1-Click           " -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

# Auto-detect standard Node.js installations in case PATH wasn't refreshed
$env:PATH += ";$env:ProgramFiles\nodejs;$env:LOCALAPPDATA\Programs\node"

if (-not (Test-Path "package.json")) {
    Write-Host "[ERROR] package.json not found in this folder." -ForegroundColor Red
    Write-Host "Please extract the downloaded ZIP archive before running!" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit..."
    exit 1
}

try {
    $nodeVer = & node -v
    Write-Host "[1/3] Node.js detected: $nodeVer" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js is not installed on this computer." -ForegroundColor Red
    Write-Host "Opening Node.js download page: https://nodejs.org" -ForegroundColor Yellow
    Start-Process "https://nodejs.org/en/download/"
    Write-Host ""
    Write-Host "Please install Node.js (LTS), then run this script again." -ForegroundColor Yellow
    Read-Host "Press Enter to exit..."
    exit 1
}

if (-not (Test-Path "node_modules")) {
    Write-Host "[2/3] Installing dependencies (first run only, please wait)..." -ForegroundColor Yellow
    & npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] npm install failed. Please check your internet connection." -ForegroundColor Red
        Read-Host "Press Enter to exit..."
        exit 1
    }
} else {
    Write-Host "[2/3] Dependencies ready." -ForegroundColor Green
}

Write-Host "[3/3] Opening browser at http://localhost:3000..." -ForegroundColor Green
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host " Ripcord is RUNNING at http://localhost:3000       " -ForegroundColor Cyan
Write-Host " Keep this PowerShell window open while using it! " -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

& npm run dev
Read-Host "Server stopped. Press Enter to exit..."
