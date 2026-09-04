# Ambiente local e Docker

O ambiente completo combina três processos Node.js, PostgreSQL e Redis no Docker Compose e executores em um cluster Minikube. O Compose sozinho não executa toda a aplicação.

## Pré-requisitos

- Node.js 22 e npm;
- Docker com Docker Compose;
- Minikube e `kubectl`;
- acesso local para construir imagens e criar Kubernetes Jobs.

## Instalação

Instale as dependências e compile o pacote compartilhado:

```bash
make setup
```

Copie `platform-api/.env.example` para `platform-api/.env`. Para o Compose local, os valores principais são:

```dotenv
ENV=local
PORT=3010

PG_TYPE=postgres
PG_HOST=localhost
PG_PORT=5433
PG_USERNAME=eevee_user
PG_PASSWORD=eevee_password
PG_DATABASE=eevee_db

JWT_SECRET=gere-um-segredo-local
AUTH_SESSION_TTL_SECONDS=43200

REDIS_HOST=localhost
REDIS_PORT=6379
CORS_ALLOWED_ORIGINS=
GROQ_API_KEY=
```

Para gerar um segredo JWT:

```bash
cd platform-api
npm run script:generate-jwt-key
```

Crie `front/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:3010/v1
```

O Assignment Runner usa `REDIS_HOST` e `REDIS_PORT`, sem configuração, aplica os padrões locais. Variáveis `K8S_*` ajustam namespace, pull policy, pull secrets e node selector. As variáveis `WORKER_*` permitem substituir imagens específicas dos executores.

## Recuperação de senha e SMTP

Para enviar e-mails de recuperação, configure também na Platform API:

```dotenv
GMAIL_USER=conta@gmail.com
GMAIL_APP_PASSWORD=senha-de-app-do-google
FRONT_URL=http://localhost:3000
FRONT_ROUTE_RESET_PASSWORD=/reset-password
```

Use uma senha de app, não a senha normal da conta. Sem SMTP válido, login e administração continuam funcionando, mas o envio do link de recuperação falha.

## Preparar e iniciar

Inicie Minikube, PostgreSQL e Redis:

```bash
make up
```

Com o Minikube ativo, construa e carregue as imagens de execução:

```bash
make prepare-workers
```

!!! note "Executor gRPC no ambiente local"
    O `images/Makefile` gera atualmente `worker-grpc-img:latest`, enquanto o Runner procura `worker-node-grpcjs-img:latest`. Para usar `node_grpcjs` nesse fluxo, inicie o Runner com `WORKER_IMAGE_NODE_GRPCJS=worker-grpc-img:latest` ou atribua uma tag compatível à imagem.

Depois, em três terminais:

=== "Platform API"

    ```bash
    make up-platform-api
    ```

=== "Assignment Runner"

    ```bash
    make up-assignment-runner
    ```

=== "Frontend"

    ```bash
    make up-front
    ```

Para criar usuários e dados de demonstração:

```bash
make seed
```

Para encerrar Minikube e o Compose:

```bash
make down
```

## Documentação local

```bash
make up-docs
make check-docs
```

O primeiro comando serve o site em `http://localhost:8000`, o segundo executa o build estrito do MkDocs.
