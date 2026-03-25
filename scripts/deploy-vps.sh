#!/usr/bin/env bash
# deploy-vps.sh — Deploy umce-online on VPS via Dokploy API
# Install: scp scripts/deploy-vps.sh root@82.29.61.165:/opt/deploy-umce-online.sh
# Then:    chmod +x /opt/deploy-umce-online.sh
set -euo pipefail

APP_ID="RPSrwxmvOwLkV1Vrx0g9e"
DOKPLOY_URL="http://localhost:3000"
DOKPLOY_TOKEN="${DOKPLOY_API_KEY:-}"
HEALTH_URL="https://umce.online"
MAX_WAIT=120

log() { echo "[deploy] $(date +%H:%M:%S) $*"; }

if [ -z "$DOKPLOY_TOKEN" ]; then
  # Try reading from Dokploy config
  if [ -f /etc/dokploy/.env ]; then
    DOKPLOY_TOKEN=$(grep -oP 'AUTH_TOKEN=\K.*' /etc/dokploy/.env 2>/dev/null || true)
  fi
  if [ -z "$DOKPLOY_TOKEN" ]; then
    log "ERROR: DOKPLOY_API_KEY not set and could not read from config"
    exit 1
  fi
fi

log "Triggering redeploy for umce-online-app ($APP_ID)..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  "$DOKPLOY_URL/api/application.redeploy" \
  -H "Authorization: Bearer $DOKPLOY_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"applicationId\": \"$APP_ID\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" -ge 400 ]; then
  log "ERROR: Dokploy API returned HTTP $HTTP_CODE"
  log "$BODY"
  exit 1
fi

log "Redeploy triggered (HTTP $HTTP_CODE). Waiting for healthcheck..."

ELAPSED=0
while [ $ELAPSED -lt $MAX_WAIT ]; do
  sleep 10
  ELAPSED=$((ELAPSED + 10))
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$HEALTH_URL" 2>/dev/null || echo "000")
  if [ "$STATUS" = "200" ]; then
    log "Healthcheck passed after ${ELAPSED}s — HTTP 200"
    exit 0
  fi
  log "Waiting... (${ELAPSED}s, HTTP $STATUS)"
done

log "ERROR: Healthcheck failed after ${MAX_WAIT}s"
exit 1
