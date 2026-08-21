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
# Limpeza ao sair (Ctrl+C, etc.)
# ---------------------------------------------------------------------------
cleanup() {
  echo ""
  info "Parando serviços..."
  if [ -f "$PID_FILE" ]; then
    while read -r pid; do
      kill "$pid" 2>/dev/null || true
    done < "$PID_FILE"
    rm -f "$PID_FILE"
  fi
  info "Parando Docker Compose..."
  cd "$ROOT_DIR/eevee-infrastructure" && docker compose down 2>/dev/null || true
  info "Parando Minikube..."
  minikube stop 2>/dev/null || true
  info "Todos os serviços foram parados."
}
trap cleanup SIGINT SIGTERM

# ---------------------------------------------------------------------------
# Checagem de pré-requisitos
# ---------------------------------------------------------------------------
check_cmd() {
  if ! command -v "$1" &>/dev/null; then
    error "$1 não está instalado. Rode ./install-deps.sh primeiro."
    return 1
  fi
}

info "Verificando pré-requisitos..."
MISSING=0
for cmd in node docker minikube kubectl make; do
  check_cmd "$cmd" || MISSING=1
done
if [ "$MISSING" -eq 1 ]; then
  error "Faltam dependências. Rode ./install-deps.sh primeiro."
  exit 1
fi

# ---------------------------------------------------------------------------
# 1. Iniciar Minikube
# ---------------------------------------------------------------------------
info "Iniciando Minikube..."
minikube start

# ---------------------------------------------------------------------------
# 2. Subir Redis + PostgreSQL (Docker Compose)
# ---------------------------------------------------------------------------
info "Subindo Redis e PostgreSQL..."
cd "$ROOT_DIR/eevee-infrastructure"
docker compose up -d
cd "$ROOT_DIR"

# ---------------------------------------------------------------------------
# 3. Carregar imagens dos workers no Minikube
# ---------------------------------------------------------------------------
info "Carregando imagens dos workers no Minikube..."
cd "$ROOT_DIR/node-worker-images"
make load-all
cd "$ROOT_DIR"

# ---------------------------------------------------------------------------
# 4. Carregar postgres:16 no Minikube
# ---------------------------------------------------------------------------
info "Carregando postgres:16 no Minikube..."
minikube image load postgres:16

# ---------------------------------------------------------------------------
# 5. Configurar .env do scheduler-api (se não existir)
# ---------------------------------------------------------------------------
ENV_FILE="$ROOT_DIR/scheduler-api/.env"
if [ ! -f "$ENV_FILE" ]; then
  info "Criando .env a partir do .env.example..."
  cp "$ROOT_DIR/scheduler-api/.env.example" "$ENV_FILE"
  warn "Preencha o JWT_SECRET e GROQ_API_KEY no arquivo platform-api/.env"
else
  info "Arquivo .env já existe."
fi

# ---------------------------------------------------------------------------
# 6. Iniciar serviços em background
# ---------------------------------------------------------------------------
> "$PID_FILE"  # Limpar arquivo de PIDs

info "Iniciando Platform API..."
cd "$ROOT_DIR/platform-api"
npm run start:dev &  echo $! >> "$PID_FILE"
cd "$ROOT_DIR"

info "Iniciando Assignment Runner..."
cd "$ROOT_DIR/assignment-runner"
npm run start:dev &  echo $! >> "$PID_FILE"
cd "$ROOT_DIR"

info "Iniciando Frontend..."
cd "$ROOT_DIR/front"
npm run dev &  echo $! >> "$PID_FILE"
cd "$ROOT_DIR"

# ---------------------------------------------------------------------------
# Resumo
# ---------------------------------------------------------------------------
echo ""
info "=========================================="
info " EEVEE iniciado com sucesso!"
info "=========================================="
info " Frontend:    http://localhost:3000"
info " Scheduler:   http://localhost:3010"
info " Redis:       localhost:6379"
info " PostgreSQL:  localhost:5433"
info "=========================================="
info ""
info "Pressione Ctrl+C para parar todos os serviços."
info ""

# Manter o script vivo e aguardar sinais
wait
