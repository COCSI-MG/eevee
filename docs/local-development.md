# Ambiente local e Docker

O ambiente completo usa processos locais, dois contêineres de infraestrutura e um cluster Kubernetes. **Docker Compose sozinho não executa toda a aplicação**: ele inicia apenas PostgreSQL e Redis. As soluções submetidas dependem de Kubernetes Jobs.

## Pré-requisitos

- Node.js 22;
- npm;
- Docker com Docker Compose;
- Minikube;
- kubectl;
- acesso para criar contêineres e Kubernetes Jobs.

## Configuração dos .envs

Copie `scheduler-api/.env.example` para `scheduler-api/.env` e ajuste os valores. Uma configuração local compatível com o Docker Compose é:

```dotenv
ENV=local
PORT=3010

PG_HOST=localhost
PG_PORT=5433
PG_USERNAME=eevee_user
PG_PASSWORD=eevee_password
PG_DATABASE=eevee_db

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=gere-um-segredo-local
CORS_ALLOWED_ORIGINS=
GROQ_API_KEY=
```

```bash
cd scheduler-api
npm run script:generate-jwt-key
npm install
```

Crie `front/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:3010/v1
```

```bash
cd front
npm install
```

## Executando a aplicação

=== "Terminal A — Imagens "
    ```bash
    # Builda as imagens de execução do Node.js e do bootstrap, caso nao tenha imagem nova nao precisa buildar
    make -C node-worker-images rebuild-bootstrap rebuild-node
    ```

=== "Terminal B — API"
    ```bash
    make up
    ```

=== "Terminal C — Frontend"
    ```bash
    make up-frontend
    ```

=== "Terminal D — Filas"
    ```bash
    make up-queue-worker
    ```