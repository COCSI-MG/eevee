# Testes do projeto

## Backend

O backend usa Jest. Os arquivos `*.spec.ts` cobrem controllers, services, utilitários, autenticação, paginação, Kubernetes, scheduling, templates, arquivos e workers.

Comandos declarados em `scheduler-api/package.json`:

```bash
cd scheduler-api
npm run test
npm run test:e2e
npm run test:cov
```

- `test`: executa os testes unitários em série;
- `test:e2e`: usa `test/jest-e2e.json` e `test/app.e2e-spec.ts`;
- `test:cov`: gera cobertura no diretório `coverage/`.

O build TypeScript é:

```bash
npm run build
```

O lint declarado executa ESLint com `--fix`, portanto pode alterar arquivos:

```bash
npm run lint
```

Execute-o somente quando modificações automáticas forem desejadas.

## Frontend

Existem testes para paginação administrativa e busca paginada:

- `src/components/admin/admin-pagination.test.tsx`;
- `src/hooks/use-paginated-search.test.tsx`.

## Testes das soluções

Os testes das atividades não fazem parte da suíte interna do repositório. Eles são templates armazenados no banco e executados nos workers pela biblioteca de testes de cada linguagem.

## CI observada

Os workflows atuais executam Node.js 22. O backend possui etapas de teste e build e o frontend possui etapas de lint/build.
