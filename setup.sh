#!/bin/bash
# THREATRADAR OSINT - Automated Setup and Deploy Configuration File
# Intended environment: Lubuntu 22.04+ / Linux Mint / Debian Standard
# Coded by: Senior Linux Systems Architect

COLOR_BLUE='\033[0;34m'
COLOR_GREEN='\033[0;32m'
COLOR_RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${COLOR_BLUE}=== [THREATRADAR OSINT SETUP UTILITY] ===${NC}"
echo -e "Target system: Linux Desktop & SOC Server Gateway"

# Assert standard privileges or check binaries
echo -e "\n[*] Checking required local system binary dependencies..."
command -v node >/dev/null 2>&1 || { echo -e "${COLOR_RED}[!] Error: Node.js is required but not installed.${NC}" >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${COLOR_RED}[!] Error: npm is required but not installed.${NC}" >&2; exit 1; }

echo -e "${COLOR_GREEN}[✔] Node.js and npm verified.${NC}"

# Installing standard project dependencies
echo -e "\n[*] Building and installing project packages..."
npm install

# Build the system
echo -e "\n[*] Running building compiler (Vite and Esbuild integration Bundle)..."
npm run build

echo -e "\n${COLOR_GREEN}=== [SETUP COMPLETED SUCCESSFUL] ===${NC}"
echo -e "You can launch the integrated SOC server by executing:"
echo -e "  npm run dev"
echo -e "The server will bind on 0.0.0.0 and expose port 3000."
