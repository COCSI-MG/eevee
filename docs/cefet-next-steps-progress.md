# Progresso da integração CEFET

O plano de transição ordenado está em `.github/prompts/cefet-enrollment-content-and-adhoc.prompt.md`.

## Concluído

- Adicionado `platform-api/scripts/cefet-roster.ts`, um parser idempotente que preserva a grafia exibida na lista e remove duplicatas de nomes dentro de cada turma.
- Adicionado `platform-api/scripts/cefet-roster.spec.ts` cobrindo acentos, duplicatas sem distinção de maiúsculas/minúsculas e reuso entre turmas.
- Adicionados `User.externalSubject` e `User.identityProvider` com a migration `1787279000000-UserExternalIdentity`. Esses campos já estão prontos para um object ID do Microsoft Entra; nenhum token ou credencial é armazenado.
- Inventariado o material de turma fornecido: três PDFs em `cefet-rj-classes` (Arquitetura de Computadores, Banco de Dados II e a lista técnica de arquitetura).
- Adicionado `platform-api/scripts/seed-cefet-microsoft.ts`: um fluxo MSAL por device code conduzido pelo operador, paginação do Graph com escopo de tenant, correspondência exata de nome exibido normalizado, recusa em caso de ausência/ambiguidade, saída em modo dry-run e matrícula idempotente e transacional. Os tokens ficam apenas em memória e nunca são registrados em log.
- Adicionados `platform-api/src/assignment/enums/assignment-execution-mode.enum.ts`, `Assignment.executionMode`, suporte no DTO e a migration `1787280000000-AssignmentExecutionMode`. As tarefas existentes usam `graded` por padrão; `adhoc` é explícito e hoje é apenas metadado de schema/API até que a fatia vertical do runner seja implementada.
- Adicionado `cefet-rj-classes/catalog.json` com os três PDFs encontrados e um status explícito `needs-extraction`, para que o material-fonte não seja convertido silenciosamente em tarefas supostas.
- Adicionados `ExecutionWorkerPayload.executionMode`, `CreateWorkerDto.executionMode` no runner e ramificação do worker Python para que execuções `adhoc` rodem `/app/src/app.py` diretamente em vez de invocar o pytest. O agendamento pula a preparação de teste/template para tarefas `adhoc` explícitas e preserva os arquivos enviados.
- A autenticação atual do EEVEE é local/JWT. Não existe provedor Microsoft/Entra nem cliente Graph.
- O seed de conteúdo Python existente é `platform-api/scripts/seed-python-examples.ts` e deve ser reutilizado como padrão para o importador.

## Bloqueio para a busca no Microsoft

Uma busca no Graph com escopo de tenant precisa de uma configuração de tenant/client aprovada e de permissão delegada ou de aplicação no Graph. A conta do navegador local pode ser usada por um fluxo de login por device code ou interativo conduzido pelo operador, mas credenciais/consentimento não podem ser automatizados nem versionados. O próximo agente deve primeiro confirmar o caminho de autenticação aprovado e então adicionar um adaptador do Graph com paginação, retry/backoff, relatório de ambiguidade, dry-run e matrícula transacional.

O script requer `@azure/msal-node` (declarado em `platform-api/package.json`; instale e atualize o lockfile quando a execução de pacotes estiver disponível), `MICROSOFT_TENANT_ID`, `MICROSOFT_CLIENT_ID` e o ambiente PostgreSQL já existente. Execute primeiro com `--dry-run`. A aplicação ainda precisa de um callback de login Microsoft antes que a senha placeholder de autenticação externa possa ser usada para entrar no EEVEE de forma interativa.

## Sequência restante

1. Instalar `@azure/msal-node`, rodar o script Microsoft com `--dry-run`, depois adicionar o callback de login Microsoft e as permissões Graph aprovadas.
2. Extrair e revisar os três PDFs, depois implementar um importador rastreável à fonte para os exercícios, com testes determinísticos apenas onde o contrato permitir.
3. Completar o comportamento de API/UI do `adhoc`: expor status/saída somente-execução, impedir que a persistência/pontuação de tentativas trate isso como corrigido, adicionar cancelamento/limites de saída e verificar autorização/limpeza. O caminho de comando do runner já existe para Python.

## Verificação

A implementação de IntelliSense do Pyodide no frontend e os testes reais de regressão de runtime passaram antes do limite de uso atual da sessão. Os comandos finais de type-check/teste da plataforma ainda precisam ser executados quando houver créditos de execução de comando disponíveis.

## Atualização da sessão 2 (2026-09-16)

Retomando o trabalho anterior. O que mudou:

