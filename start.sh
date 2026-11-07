#!/usr/bin/env bash
# 1-Click launcher for Mac and Linux
cd "$(dirname "$0")"

CYAN="\033[1;36m"
YELLOW="\033[1;33m"
RESET="\033[0m"

echo ""
echo -e "${CYAN}  ===================================================================${RESET}"
echo -e "${CYAN}    ██████╗  ██╗ ██████╗   ██████╗  ██████╗  ██████╗  ██████╗ ${RESET}"
echo -e "${CYAN}    ██╔══██╗ ██║ ██╔══██╗ ██╔════╝ ██╔═══██╗ ██╔══██╗ ██╔══██╗${RESET}"
echo -e "${CYAN}    ██████╔╝ ██║ ██████╔╝ ██║      ██║   ██║ ██████╔╝ ██║  ██║${RESET}"
echo -e "${CYAN}    ██╔══██╗ ██║ ██╔═══╝  ██║      ██║   ██║ ██╔══██╗ ██║  ██║${RESET}"
echo -e "${CYAN}    ██║  ██║ ██║ ██║      ╚██████╗ ╚██████╔╝ ██║  ██║ ██████╔╝${RESET}"
echo -e "${CYAN}    ╚═╝  ╚═╝ ╚═╝ ╚═╝       ╚═════╝  ╚═════╝  ╚═╝  ╚═╝ ╚═════╝ ${RESET}"
echo -e "${YELLOW}           ⚡ HIGH-SPEED STREAM ENGINE & MEDIA SUITE ⚡        ${RESET}"
echo -e "${CYAN}  ===================================================================${RESET}"
echo ""

if [ ! -f "package.json" ]; then
    echo "[ERROR] package.json not found in this directory."
    echo "Please make sure you have extracted the archive completely."
    read -p "Press Enter to exit..."
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed on this computer."
    echo "Please download and install Node.js (LTS version) from https://nodejs.org"
    read -p "Press Enter to exit..."
    exit 1
fi

echo "[1/3] Node.js detected: $(node -v)"

if [ ! -d "node_modules" ]; then
    echo "[2/3] Installing dependencies (first run only, please wait)..."
    npm install || npm install --legacy-peer-deps
    if [ $? -ne 0 ]; then
        echo "[ERROR] npm install failed. Please check your internet connection."
        read -p "Press Enter to exit..."
        exit 1
    fi
else
    echo "[2/3] Dependencies ready."
fi

echo "[3/3] Opening browser at http://localhost:3000..."
(sleep 2 && (open http://localhost:3000 2>/dev/null || xdg-open http://localhost:3000 2>/dev/null)) &

echo ""
echo "==================================================="
echo " Ripcord is now RUNNING at http://localhost:3000"
echo " Press Ctrl+C in this terminal to stop the server."
echo "==================================================="
echo ""

npm run dev
