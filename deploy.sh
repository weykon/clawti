#!/bin/bash
# deploy.sh — Deploy clawti stack to usa-ny
# Usage: ./deploy.sh [--full|--frontend|--alan|--worker|--all]
#
# Services:
#   clawti-frontend  — Next.js app on :3002
#   alan-bot         — Hono bot service on :7088
#   clawti-worker    — Task queue worker
#   clawti-pg        — Postgres 16 on :5433 (Docker)
#
# Domain: clawti.clawhivemarket.com (nginx → :3002)

set -euo pipefail

SERVER="usa-ny"
REMOTE_DIR="/root/p"
LOCAL_FRONTEND="/Users/weykon/Desktop/p/clawti-frontend"
LOCAL_ALAN="/Users/weykon/Desktop/p/alan-bot-service"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[deploy]${NC} $1"; }
warn() { echo -e "${YELLOW}[warn]${NC} $1"; }
err() { echo -e "${RED}[error]${NC} $1"; exit 1; }

sync_frontend() {
  log "Syncing clawti-frontend..."
  rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude 'dist' \
    --exclude '.claude' \
    --exclude '.serena' \
    --exclude '.env.local' \
    "$LOCAL_FRONTEND/" "$SERVER:$REMOTE_DIR/clawti-frontend/"
}

sync_alan() {
  log "Syncing alan-bot-service..."
  rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude 'dist' \
    --exclude '.claude' \
    --exclude '.serena' \
    --exclude '.env' \
    --exclude 'workspace' \
    "$LOCAL_ALAN/" "$SERVER:$REMOTE_DIR/alan-bot-service/"
}

build_frontend() {
  log "Installing deps & building frontend..."
  ssh "$SERVER" "cd $REMOTE_DIR/clawti-frontend && npm install && npx next build"
}

install_alan() {
  log "Installing alan-bot deps..."
  ssh "$SERVER" "cd $REMOTE_DIR/alan-bot-service && npm install"
}

restart_service() {
  local svc="$1"
  log "Restarting $svc..."
  ssh "$SERVER" "systemctl restart $svc && sleep 2 && systemctl is-active $svc"
}

deploy_frontend() {
  sync_frontend
  build_frontend
  restart_service "clawti-frontend"
  restart_service "clawti-worker"
}

deploy_alan() {
  sync_alan
  install_alan
  restart_service "alan-bot"
}

run_migration() {
  log "Running database migration..."
  ssh "$SERVER" "docker exec -i clawti-pg psql -U clawti -d clawti < $REMOTE_DIR/clawti-frontend/db/schema.sql"
}

status() {
  log "Service status:"
  ssh "$SERVER" "
    echo '=== Services ==='
    systemctl is-active clawti-frontend alan-bot clawti-worker 2>/dev/null | paste - - - | awk '{print \"frontend:\", \$1, \" alan:\", \$2, \" worker:\", \$3}'
    echo '=== Ports ==='
    ss -tlnp | grep -E '3002|7088' | awk '{print \$4, \$6}'
    echo '=== Docker PG ==='
    docker ps --filter name=clawti-pg --format 'table {{.Status}}\t{{.Ports}}'
    echo '=== Health ==='
    curl -s http://127.0.0.1:7088/health 2>/dev/null | head -1
    curl -s -o /dev/null -w 'frontend: HTTP %{http_code}\n' http://127.0.0.1:3002 2>/dev/null
  "
}

logs() {
  local svc="${1:-clawti-frontend}"
  ssh "$SERVER" "journalctl -u $svc --no-pager -n 50 -f"
}

setup_ssl() {
  log "Setting up SSL certificate..."
  ssh "$SERVER" "certbot --nginx -d clawti.clawhivemarket.com --non-interactive --agree-tos --email admin@clawhivemarket.com"
}

# --- Full first-time setup ---
full_setup() {
  log "=== Full deployment ==="

  # 1. Postgres
  log "Checking Postgres..."
  ssh "$SERVER" "docker ps --filter name=clawti-pg -q" | grep -q . || {
    log "Creating Postgres container..."
    ssh "$SERVER" "docker run -d --name clawti-pg --restart unless-stopped \
      -e POSTGRES_USER=clawti \
      -e POSTGRES_PASSWORD=clawti_secret_2024 \
      -e POSTGRES_DB=clawti \
      -p 5433:5432 \
      -v clawti_pgdata:/var/lib/postgresql/data \
      postgres:16-alpine"
    sleep 3
  }

  # 2. Sync code
  sync_frontend
  sync_alan

  # 3. Install & build
  install_alan
  build_frontend

  # 4. Run migration
  run_migration

  # 5. Start services
  ssh "$SERVER" "systemctl daemon-reload"
  restart_service "alan-bot"
  restart_service "clawti-frontend"
  restart_service "clawti-worker"

  # 6. Reload nginx
  ssh "$SERVER" "nginx -t && systemctl reload nginx"

  log "=== Deployment complete ==="
  status
}

# --- CLI ---
case "${1:-status}" in
  --full)      full_setup ;;
  --frontend)  deploy_frontend ;;
  --alan)      deploy_alan ;;
  --worker)    restart_service "clawti-worker" ;;
  --migrate)   run_migration ;;
  --status)    status ;;
  --logs)      logs "${2:-clawti-frontend}" ;;
  --ssl)       setup_ssl ;;
  --all)       deploy_frontend; deploy_alan ;;
  *)
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  --full       First-time full setup (PG + code + build + services)"
    echo "  --frontend   Deploy frontend only (sync + build + restart)"
    echo "  --alan       Deploy alan bot only (sync + install + restart)"
    echo "  --worker     Restart worker only"
    echo "  --all        Deploy frontend + alan"
    echo "  --migrate    Run database migration"
    echo "  --status     Show service status"
    echo "  --logs [svc] Tail logs (default: clawti-frontend)"
    echo "  --ssl        Set up SSL certificate"
    echo ""
    echo "Services: clawti-frontend, alan-bot, clawti-worker"
    ;;
esac
