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

## Documentação

```bash
make check-docs
```

Esse comando executa o build do MkDocs em modo estrito e detecta páginas, links ou configurações inválidas.

## Testes das soluções

Os testes educacionais não fazem parte das suítes internas. Eles são templates armazenados no banco e executados em Kubernetes Jobs com Jest, Cypress ou Pytest.

## CI

Os workflows usam Node.js 22 e separam Platform API, Assignment Runner, frontend e documentação. Os dois serviços executam testes e build, o frontend executa lint e build, a documentação executa sua verificação estrita.
