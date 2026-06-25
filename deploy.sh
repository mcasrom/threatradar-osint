#!/bin/bash
set -e

COLOR_BLUE='\033[0;34m'
COLOR_GREEN='\033[0;32m'
COLOR_RED='\033[0;31m'
COLOR_YELLOW='\033[1;33m'
NC='\033[0m'

SERVER="deploy@178.105.80.193"
REMOTE_DIR="/home/deploy/apps/threatradar-osint"
PM2_ID="33"

echo -e "${COLOR_BLUE}=== [THREATRADAR OSINT - DEPLOY] ===${NC}"

# 1. Build local
echo -e "\n${COLOR_YELLOW}[1/3] Building...${NC}"
npm run build

# 2. Rsync dist al servidor
echo -e "\n${COLOR_YELLOW}[2/3] Syncing dist/ to server...${NC}"
rsync -avz --delete dist/ ${SERVER}:${REMOTE_DIR}/dist/

# 3. Restart PM2
echo -e "\n${COLOR_YELLOW}[3/3] Restarting PM2 (id ${PM2_ID})...${NC}"
ssh ${SERVER} "pm2 restart ${PM2_ID} && sleep 4 && pm2 logs threatradar --lines 8 --nostream"

echo -e "\n${COLOR_GREEN}✓ Deploy completado — https://threatradar.viajeinteligencia.com${NC}"
