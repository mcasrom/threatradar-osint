#!/bin/bash
set -e

COLOR_BLUE='\033[0;34m'
COLOR_GREEN='\033[0;32m'
COLOR_RED='\033[0;31m'
COLOR_YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${COLOR_BLUE}=== [THREATRADAR OSINT - HETZNER DEPLOY] ===${NC}"
echo -e "Target: Hetzner Cloud Ubuntu 22.04+"

DOMAIN="${1:-threatradar.tudominio.com}"
EMAIL="${2:-threatradar-osint@viajeinteligencia.com}"

echo -e "\n${COLOR_YELLOW}[*] Domain: ${DOMAIN}${NC}"
echo -e "${COLOR_YELLOW}[*] Email: ${EMAIL}${NC}"

echo -e "\n${COLOR_BLUE}[*] Updating system packages...${NC}"
apt update && apt upgrade -y

echo -e "\n${COLOR_BLUE}[*] Installing required dependencies...${NC}"
apt install -y \
    curl \
    git \
    nginx \
    certbot \
    python3-certbot-nginx \
    nmap \
    bind9-dnsutils \
    whois \
    traceroute \
    sslscan \
    build-essential

echo -e "\n${COLOR_BLUE}[*] Installing Node.js 20.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo -e "\n${COLOR_BLUE}[*] Installing OSINT tools...${NC}"

if ! command -v theHarvester &> /dev/null; then
    echo -e "${COLOR_GREEN}[+] Installing theHarvester...${NC}"
    pip3 install theHarvester
fi

if ! command -v subfinder &> /dev/null; then
    echo -e "${COLOR_GREEN}[+] Installing subfinder...${NC}"
    go install -v github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest 2>/dev/null || true
    cp ~/go/bin/subfinder /usr/local/bin/ 2>/dev/null || true
fi

if ! command -v httpx &> /dev/null; then
    echo -e "${COLOR_GREEN}[+] Installing httpx...${NC}"
    go install -v github.com/projectdiscovery/httpx/cmd/httpx@latest 2>/dev/null || true
    cp ~/go/bin/httpx /usr/local/bin/ 2>/dev/null || true
fi

if ! command -v nuclei &> /dev/null; then
    echo -e "${COLOR_GREEN}[+] Installing nuclei...${NC}"
    go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest 2>/dev/null || true
    cp ~/go/bin/nuclei /usr/local/bin/ 2>/dev/null || true
fi

if ! command -v nikto &> /dev/null; then
    echo -e "${COLOR_GREEN}[+] Installing nikto...${NC}"
    apt install -y nikto
fi

if ! command -v wafw00f &> /dev/null; then
    echo -e "${COLOR_GREEN}[+] Installing wafw00f...${NC}"
    pip3 install wafw00f
fi

echo -e "\n${COLOR_BLUE}[*] Setting up ThreatRadar OSINT...${NC}"
APP_DIR="/opt/threatradar-osint"

if [ -d "$APP_DIR" ]; then
    echo -e "${COLOR_YELLOW}[!] Directory exists, pulling latest changes...${NC}"
    cd "$APP_DIR"
    git pull
else
    git clone https://github.com/mcasrom/threatradar-osint.git "$APP_DIR"
    cd "$APP_DIR"
fi

echo -e "\n${COLOR_BLUE}[*] Installing npm dependencies...${NC}"
npm ci --only=production

echo -e "\n${COLOR_BLUE}[*] Setting up environment...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${COLOR_YELLOW}[!] Edit .env with your API keys:${NC}"
    echo -e "  nano ${APP_DIR}/.env"
fi

echo -e "\n${COLOR_BLUE}[*] Building application...${NC}"
npm run build

echo -e "\n${COLOR_BLUE}[*] Installing PM2 process manager...${NC}"
npm install -g pm2

echo -e "\n${COLOR_BLUE}[*] Configuring PM2...${NC}"
pm2 delete threatradar 2>/dev/null || true
pm2 start dist/server.cjs --name threatradar --env production
pm2 save
pm2 startup systemd -u root --hp /root

echo -e "\n${COLOR_BLUE}[*] Configuring Nginx...${NC}"
sed "s/threatradar.tudominio.com/${DOMAIN}/g" deploy/nginx.conf > /etc/nginx/sites-available/threatradar
ln -sf /etc/nginx/sites-available/threatradar /etc/nginx/sites-enabled/threatradar
rm -f /etc/nginx/sites-enabled/default

mkdir -p /var/www/certbot
nginx -t && systemctl reload nginx

echo -e "\n${COLOR_BLUE}[*] Setting up SSL certificate...${NC}"
certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos --email "${EMAIL}"

echo -e "\n${COLOR_BLUE}[*] Configuring firewall...${NC}"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo -e "\n${COLOR_GREEN}=== [DEPLOYMENT COMPLETE] ===${NC}"
echo -e "Application: https://${DOMAIN}"
echo -e "Health check: https://${DOMAIN}/api/health"
echo -e "PM2 status: pm2 status"
echo -e "PM2 logs: pm2 logs threatradar"
echo -e ""
echo -e "${COLOR_YELLOW}Next steps:${NC}"
echo -e "1. Edit .env with your API keys"
echo -e "2. Restart: pm2 restart threatradar"
echo -e "3. Monitor: pm2 monit"
