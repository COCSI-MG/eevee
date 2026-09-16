# Scripts para automatizar tarefas

Esse documento auxilia no entendimento e execução dos script presentes nessa pasta, que tem como objetivo automatizar algumas tarefas.

## Executar migrations no banco de produção pelo Windows

O PostgreSQL de produção roda dentro do cluster Kubernetes (`postgres-service`
no namespace `eevee-cefetrj`) e não é acessível diretamente. O script conecta
via SSH em `200.159.254.113` e executa `kubectl port-forward` no próprio
servidor, encaminhando o resultado para `127.0.0.1:15432` na máquina local.

Abra o túnel em um terminal PowerShell e mantenha-o aberto:

```powershell
.\scripts\open-production-db-tunnel.ps1
```

No macOS/Linux, use o script bash equivalente (mesmos parâmetros via variáveis
de ambiente: `SSH_TARGET`, `LOCAL_PORT`, `REMOTE_PORT`, `NAMESPACE`, `SERVICE`):

```bash
./scripts/open-production-db-tunnel.sh
```

Em outro terminal, confira as migrations pendentes sem alterar o banco:

```powershell
.\scripts\run-production-migrations.ps1
```

Depois de revisar a lista, aplique-as explicitamente:

```powershell
.\scripts\run-production-migrations.ps1 -Apply
```

O runner usa o ambiente local de `platform-api/.env`, que deve apontar para
`PG_HOST=127.0.0.1` e `PG_PORT=15432`. O túnel encaminha essa conexão local para
o PostgreSQL do cluster. O arquivo de ambiente não deve ser versionado.

## Carregar imagens docker para o cluster do k3s

Esse script é útil para carregar imagens docker diretamente para o cluster do k3s, evitando a necessidade de fazer push para um registry externo. Serve muito bem para o caso das imagens do worker, que não são publicadas em um registry e tem necessidade de serem carregadas offline para economizar tempo de pull e inicio do job no cluster.

### Uso

Ele espera que o k3s esteja rodando em uma vps, então precisa passar alguns parâmetros para o script, esses abaixo como variáveis de ambiente:

- `VPS_USER`: O usuário para acessar a vps (ex: `root` ou `ubuntu`) - opcional, padrão é `root`
- `VPS_HOST`: O endereço IP ou hostname da vps onde o k3s está rodando - obrigatório
- `VPS_PORT`: A porta SSH para acessar a vps - opcional, padrão é `22`

Um parametro obrigatório é a imagem que deseja carregar para o cluster, que deve ser passada como argumento para o script:

```bash
./load-image.sh <nome-da-imagem:tag>
```

### Processo

O script via `scp` a imagem docker para a vps, e depois executa o comando `k3s ctr images import` para importar a imagem para o cluster do k3s. Após isso, a imagem estará disponível para ser usada nos pods do cluster.
