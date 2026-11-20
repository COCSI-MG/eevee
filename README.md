# EEVEE - Educational Exercices and Video-based E-learning Environment

## Desenvolvimento local

Siga o [guia de ambiente local](./docs/local-development.md) para configurar o
PostgreSQL, o Redis, o Minikube e os serviços. Execute os comandos a partir da
raiz do repositório.

### Componentes

| Componente | Função | Comando local |
| --- | --- | --- |
| [Frontend](./front/README.md) | Interface Next.js | `make up-front` |
| [Platform API](./platform-api/README.md) | API da plataforma | `make up-platform-api` |
| [Assignment Runner](./assignment-runner/) | Orquestração de avaliações no Kubernetes | `make up-assignment-runner` |
| [File Storage API](./file-storage-api/README.md) | Sincronização de arquivos e snapshots de execução no PVC | `make up-file-storage-api` |

### Imagens dos workers

Com o Minikube ativo, execute `make prepare-workers` para construir e carregar
as imagens de desenvolvimento. O [guia de imagens](./images/README.md) lista os
Dockerfiles e os comandos para cada executor. Para os workers com banco de
dados integrado, consulte o [guia dos workers PostgreSQL](./images/node/postgresql/README.md).

## Implantação

O [guia de infraestrutura](./infrastructure/README.md) reúne os caminhos para o
chart de produção, a implantação da File Storage API e o backup do volume.

## Modulo de exercicios TeraORM AB

O seed cria um conjunto de exercícios pareados (A = SDK nativo, B = TeraORM) para o estudo comparativo.

Na raiz do repositório:

```bash
make seed
npm --prefix platform-api run seed:teraorm-study
```

Esse seed cria:

- Uma turma: `TeraORM AB Validation Module`
- 4 exercicios pareados:
  - AB01-A SDK Native: Revenue by Store
  - AB01-B TeraORM: Revenue by Store
  - AB02-A SDK Native: Top Customers by Region
  - AB02-B TeraORM: Top Customers by Region
- Templates de teste automatizado para cada exercicio

Objetivo: permitir comparar taxa de conclusao, tentativas, tempo e padroes de erro entre abordagem sem ORM e com ORM.

## Troubleshooting

### Problema com DNS no minikube

Pode surgir alguns problemas com resolucao de DNS no minikube. Aconteceu ao rodar um `npm install` dentro do minikube, onde o comando falhou por não conseguir resolver o nome do registry do npm.

Direto pelo minikube:

```bash
minikube start --docker-opt dns=8.8.8.8 --docker-opt dns=1.1.1.1
```

Outra solução para isso é editar o configmap do coredns, adicionando a seguinte configuração:

```bash
kubectl -n kube-system edit configmap coredns
```

Altere de `forward . /etc/resolv.conf` para `forward . 8.8.8.8 1.1.1.1`, e depois disso, reinicie o coredns:

```bash
kubectl -n kube-system rollout restart deployment coredns
```
