#!/usr/bin/env bash
# 1-Click launcher for Mac and Linux
cd "$(dirname "$0")"

echo "==================================================="
echo "            Launching Ripcord in 1-Click"
echo "==================================================="

if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "[1/3] Installing dependencies (first run only)..."
    npm install
fi

echo "[2/3] Opening browser at http://localhost:3000..."
(sleep 2 && (open http://localhost:3000 2>/dev/null || xdg-open http://localhost:3000 2>/dev/null)) &

echo "[3/3] Starting Ripcord server..."
npm run dev
