#!/bin/bash

VPS_USER=${VPS_USER:-"root"}
VPS_HOST=${VPS_HOST:-"IP_DA_SUA_VPS"} # Coloque o IP real aqui
VPS_PORT=${VPS_PORT:-"22"}

# ==========================================
# Validação do parâmetro
# ==========================================
if [ -z "$1" ]; then
  echo "❌ Erro: Você precisa informar a imagem e a tag."
  echo "👉 Uso: ./k3s-image-load.sh nome-da-imagem:tag"
  exit 1
fi

IMAGE_NAME=$1

# Cria um nome de arquivo temporário substituindo ":" e "/" por "_"
TAR_FILE=$(echo "$IMAGE_NAME" | tr ':/' '_').tar

echo "📦 [1/4] Exportando '$IMAGE_NAME' do Docker local..."
docker save -o "$TAR_FILE" "$IMAGE_NAME"

if [ $? -ne 0 ]; then
    echo "❌ Erro: Falha ao exportar a imagem. Verifique se ela existe localmente."
    rm -f "$TAR_FILE"
    exit 1
fi

echo "🚀 [2/4] Transferindo '$TAR_FILE' para a VPS via SCP..."
scp -P "$VPS_PORT" "$TAR_FILE" "$VPS_USER@$VPS_HOST:/tmp/$TAR_FILE"

if [ $? -ne 0 ]; then
    echo "❌ Erro: Falha na transferência SSH."
    rm -f "$TAR_FILE"
    exit 1
fi

echo "⚙️ [3/4] Importando a imagem no containerd do K3s..."
ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" "sudo k3s ctr images import /tmp/$TAR_FILE && rm -f /tmp/$TAR_FILE"

if [ $? -ne 0 ]; then
    echo "❌ Erro: Falha ao carregar a imagem no K3s."
    exit 1
fi

echo "🧹 [4/4] Limpando arquivo temporário local..."
rm -f "$TAR_FILE"

echo "✅ Concluído! A imagem '$IMAGE_NAME' está pronta para ser usada no cluster."