- Instalado `@azure/msal-node` em `platform-api` (lockfile atualizado). `npm run build` está limpo tanto em `platform-api` quanto em `assignment-runner`.
- `platform-api/scripts/cefet-roster.spec.ts` nunca era de fato executado pelo `npm test` (o `rootDir` do Jest é `src`, então `scripts/*.spec.ts` era silenciosamente ignorado). Adicionado `scripts` a `roots` do Jest em `platform-api/package.json`, agora faz parte da execução padrão de testes. Suíte completa: 45 suítes / 343 testes passando.
- Executado de ponta a ponta o smoke test real (sem mocks) do Pyodide no frontend (`front/scripts/test-python-runtime.mjs`): checagem de sintaxe, lint, Unicode, arquivos grandes, garantia de "nenhuma execução" e isolamento de falha de lint, tudo passando. A suíte Jest do front (5 suítes / 17 testes, incluindo os testes de marcador/cliente/runtime do Pyodide) está verde. O trabalho de intellisense Python do prompt paralelo `python-worker-intellisense` está concluído e verificado — nada mais a fazer ali por enquanto.
- Corrigido um bug real em `seed-cefet-microsoft.ts`: o `passwordHash` placeholder das matrículas era a string literal `'external-auth-no-password'`, e não um hash bcrypt. `HashUtils.comparePassword` (`bcrypt.compareSync`) não garante rejeitar com segurança uma string que não seja bcrypt em toda versão/plataforma — pode lançar exceção em vez de retornar `false`. Substituído por um hash bcrypt real de um UUID aleatório e descartado imediatamente, de modo que uma tentativa de login local contra uma dessas contas sempre falha com segurança, em vez de arriscar um erro 500 ou depender de comportamento específico da biblioteca.
- Revisado `execution-request.service.ts`: aparece como "modified" no git status, mas sem nenhuma diferença funcional (apenas CRLF/LF) — não faz parte desta funcionalidade, nada a fazer ali.

### Lacuna confirmada: o modo de execução `adhoc` está conectado no schema/runner, mas ainda não é seguro para pontuação

Rastreado o caminho completo: `CreateAssignmentDto.executionMode` → `Assignment.executionMode` → `SchedulingService.prepareAndRunWorker` (pula a preparação de template/teste, repassa `executionMode: 'adhoc'` ao runner) → `PythonDefaultStrategy.buildExecutionJobCommand` (roda `/app/src/app.py` diretamente em vez de `trigger.py` + pytest). Essa parte funciona e compila.

O que ainda falta, confirmado ao ler `execution-result.consumer.ts` e a entidade `Attempt`: a pontuação de tentativas não tem o conceito de "somente execução". As colunas `Attempt.score`/`passes`/`fails` não são anuláveis, e o consumidor de resultado sempre roda o `processLogResult` da estratégia (parser no estilo pytest) e grava uma pontuação de aprovado/reprovado — para uma execução `adhoc` não há linha de resumo do pytest para analisar, então hoje isso silenciosamente registraria uma tentativa enganosa de "0 passed / 0 total" como "reprovada", em vez de "aqui está a saída bruta do seu programa, sem nota."

Isso é inalcançável pelos estudantes hoje: a criação de tarefas é protegida por `AdminGuard` e ainda não existe **nenhuma UI no frontend** em lugar algum que defina `executionMode: adhoc` (o front não tem nenhuma alteração para essa funcionalidade). Então a lacuna é real, mas está dormente no momento, não é um bug ativo em produção.

Design recomendado para quem assumir isso (ainda não implementado, de acordo com a instrução do prompt original de documentar em vez de apressar um caminho de execução inseguro):

- Adicionar um `Attempt.executionMode` explícito (ou um novo `AttemptStatus.RAN`/equivalente) para que uma tentativa somente-execução seja estruturalmente distinta de uma corrigida, com `score`/`passes`/`fails` anuláveis ou com um sentinela documentado — precisa de uma migration.
- Ramificar `execution-result.consumer.ts` conforme o `executionMode` da tarefa: para `adhoc`, persistir stdout/stderr/exit code brutos e pular `processLogResult` completamente, em vez de passar a saída do worker pelo parser no estilo pytest/Jest.
- Adicionar a superfície de produto de fato: alternância `graded`/`adhoc` no editor de tarefas, uma ação distinta de "Executar" (não "Enviar para correção") e painel de resultado no workspace do estudante, truncamento de saída e um caminho de cancelamento — nada disso existe em `front/` ainda.
- Reverificar autorização e limpeza de ponta a ponta quando o item acima for implementado.

### Ainda bloqueado / precisa da sua decisão

- O `--dry-run` do Microsoft Graph **não** foi executado — precisa de `MICROSOFT_TENANT_ID` e `MICROSOFT_CLIENT_ID` reais para o registro de aplicação do tenant do CEFET, que não estão disponíveis neste ambiente e não devem ser adivinhados ou inventados. Forneça-os (por exemplo via `platform-api/.env`, nunca versionado) e confirme a permissão Graph aprovada (`User.ReadBasic.All`, delegada) antes que o próximo agente rode `ts-node scripts/seed-cefet-microsoft.ts <roster> --dry-run`.
- A Fase 2 (importação de PDF) ainda é apenas um inventário (`cefet-rj-classes/catalog.json`, as três fontes marcadas como `needs-extraction`). Nenhum texto foi extraído ou revisado ainda.
- A Fase 3 precisa de um aval explícito sobre a mudança de schema acima (nova migration + alteração de entidade) antes da implementação, já que isso afeta a persistência de tentativas corrigidas.

