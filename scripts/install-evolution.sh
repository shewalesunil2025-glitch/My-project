#!/usr/bin/env bash
# ibaxai — installs the Evolution API (WhatsApp) server on a fresh Ubuntu VPS.
# Run as root:  curl -fsSL https://raw.githubusercontent.com/shewalesunil2025-glitch/My-project/main/scripts/install-evolution.sh | bash
# Creates Evolution API + Postgres + Redis behind Caddy with free HTTPS on <ip>.sslip.io,
# then prints the two values to put in Vercel. Safe to run again: keeps the existing key.
set -euo pipefail

DIR=/opt/ibaxai-evolution
mkdir -p "$DIR" && cd "$DIR"

# Small servers (2 GB RAM): add 2 GB of swap so Postgres + Evolution don't run out of memory.
if ! swapon --show | grep -q . && [ "$(awk '/MemTotal/ {print $2}' /proc/meminfo)" -lt 3500000 ]; then
  echo "==> Adding 2 GB swap…"
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile >/dev/null && swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# Security: automatic security updates, and a firewall that only allows SSH and the website ports.
if command -v apt-get >/dev/null 2>&1; then
  echo "==> Turning on automatic security updates and the firewall…"
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq && apt-get install -y -qq unattended-upgrades ufw >/dev/null
  dpkg-reconfigure -f noninteractive unattended-upgrades >/dev/null 2>&1 || true
  ufw allow OpenSSH >/dev/null && ufw allow 80/tcp >/dev/null && ufw allow 443/tcp >/dev/null
  ufw --force enable >/dev/null
fi

echo "==> Installing Docker (if needed)…"
command -v docker >/dev/null 2>&1 || curl -fsSL https://get.docker.com | sh

IP=$(curl -fsS https://api.ipify.org)
HOST="${IP//./-}.sslip.io"

if [ ! -f .env ]; then
  KEY=$(openssl rand -hex 24)
  PG=$(openssl rand -hex 16)
  cat > .env <<ENV
SERVER_URL=https://$HOST
SERVER_PORT=8080
AUTHENTICATION_API_KEY=$KEY
DEL_INSTANCE=false
LANGUAGE=en
LOG_LEVEL=ERROR,WARN,INFO
DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=postgresql://evolution:$PG@postgres:5432/evolution?schema=evolution_api
DATABASE_CONNECTION_CLIENT_NAME=ibaxai
DATABASE_SAVE_DATA_INSTANCE=true
DATABASE_SAVE_DATA_NEW_MESSAGE=false
DATABASE_SAVE_DATA_CONTACTS=false
DATABASE_SAVE_DATA_CHATS=false
DATABASE_SAVE_DATA_LABELS=false
DATABASE_SAVE_DATA_HISTORIC=false
CACHE_REDIS_ENABLED=true
CACHE_REDIS_URI=redis://redis:6379/6
CACHE_REDIS_PREFIX_KEY=ibaxai
CACHE_LOCAL_ENABLED=false
WEBHOOK_GLOBAL_ENABLED=false
CONFIG_SESSION_PHONE_CLIENT=ibaxai
CONFIG_SESSION_PHONE_NAME=Chrome
QRCODE_LIMIT=30
POSTGRES_PASSWORD=$PG
ENV
  chmod 600 .env
fi

cat > Caddyfile <<CADDY
$HOST {
  reverse_proxy evolution:8080
}
CADDY

cat > docker-compose.yml <<'YML'
services:
  evolution:
    image: evoapicloud/evolution-api:latest
    restart: always
    env_file: .env
    depends_on: [postgres, redis]
    volumes:
      - instances:/evolution/instances
  postgres:
    image: postgres:15
    restart: always
    environment:
      POSTGRES_DB: evolution
      POSTGRES_USER: evolution
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - pg:/var/lib/postgresql/data
  redis:
    image: redis:7
    restart: always
    command: redis-server --appendonly yes
    volumes:
      - redis:/data
  caddy:
    image: caddy:2
    restart: always
    ports: ["80:80", "443:443"]
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy:/data
volumes: { instances: {}, pg: {}, redis: {}, caddy: {} }
YML

echo "==> Starting the WhatsApp server (first time takes 2–3 minutes)…"
docker compose --env-file .env up -d

echo "==> Waiting for it to answer…"
for i in $(seq 1 60); do
  curl -fsS "https://$HOST" >/dev/null 2>&1 && break
  sleep 5
done

KEY=$(grep '^AUTHENTICATION_API_KEY=' .env | cut -d= -f2)
echo
echo "============================================================"
echo " WhatsApp server is ready. Put these 2 values in Vercel:"
echo
echo "   EVOLUTION_API_URL = https://$HOST"
echo "   EVOLUTION_API_KEY = $KEY"
echo
echo " (Keep the key secret. Don't share it in chat.)"
echo "============================================================"
