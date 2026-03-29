# EEVEE - Educational Exercices and Video-based E-learning Environment

## _Steps To Reproduce_

1. Construa a infraestrutura do projeto, com detalhamento disponível em [eevee-infrastructure](./eevee-infrastructure/README.md).

2. Construa as imagens dos workers e entenda sobre a execução dos workers, seguindo os passos detalhados em [node-worker-images](./node-worker-images/README.md).

3. Instale os pacotes NPM para os arquivos a seguir:

### 1. `front` (Next.js frontend)

```bash
cd front/
npm install
npm run dev
```

### 2. `scheduler-api` (Scheduler API)

Lembre-se de definir uma secret JWT no .env

Pode copiar um arquivo `.env.example` dentro de `scheduler-api` e trocar os valores

```bash
cd scheduler-api/
npm install
npm start
```

## _Testando a infraestrutura_

É necessário primeiro executar o build de todas as imagens que serão usadas.

### Node Default Worker

```
cd node-worker-images\node
docker build . -t worker-node-default-img:latest
```

Agora é necessário incluir a imagem no minikube

```
minikube image load worker-node-default-img:latest
```

### Node NestJS Worker

```
cd node-worker-images\nest.js
docker build . -t worker-node-nestjs-img:latest
```

Agora é necessário incluir a imagem no minikube

```
minikube image load worker-node-nestjs-img:latest
```

### Node GRPC Worker

```
cd node-worker-images\grpc
docker build . -t worker-node-grpcjs-img:latest
```

Agora é necessário incluir a imagem no minikube

```
minikube image load worker-node-grpcjs-img:latest
```

### Node Next.js + Cypress Worker

```
cd node-worker-images\next.js-cypress
docker build . -t worker-node-nextjs-cypress-img:latest
```

Agora é necessário incluir a imagem no minikube

```
minikube image load worker-node-nextjs-cypress-img:latest
```

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
