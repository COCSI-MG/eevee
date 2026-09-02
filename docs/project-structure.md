# Estrutura do projeto

O repositório é organizado por aplicações e infraestrutura. Esta visão lista somente os diretórios que participam do funcionamento atual.

```text
eevee/
├── front/                  # interface Next.js
├── scheduler-api/          # API, filas, domínio e integração Kubernetes
├── node-worker-images/     # imagens que executam as soluções
├── eevee-infrastructure/   # Docker Compose e chart Helm
├── scripts/                # utilitários operacionais
├── Makefile                # atalhos locais, imagens e Helm
└── docs/                   # documentação MkDocs
```

## `front/`

```text
front/src/
├── app/             # rotas Next.js, telas e integração com a API
├── components/      # componentes de interface e administração
├── hooks/           # consultas, estado e comportamentos reutilizáveis
└── providers/       # sessão e estado do workspace
```

Dentro de `app/admin/` ficam os fluxos de turmas, templates, atividades, usuários e tentativas. `app/integration/scheduler-api/` centraliza o cliente HTTP e o Socket.IO. O workspace combina editor Monaco, explorador de arquivos, pré-validação e armazenamento IndexedDB.

## `scheduler-api/`

```text
scheduler-api/src/
├── auth/                    # login, cookie JWT e guards
├── user/, class/           # usuários, turmas e matrículas
├── assignment/             # atividades
├── template/               # templates de testes
├── assignment-template/    # associação atividade-template
├── assignment-params/      # valores de parâmetros por atividade
├── scheduling/             # tentativas, previews e filas
├── attempt/                # resultados persistidos
├── worker/                 # estratégias e definição dos Jobs
├── kubernetes/             # cliente e acompanhamento de Jobs
├── realtime/               # eventos Socket.IO
├── file-saver/             # upload local e sincronização incompleta
├── interview-response/     # questionários da pesquisa
└── database/               # conexão TypeORM
```

Os módulos seguem o padrão NestJS:

- **controller:** recebe HTTP, aplica guards e delega;
- **service:** implementa regras e orquestra repositórios/integrações;
- **entity:** mapeia tabelas TypeORM;
- **DTO:** declara formato e validação de entrada;
- **module:** conecta dependências.

### Entradas de processo

- `src/main.ts`: servidor HTTP;
- `src/main-worker.ts`: consumidores BullMQ;
- `data-source.ts`: CLI de migrations;
- `scripts/seed.ts`: usuários e dados de desenvolvimento;
- `scripts/seed-teraorm-ab-study.ts`: módulo experimental.

## `node-worker-images/`

Cada subdiretório possui uma imagem e um gatilho de execução. Os diretórios principais são `worker-bootstrap`, `node`, `nest.js`, `grpc`, `next.js-cypress`, `reactjs-cypress` e `node-teraorm`.

O bootstrap não executa testes; ele materializa os arquivos no volume compartilhado. Os outros contêineres instalam dependências e acionam Jest ou Cypress.

## `eevee-infrastructure/`

- `docker-compose.yml`: PostgreSQL e Redis para desenvolvimento;
- `helm/eevee/`: chart agregador com frontend, API, consumidor, dados, Nginx e recursos opcionais;
- configurações de proxy e NetworkPolicy para o cenário TeraORM.