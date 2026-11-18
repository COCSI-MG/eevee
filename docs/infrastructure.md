# Infraestrutura

## Desenvolvimento com Docker Compose

`infrastructure/docker-compose.yml` inicia somente:

- Redis `8.6.2`, na porta 6379, com volume `redis-data`;
- PostgreSQL `16`, na porta externa 5433, com volume `pgdata`.

Frontend, Platform API e Assignment Runner rodam como processos separados no desenvolvimento local. O Minikube executa os Kubernetes Jobs e a [File Storage API](local-development.md#iniciar-a-file-storage-api).

## Imagens da aplicação e dos workers

O Makefile raiz constrói e publica as imagens de `platform-api`, `assignment-runner` e `front`. O frontend e os dois serviços usam o diretório raiz como contexto para acessar o pacote compartilhado.

O catálogo de executores inclui:

| Tipo | Framework principal |
| --- | --- |
| `node_default` | Jest |
| `javascript_default` | Jest |
| `node_nestjs` | Jest |
| `node_reactjs_cypress` | Cypress |
| `node_grpcjs` | Jest |
| `node_nextjs_cypress` | Cypress |
| `node_default_postgresql` | Jest + PostgreSQL |
| `node_nestjs_postgresql` | Jest + PostgreSQL |
| `node_teraorm` | Jest + serviços auxiliares |
| `python_default` | Pytest |

`make prepare-workers` reconstrói todas as imagens em `images/`, carrega-as no Minikube e disponibiliza `postgres:16` para os workers que precisam de banco.

## Chart Helm

O chart fica em `infrastructure/helm/eevee` e instala os seguintes componentes:

```mermaid
flowchart LR
    EXT[Usuário] --> GW[Nginx gateway]
    GW --> F[Frontend]
    GW --> A[Platform API]
    A --> P[(PostgreSQL)]
    A <--> R[(Redis)]
    AR[Assignment Runner] <--> R
    AR --> J[Kubernetes Jobs]
```

O chart inclui a File Storage API e seu PVC. Veja o [guia de implantação do armazenamento](file-storage-rollout/SOURCE-STORAGE.md). O chart também pode incluir PostgreSQL, Redis, gateway Nginx, Ingress e cert-manager, além de proxy de saída e políticas de rede para as execuções.

As imagens padrão dos serviços usam `ghcr.io/cocsi-mg` e a tag `latest`. Secrets podem ser referenciados ou criados pelo chart, conforme os valores. O namespace padrão do Makefile é `eevee-cefetrj` e a release é `eevee`.

