# EEVEE - Educational Exercices and Video-based E-learning Environment

## _Steps To Reproduce_

1. Construa a infraestrutura do projeto, com detalhamento disponível em [eevee-infrastructure](./eevee-infrastructure/README.md).

2. Instale os pacotes NPM para os arquivos a seguir:

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
docker build . -t worker-node-default-img
```

Agora é necessário incluir a imagem no minikube

```
minikube image load worker-node-default-img:latest
```

### Node NestJS Worker

```
cd node-worker-images\nestjs
docker build . -t worker-node-nestjs-img
```

Agora é necessário incluir a imagem no minikube

```
minikube image load worker-node-nestjs-img:latest
```
