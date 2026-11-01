## Description

CEFET Code Lab Scheduler API

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# queue worker (required to process scheduling attempts)

# production mode
$ npm run start:prod

# queue worker (production)
```

When running locally, keep both processes alive in separate terminals:

The Platform API server (`start:dev`) owns HTTP/WebSocket endpoints, platform background jobs, and persistence of correlated execution results. Assignment Runner is the separate execution service that consumes `execution-commands`, creates Kubernetes workers, and publishes lifecycle facts to `execution-results`.

An execution submission follows this flow:

```text
Platform API -> execution-commands -> Execution orchestrator
Execution orchestrator -> execution-results -> Platform API -> WebSocket client
```

The PostgreSQL attempt record remains the source of truth. Socket messages are notifications only; clients must read the attempt API after reconnecting.

## Database migrations using this package's `.env`

Email invitations are available through the admin Users and Class screens. See
[invitation setup and classroom workflow](../docs/teacher-guide/invitations.md)
for SMTP configuration, migration order and testing.

Automatic schema synchronization is disabled in every environment, including
`ENV=local`. Run migrations after pulling schema changes and before starting the API.

Set `PG_HOST`, `PG_USERNAME`, `PG_PASSWORD`, and `PG_DATABASE` in
`platform-api/.env`. `PG_PORT` defaults to `5432` when omitted. For the SSH
database tunnel, use `PG_HOST=127.0.0.1` and the tunnel's local port, and keep
the tunnel running.

From the repository root (`eevee`), use the centralized Makefile commands:

```bash
# Show executed [X] and pending [ ] migrations without applying them
make migration-show

# Apply all pending migrations
make migration-run
```

From the parent workspace (`Pesquisa`), the same commands are:

```bash
make -C eevee migration-show
make -C eevee migration-run
```

Both commands build the API first and explicitly load **this package's `.env`**,
regardless of the caller's directory. Database values in the shell do not override
the file. Missing required values or an invalid port stop the command. The CLI
owns the connection lifecycle; automatic schema synchronization is disabled.
`migration:run` uses TypeORM's single-transaction mode and applies **all** pending
migrations, including any older ones, not only the latest feature migration.

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Run seed

For the professor's classes, guided labs and native questionnaires, use
`make seed-classroom-preview` and `make seed-classroom` from the repository root.
These commands create draft content and do not create accounts or enroll students.
See [classroom seed documentation](scripts/classroom/README.md) for content,
source corrections, validation and rerun behavior.

Just use this in development environment to populate the database with initial data.

It will create an initial user with admin role and user role, the users has the following credentials by default:

- Email: admin@example.com
- Password: admin123

- Email: student@example.com
- Password: student123

```bash
npm run seed
```

## Seed de exemplos Python

O seed `seed:python-examples` cria ou atualiza, de forma idempotente:

- a turma `Introdução à Programação com Python`;
- seis atividades graduais (`PY01` a `PY06`);
- um template privado de testes `pytest` para cada atividade;
- os vínculos entre turma, professor, alunos, atividades e templates.

Os exemplos cobrem saudação e strings, condicionais, repetição, listas,
dicionários, normalização de texto e leitura de arquivos. O seed não cria
usuários nem altera senhas. O professor deve ser uma conta administradora já
existente; a matrícula de alunos é opcional.

Antes de executar, implante o worker Python e garanta que
`python_default` esteja presente nos enums do banco. O seed interrompe a
execução sem gravar dados quando o schema não está pronto.

```bash
export PYTHON_SEED_TEACHER_EMAIL='professor@cefet-rj.br'
export PYTHON_SEED_STUDENT_EMAILS='aluno1@cefet-rj.br,aluno2@cefet-rj.br'

# valida schema, enum e usuários sem criar/atualizar registros
PYTHON_SEED_DRY_RUN=true npm run seed:python-examples

# cria ou atualiza o módulo dentro de uma transação
npm run seed:python-examples
```

Dentro da imagem de produção já compilada, use a variante que não depende de
`ts-node`:

```bash
# primeiro valide usando as mesmas variáveis PG_* do scheduler
PYTHON_SEED_DRY_RUN=true npm run seed:python-examples:prod

