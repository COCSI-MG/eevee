# Infraestrutura do EEVEE

## Desenvolvimento local

O [guia de ambiente local](../docs/local-development.md) descreve como iniciar
os serviços na máquina de desenvolvimento. O [Docker Compose](./docker-compose.yml)
sobe PostgreSQL e Redis. O Minikube executa os Jobs de avaliação e a
[File Storage API local](./file-storage/README.md).

Execute `make prepare-workers` na raiz do repositório com o Minikube ativo.
Os Dockerfiles e comandos individuais estão no [guia de imagens](../images/README.md).

## Produção

- [Chart Helm](./helm/eevee/README.md) para implantação e atualização.
- [Implantação do armazenamento](../docs/file-storage-rollout/SOURCE-STORAGE.md) para preparar a migração, o Secret e o PVC.
- [Backup e restauração](./file-storage/BACKUP.md) para copiar o PVC e o banco em um mesmo ponto de recuperação.
- [Proxy do IP público](./public-ip-forward/README.md) para a configuração do host de entrada.

