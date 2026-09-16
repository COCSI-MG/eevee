#!/bin/bash
# Bash equivalent of open-production-db-tunnel.ps1 for macOS/Linux.
set -euo pipefail

SSH_TARGET=${SSH_TARGET:-"200.159.254.113"}
LOCAL_PORT=${LOCAL_PORT:-"15432"}
REMOTE_PORT=${REMOTE_PORT:-"15432"}
NAMESPACE=${NAMESPACE:-"eevee-cefetrj"}
SERVICE=${SERVICE:-"postgres-service"}

if ! [[ "$NAMESPACE" =~ ^[a-z0-9.-]+$ ]] || ! [[ "$SERVICE" =~ ^[a-z0-9.-]+$ ]]; then
  echo "❌ Erro: Namespace e Service devem ser nomes válidos do Kubernetes." >&2
  exit 1
fi

# Checa se a porta local já está ocupada usando o próprio bash (sem depender de lsof/ss).
if (exec 3<>"/dev/tcp/127.0.0.1/$LOCAL_PORT") 2>/dev/null; then
  exec 3>&-
  echo "❌ Erro: A porta local $LOCAL_PORT já está em uso. Pare o processo que a está usando ou escolha outra porta com LOCAL_PORT." >&2
  exit 1
fi

REMOTE_COMMAND="kubectl -n $NAMESPACE port-forward --address 127.0.0.1 service/$SERVICE ${REMOTE_PORT}:5432"

echo "📡 Abrindo túnel PostgreSQL de produção em 127.0.0.1:$LOCAL_PORT"
echo "Remote: $REMOTE_COMMAND"
echo "Mantenha este terminal aberto. Pressione Ctrl+C para fechar o túnel."

ssh \
  -o ExitOnForwardFailure=yes \
  -o ServerAliveInterval=30 \
  -o ServerAliveCountMax=3 \
  -L "127.0.0.1:${LOCAL_PORT}:127.0.0.1:${REMOTE_PORT}" \
  "$SSH_TARGET" \
  "$REMOTE_COMMAND"
