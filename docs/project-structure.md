# Estrutura do projeto

O repositório separa a aplicação web, o domínio da plataforma, a execução isolada de código e a infraestrutura.

```text
eevee/
├── front/                    # interface Next.js
├── platform-api/             # API, domínio, persistência e realtime
├── assignment-runner/        # consumidor de execuções e orquestração Kubernetes
├── file-storage-api/         # sincronização de arquivos, snapshots e backup
├── packages/
│   └── execution-contracts/  # contratos compartilhados das filas
├── images/                   # imagens dos executores
├── infrastructure/           # Docker Compose, Helm, gateway e proxy
├── scripts/                  # utilitários operacionais
├── Makefile                  # comandos de desenvolvimento e implantação
└── docs/                     # documentação MkDocs
```

## `front/`

```text
front/src/
├── app/             # rotas, telas e integração com a API
├── components/      # componentes de interface e administração
├── hooks/           # consultas e comportamentos reutilizáveis
└── providers/       # sessão e estado do workspace
```

As telas administrativas ficam em `app/admin/`. Os clientes HTTP e Socket.IO da Platform API ficam em `app/integration/platform-api/`, com os tipos em `app/interface/platform-api/`. A sincronização de arquivos e snapshots fica em `app/integration/file-storage-api/`. O workspace combina Monaco Editor, explorador de arquivos, validações no cliente e armazenamento IndexedDB.

## `platform-api/`

A aplicação NestJS expõe HTTP e Socket.IO, aplica as regras do domínio e persiste dados no PostgreSQL. Seus módulos cobrem autenticação e recuperação de senha, usuários, turmas, atividades, templates, gabaritos, provas, tentativas, previews, questionários e arquivos.

Também prepara os payloads de execução, publica comandos no Redis, recebe resultados do Assignment Runner e processa a fila opcional de feedback por IA. A Platform API não cria Kubernetes Jobs diretamente.

Entradas importantes:

- `src/main.ts`: servidor HTTP e realtime;
- `data-source.ts`: CLI de migrations;
- `scripts/seed.ts`: dados locais de demonstração.

## `assignment-runner/`

Serviço NestJS sem API HTTP pública. Ele consome comandos e requisições de execução, escolhe a estratégia do executor, cria e acompanha Kubernetes Jobs, interpreta o resultado dos testes e publica eventos de progresso e término.

As responsabilidades de orquestração Kubernetes e as estratégias de worker ficam neste componente, isoladas do domínio educacional da Platform API.

## `file-storage-api/`

O serviço HTTP valida os grants e grava rascunhos e snapshots no PVC. Em
`file-storage-api/src/`, `server.ts` configura o processo, `http-api.ts` define
as rotas, `store.ts` gerencia os arquivos e `backup.ts` implementa exportação e
restauração. Veja o [guia de implantação](file-storage-rollout/SOURCE-STORAGE.md).

## `packages/execution-contracts/`

Pacote TypeScript compartilhado pelos serviços. Define nomes de filas, comandos, requisições, resultados, referências a snapshots e identificadores de destino (`attempt` ou `preview`). Deve ser compilado antes dos serviços que o consomem.

## `images/`

Contém o bootstrap e as imagens para JavaScript, Node.js, NestJS, gRPC, Next.js/Cypress, React/Cypress, TeraORM e Python. O bootstrap materializa os arquivos no volume compartilhado, o executor principal instala dependências e roda Jest, Cypress ou Pytest, conforme o tipo.

## `infrastructure/`

- `docker-compose.yml`: PostgreSQL e Redis para desenvolvimento;
- `helm/eevee/`: chart da aplicação;
- `file-storage/`: inicialização e manifestos Minikube para armazenamento local e guia de backup;
- arquivos de gateway, proxy de saída e políticas de rede usados na implantação.
