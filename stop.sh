#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; }

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
PID_FILE="/tmp/eevee-pids"

# ---------------------------------------------------------------------------
# Matar processos dos serviços
# ---------------------------------------------------------------------------
if [ -f "$PID_FILE" ]; then
  info "Parando processos dos serviços..."
  while read -r pid; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
      info "Processo $pid finalizado."
    fi
  done < "$PID_FILE"
  rm -f "$PID_FILE"
else
  warn "Nenhum arquivo de PIDs encontrado. Tentando matar processos por nome..."
  pkill -f "nest start --watch" 2>/dev/null || true
  pkill -f "next dev" 2>/dev/null || true
fi

# ---------------------------------------------------------------------------
# Parar Docker Compose
# ---------------------------------------------------------------------------
info "Parando Docker Compose (Redis + PostgreSQL)..."
cd "$ROOT_DIR/eevee-infrastructure" && docker compose down 2>/dev/null || true

# ---------------------------------------------------------------------------
# Parar Minikube
# ---------------------------------------------------------------------------
info "Parando Minikube..."
minikube stop 2>/dev/null || true

info "Todos os serviços foram parados com sucesso!"
