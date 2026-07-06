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

# ---------------------------------------------------------------------------
# Checagem de pré-requisitos
# ---------------------------------------------------------------------------
check_cmd() {
  if ! command -v "$1" &>/dev/null; then
    error "$1 não está instalado. Instale antes de continuar."
    return 1
  fi
}

info "Verificando pré-requisitos..."
MISSING=0
for cmd in node docker minikube kubectl make; do
  check_cmd "$cmd" || MISSING=1
done
if [ "$MISSING" -eq 1 ]; then
  error "Faltam dependências. Corrija e rode novamente."
  exit 1
fi
info "Todos os pré-requisitos encontrados."

# ---------------------------------------------------------------------------
# Instalar dependências npm
# ---------------------------------------------------------------------------
info "Instalando dependências do scheduler-api..."
cd "$ROOT_DIR/scheduler-api"
npm install

info "Instalando dependências do front-end..."
cd "$ROOT_DIR/front"
npm install

# ---------------------------------------------------------------------------
# Build das imagens Docker dos workers (seguindo README.md)
# ---------------------------------------------------------------------------
info "Buildando imagens Docker dos workers..."
cd "$ROOT_DIR/node-worker-images"

docker build -t worker-node-default-img:latest ./node
docker build -t worker-node-teraorm-img:latest ./node-teraorm
docker build -t worker-nestjs-default-img:latest ./nest.js
docker build -t worker-node-grpcjs-img:latest -f ./grpc/Dockerfile .
docker build -t worker-nextjs-cypress-img:latest ./next.js-cypress
docker build -t worker-react-cypress-img:latest ./reactjs-cypress
docker build -t eevee-worker-bootstrap:latest ./worker-bootstrap

# ---------------------------------------------------------------------------
# Puxar imagem do Postgres 16
# ---------------------------------------------------------------------------
info "Puxando imagem postgres:16..."
docker pull postgres:16

info "Todas as dependências foram instaladas com sucesso!"
