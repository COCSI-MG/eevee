# Tecnologias

## Interface

| Tecnologia | Uso no projeto |
| --- | --- |
| Next.js 15 | Renderiza a aplicação web e organiza rotas. |
| React 19 | Componentes e estado de interface. |
| TypeScript | Tipagem do frontend e backend. |
| Tailwind CSS 3 | Estilos. |
| Radix UI e shadcn/ui | Componentes acessíveis e base visual. |
| Monaco Editor | Edição de código e dos testes. |
| TanStack Query | Cache, polling e estado de requisições. |
| Axios | Cliente HTTP com credenciais. |
| Formik e Yup | Formulários e validação no cliente. |
| Socket.IO Client | Atualizações de execução em tempo real. |
| IndexedDB | Persistência local dos arquivos do workspace. |

## Backend e dados

| Tecnologia | Uso no projeto |
| --- | --- |
| NestJS 11 | API modular, injeção de dependências e processo consumidor. |
| TypeORM | Entidades, consultas, migrations e conexão PostgreSQL. |
| PostgreSQL 16 | Dados de usuários, turmas, atividades, tentativas e resultados. |
| Redis | Backend das filas. |
| BullMQ | Tentativas, previews, feedback e fila declarada de arquivos. |
| Passport/JWT | Autenticação por token em cookie. |
| bcrypt | Hash de senhas. |
| class-validator | Validação dos DTOs. |
| Swagger/OpenAPI | Catálogo interativo da API em `/api`. |
| Socket.IO | Gateway de eventos autenticado pelo cookie. |

## Execução e testes

| Tecnologia | Uso no projeto |
| --- | --- |
| Docker | Imagens da API, frontend e executores. |
| Kubernetes | Um Job por execução de solução. |
| Jest | Testes internos do backend. |
| Cypress | Testes de interfaces Next.js e React. |
| Kind | Cluster local descrito pelo guia mais recente. |
| Helm | Implantação conjunta dos componentes no cluster. |

## Integrações opcionais

| Serviço | Uso no projeto |
| --- | --- |
| Groq | Gera feedback refinado por API compatível com OpenAI. |
| GitHub API | Destino planejado para sincronização de arquivos; fluxo atual está incompleto. |

