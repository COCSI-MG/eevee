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
