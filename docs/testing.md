# Testes do projeto

Os componentes possuem pipelines independentes. Compile primeiro `packages/execution-contracts`, pois Platform API e Assignment Runner dependem desse pacote local.

## Contratos compartilhados

```bash
cd packages/execution-contracts
npm ci
npm run build
```

## Platform API

```bash
cd platform-api
npm run test
npm run build
```

Os testes Jest cobrem regras de domínio, autenticação, filas, resultados, templates, gabaritos, provas e utilitários.

O script de lint usa correção automática e pode alterar arquivos:

```bash
npm run lint
```

## Assignment Runner

```bash
cd assignment-runner
npm run test
npm run build
```

A suíte cobre contratos de execução, estratégias, orquestração Kubernetes, parsing de resultados, cancelamento e publicação de eventos.

## Frontend

```bash
cd front
npm run lint
npm run build
```

O lint do frontend também pode aplicar correções.

### Testes de caixa preta com Cypress

Os testes de ponta a ponta ficam em `front/cypress` e cobrem a gestão de usuários e de turmas pela interface, nas visões de administrador e de aluno. Não confundir com o Cypress das imagens de worker em `images/node`, que roda os testes das atividades do aluno e aparece em "Testes das soluções" mais abaixo: este aqui é a suíte do próprio frontend.

Os specs ficam em `cypress/e2e`, separados por perfil, e os comandos de apoio em `cypress/helpers`.

A suíte roda contra o ambiente local: Platform API em `localhost:3010`, frontend em `localhost:3000` e os usuários de demonstração criados por `make seed`.

```bash
cd front
npm run cy:run
npm run cy:open
```

`cy:run` executa a suíte no terminal e `cy:open` abre a interface do Cypress. Cada teste cria e remove os próprios dados pela API, então a suíte pode rodar várias vezes seguidas sem preparar o banco antes.

As URLs têm valor padrão para o ambiente local e saem de variáveis de ambiente:

| Variável | Padrão | Origem |
| --- | --- | --- |
| `CYPRESS_BASE_URL` | `http://localhost:3000` | ambiente |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3010/v1` | o mesmo `.env` do frontend |

As credenciais dos usuários de demonstração ficam em `cypress.config.ts`, em `expose` para os e-mails e `env` para as senhas, lidas nos testes por `Cypress.expose` e `cy.env`.

O login da Platform API aceita cinco requisições por minuto, por isso a sessão é reaproveitada entre os specs e a suíte inteira gasta um login por papel.

Essa suíte não roda no CI, que executa apenas lint e build do frontend, porque ela depende da API e do banco de pé.

## Documentação

```bash
make check-docs
```

Esse comando executa o build do MkDocs em modo estrito e detecta páginas, links ou configurações inválidas.

## Testes das soluções

Os testes educacionais não fazem parte das suítes internas. Eles são templates armazenados no banco e executados em Kubernetes Jobs com Jest, Cypress ou Pytest.

## CI

Os workflows usam Node.js 22 e separam Platform API, Assignment Runner, frontend e documentação. Os dois serviços executam testes e build, o frontend executa lint e build, a documentação executa sua verificação estrita.