# depois aplique
npm run seed:python-examples:prod
```

Configurações opcionais:

- `PYTHON_SEED_CLASS_NAME`: nome da turma;
- `PYTHON_SEED_CLASS_DESCRIPTION`: descrição da turma;
- `PYTHON_SEED_STUDENT_EMAILS`: lista de alunos separada por vírgulas;
- `PYTHON_SEED_DRY_RUN=true`: executa somente as verificações prévias.

## Seed de exemplos de pandas

O seed `seed:pandas-examples` usa o mesmo fluxo do seed de Python e cria a
turma `Ciência de Dados com Python e pandas`, com nove atividades
(`PD01` a `PD09`) baseadas numa amostra real de vendas de uma papelaria.
Enunciados, testes, gabaritos e dados ficam todos em
`scripts/seed-pandas-examples.ts`. São três análises para cada tabela
(pedidos, itens e produtos), cada uma sobre um único DataFrame, com as funções
básicas do pandas (`count`, `sum`, `mean`, `median`, `min`, `max`, `std`,
`cov`, `corr`, `groupby`...).

Os dados ficam em um arquivo de apoio, `src/dados.py`, com os dicionários
`pedidos`, `itens` e `produtos` (amostra real de vendas); o `main` do
aluno monta o DataFrame com `pd.DataFrame(...)`. O seed grava esse arquivo em `assignment.supportFiles`, e o
servidor o adiciona aos arquivos do aluno a cada execução, sobrescrevendo
qualquer arquivo com o mesmo caminho. O código do aluno e os testes fazem
`from dados import ...`. O seed também cria o gabarito de cada atividade,
oculto para os alunos.

As tabelas se ligam por `itens.id_nfce → pedidos.id_nfce` e
`itens.cEAN → produtos.cEAN`:

- `pedidos` (uma venda por linha): `id_nfce`, `aberto_em`, `fechado_em`,
  `pagamento`, `vr_total` e `cancelado`;
- `itens` (os produtos de cada venda): `id_item`, `id_nfce`, `cProd`, `cEAN`,
  `xProd`, `uCom`, `qCom`, `vUnCom` e `vDesc`;
- `produtos` (cadastro): `id_produto`, `cProd`, `cEAN`, `xProd`, `uCom`,
  `vUnCom`, `custo`, `qt_estoque`, `qt_minima` e `qt_maxima`.

A amostra mantém de propósito problemas reais dos dados, porque aparecem nos
exercícios: `vr_total` vazio e pedidos cancelados (PD01 a PD03), custo vazio e
custo maior que o preço (PD08) e estoques negativos (PD09).

Antes do seed, aplique a migration `AddAssignmentSupportFiles`. A imagem do
worker Python precisa ter o `pandas` instalado
(`images/python-default/requirements.txt`). O botão "Testar" da tela de
template não recebe o `dados.py`, porque não está ligado a uma atividade; use o
"Executar" do gabarito da atividade para validar.

As variáveis são as mesmas do seed de Python, com o prefixo `PANDAS_SEED_`:

```bash
export PANDAS_SEED_TEACHER_EMAIL='professor@cefet-rj.br'
export PANDAS_SEED_STUDENT_EMAILS='aluno1@cefet-rj.br,aluno2@cefet-rj.br'

PANDAS_SEED_DRY_RUN=true npm run seed:pandas-examples
npm run seed:pandas-examples
```

Para usar uma turma que já existe, informe o nome dela em
`PANDAS_SEED_CLASS_NAME`. Na imagem de produção, use
`npm run seed:pandas-examples:prod`. Assim como no
seed de Python, atividades e templates são encontrados pelo título: renomear um
exercício cria uma atividade nova e mantém a antiga na turma.

Para construir localmente a mesma imagem utilizada pelo worker:

```bash
docker build -t worker-python-default-img:latest \
  -f ../images/python-default/Dockerfile \
  ../images/python-default
```

## Debug execution

Insert this into the launch.json file in the .vscode folder of the project:

```json
{
  // Use IntelliSense to learn about possible attributes.
  // Hover to view descriptions of existing attributes.
  // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Nest Framework",
      "args": ["${workspaceFolder}/CEFETCodeLab-SchedulerApi/src/main.ts"],
      "runtimeArgs": [
        "--nolazy",
        "-r",
        "ts-node/register",
        "-r",
        "tsconfig-paths/register"
      ],
      "sourceMaps": true,
      "envFile": "${workspaceFolder}/CEFETCodeLab-SchedulerApi/.env",
      "cwd": "${workspaceRoot}/CEFETCodeLab-SchedulerApi",
      "console": "integratedTerminal"
    },
    {
      "type": "node",
      "name": "vscode-jest-tests.v2",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": [
        "--runInBand",
        "--watchAll=false",
        "--testNamePattern",
        "${jest.testNamePattern}",
        "--runTestsByPath",
        "${jest.testFile}"
      ],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "disableOptimisticBPs": true,
      "windows": {
        "program": "${workspaceFolder}/node_modules/jest/bin/jest"
      }
    }
  ]
}
```

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
