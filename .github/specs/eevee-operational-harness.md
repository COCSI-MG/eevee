# Harness incremental: prontidão, memória e desempenho do EEVEE

## Reconciliação com as otimizações de listas — 2026-10-18

A base agora inclui o dashboard leve de #369 e as otimizações de atividades
administrativas (#372), templates (#374), usuários (#376) e tarefas da turma
(#382). Cada mudança de lista mantém o contrato enxuto da respectiva PR; o
incremento local complementa essas mudanças, sem restaurar o endpoint antigo
`GET /assignment` removido de `develop`.

- O carregamento separado de coleções permanece em `findAllForAdminMe()` e
  nos detalhes da atividade. O benchmark chama o método público
  `findAllUserAssignments()`, preservando a renomeação de #369.
- Preparo de preview/submissão busca detalhes sem carregar tentativas e todos
  os membros; verificações de acesso, suspensão e prazo continuam no fluxo.
- `findAllPaginated()` usa o DTO de #372, sem coleções nem decoração pesada.
  A turma desativada permanece visível ao administrador sem quebrar o mapper.
- A lista da turma usa o resumo de #382: última tentativa do próprio usuário,
  existência de tentativa aceita concluída e suspensão por alertas ativos.
- Diagnósticos, afinidade preferencial e listener de métricas continuam
  opcionais e desabilitados nos valores padrão. Este release não provisiona
  capacidade nem exige permissões de administrador dos nós.

Validação local do conjunto: 438 testes da API, 48 do frontend, 31 do runner,
8 dos scripts operacionais e 7 de integração com PostgreSQL 16 descartável.
A integração cobre coleções completas, privacidade/ordenação do histórico,
preparo sem histórico, turma desativada, templates sem conteúdo na lista,
usuários sem hashes/matrículas e resumo/suspensão da turma. As fixtures são
sintéticas; os testes não fazem requisições de escrita em produção.

Smoke do benchmark reconciliado: três operações, concorrência 1, uma rodada,
dois ciclos de três requests, contratos equivalentes. O resultado está em
`.eevee-state/performance/run-1792370087392`. O detalhe teve p95 de 10,23 ms na
baseline e 11,01 ms no patch; não há ganho universal nem prova de cura de
vazamento. O ensaio representativo abaixo continua sendo evidência histórica,
não uma nova medição da produção de 18/10.

## Incremento medido e política de fallback — 2026-10-13

**Decisão explícita do usuário:** favorecer nós estáveis, mas nunca reter uma
execução só porque a observação não certificou nenhum nó. Quando não há alternativa
confiável, aceitar a inconsistência e tentar executar. A infraestrutura é externa
e tem custo; não criar capacidade, mudar nós ou impor uma quarentena obrigatória.
Esta decisão substitui as propostas históricas de fail-closed, seletor obrigatório
e fila esperando elegibilidade neste documento.

Implementação local, sem deploy:

- CronJob no chart, com frequência padrão de um minuto, sem sobreposição, deadline
  de 50 segundos e sem retry da própria coleta. O cron GitHub de 12 horas foi
  removido; o workflow HTTP permanece somente manual.
- Observer coleta CPU/working set dos pods, limites, reinícios, estado dos nós e
  métricas dos nós quando autorizadas. Mede `pods/log` usando apenas um marcador
  benigno do canary por nó, pelo endpoint interno do runner e por backends HTTPS
  explicitamente configurados. Não lê logs de estudantes nem altera labels/Jobs.
- Listener interno opcional da API em porta separada: heap/RSS/memória externa,
  CPU acumulada, amostra após callback de GC, event-loop delay e contadores/buckets
  de duração de requests. Requer token de Secret e não entra no gateway público.
  A amostra após GC não é uma medição atômica do heap no término da coleta.
- Relatórios detalhados ficam no PVC `/reports`, com retenção limitada por contagem
  (1.440 amostras por padrão). O snapshot pequeno com timestamp/expiração fica
  em `eevee-node-report`, no mesmo namespace do runner. Ausência de métrica/RBAC
  é evidência desconhecida, não zero nem defeito de nó.
- Três amostras consecutivas completas dão a classificação estável; uma amostra
  malsucedida/ausente retira a preferência imediatamente. Histórico vencido não
  conta para recuperação. Isso classifica evidência recente, não prevê falhas.
- O builder central dos Jobs lê o snapshot antes de criar cada worker, com espera
  máxima de dois segundos pela leitura. Relatório válido adiciona **afinidade
  preferencial**, com peso 100, para os nós estáveis compatíveis com o seletor
  existente. Kubernetes continua podendo usar os outros nós, inclusive quando os
  preferidos não têm capacidade. Relatório ausente, vencido, malformado, proibido
  ou sem candidatos usa o agendamento normal e registra o fallback. Não há delay
  BullMQ, restrição obrigatória nova nem falha acadêmica por falta de confiança.

### Benchmark executado

Script: [assignment-performance.ts](../../platform-api/scripts/assignment-performance.ts).
Baseline congelada nas formas de consulta admin de `5c4c18e`, versus o serviço
atual. Processos separados, mesma fixture/banco, alternância A/B e B/A, heap de
768 MiB, aquecimento, serialização JSON e ciclos com GC explícito só no ensaio.
O diagnóstico de volume JSON por linha fica fora da fase cronometrada; não cria
uma string gigante adicional para o resultado SQL inteiro.

Ambiente local: Windows, Node 22.12.0, TypeORM 0.3.28 e PostgreSQL 16.11
descartável. Produção usa imagem Node 24; CI foi alinhada a Node 24, mas não foi
executada remotamente nesta sessão. Resultados locais não são uma calibração de CI.

| Ensaio | Resultado e limite |
|---|---|
| Pequeno: 4 atividades, 16 membros, 40 tentativas, código e relatório de 1 KiB cada, templates/parâmetros preenchidos | 36 processos (3 operações × concorrências 1/5/10 × 2 variantes × 2 repetições), 15 requests por processo; contratos equivalentes. Detalhe com concorrência 1 teve p95 mediano ~12% maior no patch; não há ganho universal |
| Representativo: 33 atividades, 62 membros, 463 tentativas, código e relatório de 8 KiB cada, 2 templates × 2 parâmetros | 24 processos (3 operações × concorrências 1/5 × 2 variantes × 2 repetições), 15 requests por processo; todos os patches completaram |
| Admin `/me`, representativo, concorrência 1 | Baseline p95 3.875–4.466 ms e pico de heap amostrado 618,6–619,6 MiB; patch p95 133,0–142,8 ms e pico 85,0–89,1 MiB. Mesmo payload final; 1→6 consultas, 28.706→1.116 linhas, JSON equivalente das linhas ~499,6→7,44 MiB |
| Admin `/me`, representativo, concorrência 5 | Baseline esgotou heap na fase de carga nas duas repetições; patches completaram, p95 556,8–600,2 ms, pico 111,5–111,8 MiB |
| Detalhe/preparo, representativo | Baseline esgotou heap na fase de diagnóstico das consultas. Não há p95/razão ou equivalência demonstrada nesses casos grandes. Patches completaram; a equivalência foi verificada no perfil pequeno e pelos testes de contrato |
| Controle negativo de retenção | Respostas sintéticas foram mantidas intencionalmente (100 requests, 5 ciclos); heap pós-GC do patch cresceu 7,44 MiB entre primeiro/último ciclo. O gate configurado para esse controle reprovou e retornou saída 1 |

Evidência local ignorada: `.eevee-state/performance/run-1791871904578` (pequeno),
`run-1791872553151` (representativo final) e `run-1791873048235` (controle negativo).
Cada pasta tem `summary.json` e métricas/amostras por processo. As medianas de duas
repetições nos resumos foram corrigidas para o ponto médio, sem alterar amostras.
O primeiro ensaio representativo `run-1791872032752` é exploratório e foi substituído
pelo final, após retirar a serialização de todo o resultado SQL do diagnóstico.

**Conclusão permitida:** redução forte e reproduzida do custo da consulta admin
nesse workload, com mais consultas; não afirmar cura de vazamento nem melhora de
todos os endpoints. Ainda faltam soak prolongado, referências retentoras/snapshots,
HTTP real, execução ponta a ponta e comparação em recursos/versão de produção.
Picos amostrados são limites inferiores; maxRSS do processo também inclui preparação.

Na CI, o benchmark gera artifacts por 90 dias e reprova falhas do patch ou
diferenças de contrato. Sem limites calibrados ele fica em modo de medição, e não
promete gate de latência/retenção. `EEVEE_PERFORMANCE_LIMITS_JSON` configura os
limites explícitos; um baseline que não termina deixa a comparação inconclusiva,
não recebe uma razão inventada. Metadados, amostras pós-GC e negativos são guardados.

### Primeira observação em produção, antes do deploy

Snapshot somente leitura em **13/10/2026 03:36:31 America/Sao_Paulo**, mediante
autorização explícita do usuário. Sem deploy, escala, canary novo, carga, consulta
de estudante ou alteração de agendamento. O arquivo é
`.eevee-state/production/snapshot-20261013T063650Z.json`.

- Todos os 12 nós estavam Ready e sem MemoryPressure/DiskPressure. Isso não
  certifica prontidão de logs nem estabilidade de memória.
- API: working set ~119,7 MiB, RSS ~173,2 MiB, cgroup ~120,7 MiB de limite de 1 GiB;
  16 reinícios, último término registrado em 12/10 18:24:04 Brasília, reason Error,
  exit 139. Não houve novo restart entre a investigação histórica e esse snapshot.
  cgroup reportava zero OOM/OOM-kill; isso não exclui um limite interno do V8.
- O acesso aos logs sem conteúdo (`tail=0`) falhou pelo **vm1-ac nos quatro nós
  amostrados** (ids-es, ids-pb, ids-pe, whx-rn). Os mesmos pods funcionaram por
  vm1-mt e vm1-ro. O caminho do control plane continua sendo um achado concreto;
  não classificar os quatro nós como defeituosos por essa falha compartilhada.
- Métricas de pods funcionaram. Métricas de CPU/memória dos nós e descoberta dos
  endpoints no namespace default foram Forbidden. Os backends foram obtidos dos
  nós declarados como control planes, usando CA/credenciais existentes. O observer
  precisará de autorização de leitura específica de nodes/metrics nodes.
- Não existem ainda canaries/telemetria nova de heap/GC/requests na produção. Uma
  primeira execução do observer não terá história suficiente para certificar nós;
  com a decisão de fallback, o runner continuará tentando executar normalmente.

### Validação do incremento

Runner: 8 suítes/31 testes e typecheck passaram, incluindo preferência por nós,
snapshot vencido/inválido, incompatibilidade de seletor e fallback no builder.
API: typecheck, 4 suítes/59 testes focados e 3 testes PostgreSQL passaram.
Observer: 3 testes passaram (quantidades, frescor, caminho de logs e persistência).
Helm lint com observer, métricas, RBAC e seleção ativados passou. Controle negativo
de memória reprovou como esperado. Não confundir isso com validação em cluster:
o novo CronJob/DaemonSet/listener ainda não foi implantado.

---

## Prioridade corrigida pelo usuário — 2026-10-13

A necessidade principal é **prontidão funcional, desempenho e estabilidade de
memória**. A disponibilidade nominal dos serviços não estava em dúvida. O monitor
HTTP é auxiliar; publicar seu workflow não satisfaz essa necessidade. Esta seção
atualiza o critério de conclusão e prevalece sobre a ênfase anterior em
disponibilidade. Não altera a implementação nem registra um novo ensaio.

### O que as mudanças atuais demonstram

| Componente | Evidência que fornece | O que ainda não demonstra |
|---|---|---|
| HTTP periódico | Status HTTP e resposta da raiz da API; duração registrada | Prontidão para submissão, limite de latência, memória ou estabilidade |
| Unitários de assignment/scheduling | Contrato, filtros e preparo sem histórico; SQL principal sem joins de coleções no caso inspecionado | Custo real da consulta e do processo sob carga |
| Integração PostgreSQL na CI | Relações reais do TypeORM preservam coleções, privacidade do histórico e preparo sem tentativas/membros completos | Pico de heap/RSS, retenção após GC, p95, carga concorrente ou execução completa |
| Mudança de carregamento | Separa coleções e evita carregar histórico no preparo de execução | Vazamento identificado/corrigido ou redução de memória medida |

O PostgreSQL da pipeline é um banco descartável para executar consultas reais,
não um banco adicional do produto nem um coletor de métricas. A fixture permanente
tem 62 membros e 162 tentativas com código sintético de 1 KiB. Seus três testes
não fazem medições de desempenho; autorização/suspensão e decoração de alertas
são substituídas nesse ensaio, que chama o serviço diretamente, sem servidor HTTP,
Redis ou runner. Templates/parâmetros estão vazios nessa fixture.

Exemplo do risco tratado: 81 tentativas × 62 membros podem gerar 5.022 linhas
intermediárias por atividade quando as duas coleções são combinadas em um join.
Separá-las permite carregar aproximadamente 81 + 62 linhas de coleções, além da
atividade e demais relações. O ORM pode deduplicar as 5.022 linhas e devolver as
mesmas 81 tentativas e 62 membros; portanto um teste do resultado final pode
continuar verde apesar dessa amplificação. Os unitários protegem parte da forma
da consulta, mas não quantificam a economia nem substituem medição de carga.

**Heap esgotado é evidência de pressão de memória; vazamento continua sendo
hipótese.** A correção proposta trata amplificação/picos. Ainda carrega históricos
completos em caminhos de consulta, e não há demonstração de que elimina todas as
fontes de pressão ou de retenção. Crescimento de RSS isolado também não identifica
um vazamento de objetos JavaScript.

### Evidência necessária para concluir este trabalho

1. **Custo e regressão de consultas:** mesma fixture representativa em baseline e
   patch, incluindo código/relatórios maiores e templates/parâmetros preenchidos.
   Registrar consultas, linhas efetivamente retornadas e volume de dados; verificar
   que coleções independentes não voltam a se multiplicar e que o preparo não
   consulta histórico. Uma variante com o join antigo deve demonstrar que o
   critério detecta a regressão, não apenas que ambas devolvem dados corretos.
2. **Desempenho sob carga:** processos separados, mesma versão Node/recursos e
   carga, aquecimento, concorrências 1/5/10 e repetições. Medir pico de heap, RSS,
   external/arrayBuffers, p50/p95, throughput, erros e atraso do event loop no
   processo da API; separar custo do PostgreSQL e do gerador de carga. Incluir
   serialização HTTP e caminhos reais de listagem, detalhe e preparo de execução.
3. **Retenção/estabilidade:** repetir ciclos equivalentes de carga e repouso em
   processo duradouro. Após aquecimento, observar a tendência do heap pós-GC,
   contadores de recursos e memória externa; GC explícito só no ensaio isolado.
   Crescimento sustentado exige comparar snapshots e identificar referências
   retentoras antes de afirmar vazamento corrigido. Um vazamento artificial
   controlado deve reprovar o detector. Um ensaio finito só cobre sua carga e duração.
4. **Prontidão funcional:** ambiente de teste com API, PostgreSQL, Redis e runner;
   submissão sintética deve entrar na fila, gerar execução e devolver/persistir
   resultado dentro do orçamento. Separar latências de fila, Job, execução e
   coleta de logs, mantendo a distinção entre falha do exercício e da infraestrutura.
5. **Tracking e gates:** guardar por execução SHA, fixture/seed, versões, limites
   de recursos, carga, amostras temporais e resumo das métricas como artifact de CI.
   Calibrar limites absolutos e tolerâncias de regressão com execuções repetidas;
   versioná-los antes de tornar o check obrigatório. Memória, p95 e erros precisam
   de critérios independentes. Não inventar percentuais ou aprovar automaticamente
   uma execução sem baseline. O artifact HTTP atual não contém essas métricas.

Estado naquele checkpoint, antes do incremento medido acima: os cinco itens eram
**pendentes**. O incremento atual implementa parte deles; seus limites e resultados
estão no início deste documento, sem certificar a cura de vazamentos.
A Etapa 0 abaixo já descrevia o benchmark, mas sua execução não foi entregue.
O próximo incremento prioritário é produzir esse benchmark e o ensaio de retenção,
antes de ampliar o monitor HTTP. Tracking em produção exige séries por serviço/
réplica e correlação com carga, reinícios e OOM; CI isolada não substitui isso.

Referências de diagnóstico: [métricas de memória do Node.js](https://nodejs.org/api/process.html#processmemoryusage)
e [comparação de heap snapshots](https://nodejs.org/en/learn/diagnostics/memory/using-heap-snapshot).

---

## Handoff consolidado - 2026-10-13 02:54:11 (America/Sao_Paulo, UTC-03:00)

Este checkpoint é o ponto de entrada atual. As seções anteriores de diagnóstico e
review permanecem abaixo como histórico; uma avaliação antiga não implica que o
código foi integrado, implantado ou validado de novo. Nenhum teste novo foi
executado para preparar este handoff.

### Checkout e fronteiras de trabalho

- **Correções de estabilidade:** `C:\Users\João Vitor Coimbra\Projects\CEFET\Pesquisa\eevee`.
- Branch local: `develop`; HEAD: `5c4c18e75e831d2f1f7f4e27df634f62942bae2c`.
- As correções estão na árvore de trabalho, **sem commit**; não existe uma branch
  dedicada de estabilidade. O índice estava sem alterações staged nesta inspeção.
- **Ferramentas:** worktree irmão `C:\Users\João Vitor Coimbra\Projects\CEFET\Pesquisa\eevee-tooling`,
  branch `chore/tooling-standardization`, HEAD `5c4c18e75e831d2f1f7f4e27df634f62942bae2c`.
  Seu guia é [docs/development-tooling.md](../../../eevee-tooling/docs/development-tooling.md).
  Esse é outro checkout; não copiar sua configuração nem alterar essa frente aqui.
- Há alterações de packages/configs de ferramentas também no checkout principal.
  Os caminhos compartilhados inspecionados não tinham conteúdos idênticos entre
  os worktrees. Não classificar todos os arquivos sujos como estabilidade e não
  commitá-los em bloco. Revisar ownership e hunks antes de qualquer integração.
- A referência para descoberta já existe em [copilot-instructions.md](../copilot-instructions.md).
  Não foi encontrado AGENTS.md na raiz deste checkout ou em .github; não foi
  criado outro arquivo de controle. Um próximo agente deve verificar novamente
  instruções aplicáveis, pois o estado pode mudar.

Estado observado do checkout principal:

```text
## develop...origin/develop
 M .github/copilot-instructions.md
 M .github/specs/postgresql-worker-harness.md
 M .github/workflows/ci-platform-api.yaml
 M .gitignore
 M assignment-runner/package.json
 M front/eslint.config.mjs
 M front/package-lock.json
 M front/package.json
 M package-lock.json
 M packages/execution-contracts/package.json
 M platform-api/.prettierrc
 M platform-api/package.json
 M platform-api/src/assignment/assignment.service.spec.ts
 M platform-api/src/assignment/assignment.service.ts
 M platform-api/src/scheduling/scheduling.service.spec.ts
 M platform-api/src/scheduling/scheduling.service.ts
 M scripts/README.md
?? .github/specs/eevee-operational-harness.md
?? .github/workflows/ci-state-validation.yaml
?? .github/workflows/validate-state.yaml
?? platform-api/src/assignment/assignment-loading.integration-spec.ts
?? scripts/diagnostics/
?? scripts/validate-state.mjs
?? scripts/validate-state.test.mjs
```

Estado observado do worktree de ferramentas (somente leitura):

```text
## chore/tooling-standardization
 M .github/copilot-instructions.md
 M README.md
 M assignment-runner/package.json
 M front/eslint.config.mjs
 M front/package-lock.json
 M front/package.json
 M package-lock.json
 M packages/execution-contracts/package.json
 M platform-api/.prettierrc
 M platform-api/package.json
?? .github/workflows/ci-tooling.yaml
?? .prettierignore
?? .prettierrc.json
?? assignment-runner/eslint.config.cjs
?? docs/development-tooling.md
?? eevee.code-workspace
?? lefthook.yml
?? package.json
?? platform-api/eslint.config.cjs
?? scripts/tooling/
```

### Objetivo: estabilidade na infraestrutura RNP

Tolerar falhas temporárias de control plane, kubelet e rede sem confundir saúde
nominal de um nó com a operação efetivamente necessária. Reduzir picos da API,
registrar evidência e preservar o contrato extensível dos workers. Não presumir
SLA, storage durável ou serviço gerenciado que a RNP não documentou. Evoluir por
etapas medidas; probes fora do caminho síncrono de submissão, com orçamento.

### Implementado, preparado e planejado

| Área | Estado deste handoff | O que conferir |
|---|---|---|
| Dashboard com contagens | Mergeado remotamente pela #369; não incorporado ao checkout local | Uma resposta com usersCount/classesCount/assignmentsCount, removendo GET /assignment |
| Admin /assignment/me | Implementado localmente, sem commit | AssignmentService.findAll() usa relationLoadStrategy query; após #369, transportar para findAllForAdminMe() |
| Detalhe e preparo da execução | Implementados localmente, sem commit | Coleções independentes separadas; tentativas por aluno e data; findOne(id, false) nos três caminhos de scheduling |
| Paginação administrativa | Mudança local duplicada retirada | findAllPaginated mantém a base; #372 ainda não foi integrada à base remota conhecida |
| Diagnóstico | Relatórios e SQL preparados | Heap esgotado e matriz control-plane/kubelet confirmados na janela histórica; expansão SQL estimada não é heap medido |
| Validação operacional | Código, documentação e testes locais | HTTP, Kubernetes opcional, histórico e sincronização de transições GitHub; workflows não publicados por este trabalho |
| Observer em leitura | Planejado | Coletar e classificar evidências antes de qualquer decisão automática |
| Probes e elegibilidade/quarentena | Planejados | Probes condicionais, validade, recuperação, orçamento e seleção centralizada; não refatorar cada imagem |
| Recuperação de logs | Planejada, não implementada | Retry limitado somente de leitura, mesmo Job, distinguindo execução de recuperação de relatório |
| Nova durabilidade/reconciliação | Não implementada | Banco já guarda tentativas; ainda faltam outbox, IDs estáveis/deduplicação transacional e adoção de Jobs órfãos |
| Benchmark de heap/latência | Pendente | Comparação com mesma fixture/carga, picos e pós-GC; não inferir ganho somente de testes verdes |

Não há evidência deste handoff de deploy das correções locais ou de conserto
administrativo do caminho vm1-ac → kubelets. O último cluster-latest.json lido
continua sendo o registro de 2026-10-12 18:47:26 de Brasília; não usar esse dado
para descrever a saúde atual de produção.

### Arquivos e símbolos para revisar primeiro

1. [assignment.service.ts](../../platform-api/src/assignment/assignment.service.ts):
   `findAll`, `createAssignmentDetailsQuery`, `findOne(id, includeAttempts)` e
   `findOneForExecution`. Relações com tentativas/membros/parâmetros/templates
   não devem ser multiplicadas no SQL principal; preservar campos públicos,
   autorização, suspensão, visibilidade temporal e histórico privado/ordenado.
2. [scheduling.service.ts](../../platform-api/src/scheduling/scheduling.service.ts):
   `createAndWait`, `createSchedulingJobAsync`, `createPreviewRun` chamam
   `findOne(id, false)`; a janela de submissão continua aplicada onde cabia.
   Existem também mudanças de formatação; separar isso da alteração funcional.
3. [assignment.service.spec.ts](../../platform-api/src/assignment/assignment.service.spec.ts),
   [scheduling.service.spec.ts](../../platform-api/src/scheduling/scheduling.service.spec.ts) e
   [assignment-loading.integration-spec.ts](../../platform-api/src/assignment/assignment-loading.integration-spec.ts):
   regressões de contrato/permissões e integração que exige banco descartável
   localhost chamado eevee_harness, com schema exclusivo. Nunca usar .env ou o
   banco persistente da aplicação para esse ensaio.
4. [validate-state.mjs](../../scripts/validate-state.mjs),
   [validate-state.test.mjs](../../scripts/validate-state.test.mjs),
   [scripts/README.md](../../scripts/README.md),
   [diagnóstico SQL](../../scripts/diagnostics/assignment-query-footprint.sql),
   [validate-state.yaml](../workflows/validate-state.yaml),
   [ci-state-validation.yaml](../workflows/ci-state-validation.yaml) e
   [ci-platform-api.yaml](../workflows/ci-platform-api.yaml).
   Rever configuração, persistência e cobertura antes de ativar qualquer rotina.
5. Relatórios ignorados em `.eevee-state/`: investigation-memory-workers-2026-10-12.md,
   incident-2026-10-12.md, cluster-latest.json e history.jsonl. Evidências locais,
   não componentes do runtime nem garantia de implantação.

Limites atuais do monitor: o workflow de 12 horas não testa pods/log nem decide
admissão de Jobs; não alerta por um limiar de latência. HTTP 200 pode coexistir
com falha na coleta dos workers. O catch genérico não é prova de defeito de nó.

### Base remota conhecida e reconciliação necessária

Fonte remota conferida pelo navegador local em 2026-10-13, aproximadamente 02:27
Brasília (nenhum fetch neste handoff):

- [#378](https://github.com/COCSI-MG/eevee/pull/378): main equalizada em develop,
  merge `c148f13c01d573ab0474c0a57a748d293cb4ad9f` às 23:57:30 de 12/10.
- [#369](https://github.com/COCSI-MG/eevee/pull/369): merge em develop às 02:00:13 de
  13/10; HEAD remoto conhecido `c10482839ab2e15116977b560f90168d42fe14ef`.
- [Comparação da base local ao remoto conhecido](https://github.com/COCSI-MG/eevee/compare/5c4c18e75e831d2f1f7f4e27df634f62942bae2c...c10482839ab2e15116977b560f90168d42fe14ef):
  cinco commits, 19 arquivos. Os refs locais continuam antigos.
- Sobreposição certa de arquivos: assignment.service.ts e assignment.service.spec.ts.
  A #369 remove findAll público e renomeia o helper; preservar carregamento
  separado em findAllForAdminMe e adaptar testes do /me. Nenhum conflito Git
  foi simulado; sobreposição não significa que todo hunk terá conflito textual.
- [#372](https://github.com/COCSI-MG/eevee/pull/372) cobre o DTO enxuto da paginação.
  Não reinserir automaticamente a mudança local duplicada. O head revisado
  ec2d533790d327d75bfd260f60809d3d40e0babf tinha o class.name nulo após soft-delete,
  já comentado pelo usuário; conferir o estado remoto antes de aproveitá-la.

Alvo da integração ainda precisa ser confirmado pelo usuário: uma branch própria
baseada no develop atual ou atualização do checkout principal. Não assumir que
“nessa branch” significa chore/tooling-standardization. Preferir isolamento para
conciliar somente estabilidade, preservando ambos os worktrees sujos. A opção é
um plano, não uma autorização para criar branch/worktree ou fazer integração.

### Regra acadêmica explícita: correção do contexto de review

A decisão humana em 2026-10-13 é: **preview não conta para nota; entre submissões,
a maior nota por aluno/atividade permanece**. FAILED pode valer zero; isso não
significa substituir uma submissão anterior maior. Esta regra prevalece sobre
classificações antigas nesta harness que tratavam FAILED → zero, isoladamente,
como defeito ou adotavam a última tentativa.

A #377 no head c79cdc7c81a6ca7aa37dc6912b6402a1ea00ff7e escolhe a última submissão
por DISTINCT ON (linha 111) e createdAt DESC/id DESC (123–124); esse é o defeito
contra a regra máxima. O ensaio mostrou submissões concluídas 10→0 retornando 0,
0→10 retornando 10, previews 10/0 sem alterar submissão 8 e média 6 em vez de
9,33 para máximas 10,10,8. Previews já usam scheduling_preview_runs separada;
a consulta de notas usa attempt. O guia/serviço de provas da base também adotam
última COMPLETED; reconciliar essa dívida de regra separadamente. Nenhuma correção
acadêmica foi implementada por este trabalho de consultas/estabilidade.

### Validação histórica e como retomá-la

| Quando / evidência existente | Comando ou ensaio | Resultado e limite |
|---|---|---|
| 12/10 19:17–19:18 Brasília, primeira correção | Jest de assignment/scheduling/controllers/class-access | 65 testes passaram; depois houve retirada da cobertura duplicada da paginação |
| 12/10 à noite, harness e logs da sessão local | platform-api: npm test -- --runInBand; npm run build | 47 suítes/437 testes e build passaram no estado daquele momento |
| 12/10, registro local (hora exata não recuperada) | assignment-runner: npm test -- --runInBand | 7 suítes/21 testes passaram |
| 12/10, registro local (hora exata não recuperada) | node --test scripts/validate-state.test.mjs | Cinco testes passaram com HTTP local/mocks; não prova GitHub/cluster de produção |
| 12/10 à noite, banco descartável PostgreSQL 16 | npm --prefix platform-api test -- --testRegex assignment-loading.integration-spec.ts | Três testes passaram após retirada da paginação; 62 membros/162 tentativas sintéticas |
| 12/10 à noite, fixture local adicional ignorada | .eevee-state/assignment-loading-review.integration-spec.ts | Quatro cenários com templates/parâmetros preenchidos passaram; essa fixture não está na cobertura permanente |
| 13/10, review #369 (head 80f2302; não aplicado localmente) | npm.cmd test -- assignment/ --runInBand | 79 testes passaram; nove verificações isoladas adicionais de count/guards/cache passaram |
| 13/10, review #377 sob a regra humana máxima | Ensaios descartáveis de submissão/preview/média | Três verificações passaram e duas falharam contra MAX; não confundir com 25 unitários existentes verdes |

Esses resultados não são uma execução nova sobre a árvore atual: packages,
configurações e documentação têm alterações concorrentes de ferramentas. Após
conciliar a base, definir os comandos compatíveis com a frente de tooling e
revalidar os caminhos afetados. No Windows da sessão histórica foi necessário
NODE_OPTIONS=--preserve-symlinks --preserve-symlinks-main e npm.cmd. Não aplicar
esse ajuste de sandbox como configuração do produto.

Não executar migrations, seeds, probes, cargas ou validação contra produção por
inferência. Para testes PostgreSQL, exigir alvo descartável explícito; containers
anteriores de review foram encerrados. Medições de heap/p95, load e deploy
continuam pendentes.

### Continuação no VS Code / Codex

Abra **a pasta eevee** acima no VS Code, não eevee-tooling, para revisar as
correções de estabilidade. Use a comparação Git dos arquivos listados antes de
aceitar mudanças; a harness é o primeiro documento a ler. A referência do ponto
de entrada é .github/copilot-instructions.md. Não é necessário instalar extensão
ou modificar configuração para usar este handoff.

Prompt sugerido para uma conversa com Codex já disponível no VS Code:

> Leia .github/specs/eevee-operational-harness.md a partir do handoff consolidado.
> Primeiro inventarie HEAD, branches/worktrees, status e instruções do checkout.
> Mostre os diffs de estabilidade e separe as alterações da frente de ferramentas.
> Confira o develop remoto e proponha como conciliar #369 sem perder patches.
> Ainda não execute merge/rebase/pull/stash/reset/checkout/commit/push/deploy nem
> testes em produção. Preserve a regra de maior nota de submissão e preview fora
> da nota. Registre evidência, limitações e decisões incrementais nesta harness.

Roteiro seguinte: confirmar alvo; preservar patches e arquivos novos com seus
respectivos donos; conciliar helper/testes com #369; conferir #372; revalidar em
ambiente isolado; medir custo das queries; projetar observer em leitura; só então
probes/eligibilidade/log recovery/durabilidade com critérios claros. Não assumir
que revisar código autoriza publicar ou mudar infraestrutura.

---

## Histórico preservado a partir de 2026-10-12

## Escopo e estado — 2026-10-12

Validar a operação dos control planes e manter um conjunto de nós elegíveis
para novos workers, sem alterar a interface nem a implementação de cada tipo
de worker. Esta POC não foi ativada em produção. Não há garantia de prever uma
falha futura: elegibilidade é evidência recente, com validade e recuperação
controladas. Uma falha pode ocorrer entre a verificação e o uso.

Implementado localmente: carregamento separado de relações da API, preparação
de execução sem histórico completo, rotina de estado e testes descritos abaixo.
O carregamento separado restante cobre admin `/assignment/me` e detalhe/execução.
A alteração local de `findAllPaginated` foi retirada para aproveitar o PR #372;
a rota local conserva o comportamento da base até a integração desse PR.
Planejado: observador, probes funcionais, política de elegibilidade e recuperação
da coleta de logs. O monitor a cada 12 horas serve para histórico; não é a
frequência adequada para decidir onde agendar cada novo Job.

Incrementar este documento a cada etapa: cenário, critério, resultado medido,
limitação e decisão de avanço. O [harness PostgreSQL](./postgresql-worker-harness.md)
continua responsável pelo ciclo de vida daquele worker.

## Evidência e limites do diagnóstico

- A API teve esgotamento de heap JavaScript e houve respostas 502 na janela do
  reinício. Isso comprova indisponibilidade naquela janela.
- A junção de tentativas com membros de turma repetia código/relatórios. A
  estimativa agregada foi 469.160.658 bytes de JSON equivalente para a coleção
  inteira e 200.974.426 para a página de dez atividades mais recentes. São
  estimativas de dados repetidos nas linhas, não heap medido nem bytes HTTP.
  A contribuição ao pico é uma hipótese forte, sem prova de vazamento permanente.
- Leitura dos mesmos logs funcionou pelos control planes mt/ro e falhou pelo
  ac em vários nós. Isso delimita um caminho defeituoso; não prova que todos
  os nós estejam defeituosos. A causa de rede/ACL exige administração do cluster.
- Um Job com testes reprovados pode ter executado corretamente. Exit code,
  `BackoffLimitExceeded` e OOM de código submetido não isolam a causa.

## Contrato simples e pontos centrais

```text
Observer separado -> evidência por (control plane, nó, operação)
                 -> snapshot com validade -> política/labels de elegibilidade

Runner -> valida snapshot -> cria Job com seletor obrigatório -> worker atual
       -> observa término -> coleta logs com retry limitado -> resultado atual
```

Os workers continuam recebendo arquivos, executando e produzindo seu resultado.
As mudanças ficam no observer e nos pontos comuns de criação/coleta do runner.
Não adicionar sidecar, endpoint de saúde por linguagem ou handshake por worker.
Uma extensão nova herda o seletor no builder comum; só configura capacidades
extras se exigir algo específico, como armazenamento/rede especial.

Já existe `K8S_JOB_NODE_SELECTOR` no builder. Pode selecionar uma label dedicada
como `eevee.io/worker-eligible=true`, mantendo vários nós possíveis. Validar JSON
e valores dessa configuração: hoje um JSON inválido pode resultar em ausência
de seletor; a POC deve rejeitar isso ao iniciar em modo obrigatório.

Kubernetes já trata NotReady, pressões e taints. Falhas funcionais como
control plane → kubelet para `pods/log` exigem evidência específica do EEVEE.
A integração complementa essas condições; não substitui o scheduler.

## Etapa 0 — reduzir custo da API antes dos probes

As mudanças locais usam `relationLoadStrategy: query` para separar coleções,
preservando os dados retornados. Em `findOne(id, false)`, o scheduling não
carrega tentativas nem todos os membros da turma. Autorização, suspensão,
visibilidade e datas continuam obrigatórias. O detalhe padrão mantém o
histórico permitido ao usuário. O carregamento separado faz mais consultas,
mas evita multiplicar coleções independentes na mesma junção.

DTO enxuto para a tabela administrativa está proposto no PR #372 e não deve
ser duplicado localmente. Resumo/contagens e histórico paginado continuam nos
endpoints apropriados.
Antes de mudar o payload, verificar consumidores. Não remover campos de forma
silenciosa. Revisar também logs que imprimem entidades completas.

Comparar baseline e mudança em ambiente isolado com a mesma fixture e carga:
33 atividades, 62 membros na turma grande, 463 tentativas distribuídas, dados
sintéticos com tamanhos equivalentes; incluir parâmetros/templates e página vazia.
Aquecer, repetir com concorrências 1/5/10 e guardar duração, p50/p95, volume SQL,
tamanho HTTP, heap pós-GC, pico de heap, RSS e event-loop delay. Usar processos
separados por variante; registrar versão, recursos, número de repetições e dispersão.
Heap snapshot/profiling somente na réplica de diagnóstico, fora do pod único de prod.

Aceite: payload/autorização equivalentes, sem produto cartesiano de coleções,
menor pico demonstrado na carga representativa e nenhuma regressão relevante de
p95. Os ensaios funcionais realizados não demonstram redução de memória/latência.

## Etapa 1 — observer somente leitura

Primeiro aproveitar logs retidos de Jobs recentes e seus metadados; leitura
limitada a um marcador/pequena cauda, sem copiar código ou relatórios de alunos.
Testar a operação `pods/log` pelo endpoint de cada control plane, com TLS e
credenciais válidos. `/readyz` serve como sinal adicional, não como substituto.
Reutilizar evidência já coletada, aplicar timeout, cache e backoff para evitar
tempestade de consultas. Não consultar todos os control planes por submissão.

Registrar: horário, validade, nó, backend do control plane, operação, latência,
tipo de erro e id de correlação. Quando o backend real do endpoint HA não puder
ser identificado, deixar a origem desconhecida. Não inferir causalidade apenas
por proximidade temporal. Eventos de mudança entram no histórico/board; repetir
o mesmo estado não cria novas issues. Guardar snapshots para análise científica.

O caminho testado precisa representar o runner em produção. Um teste do jump
host pode ter origem/ACL diferente. Trocar apenas kubeconfig do monitor não
altera o endpoint interno usado pelo runner. Roteamento saudável do endpoint HA
e correção do backend defeituoso dependem da administração do cluster.

Aceite: matriz reproduzível e baixo custo medido, sem labels, exclusão de nós
ou mudanças em Jobs. Primeiro acumular evidência; depois calibrar limites.

## Etapa 2 — probe sintético somente quando faltar evidência

Executar um Job comum dedicado ao monitor, emitindo um marcador e terminando.
Usar a imagem já disponível, identificada por versão/digest e com cache quando
adequado. Testar bootstrap, agendamento, término e coleta de logs; ele não
certifica todos os frameworks, dependências ou o PostgreSQL de cada exercício.
Se uma capacidade especial precisar ser certificada, acrescentar um perfil
opcional do observer, sem exigir refatoração de todos os workers.

Orçamento inicial para experimentação, ainda não medido: no máximo um probe
ativo no cluster; por probe requests 25m/32Mi, limits 100m/64Mi, deadline 30s e
TTL 300s. A imagem escolhida deve realmente caber nesse orçamento ou ele deve
ser revisado. Prioridade inferior aos workers, sem tolerar pressões dos nós.
Frequência inicial proposta: verificar a cada minuto evidência com validade de
cinco minutos; criar probe apenas se ausente/expirada e houver capacidade livre.
Não repetir imediatamente um probe falho nem criar um Job por control plane:
ler o marcador do mesmo Pod pelos vários endpoints.

Não acrescenta espera por teste ao runtime da submissão, mas consome CPU,
memória, rede e API Kubernetes compartilhadas. Suspender novos probes sintéticos
quando houver backlog ou pressão. Nessas condições, aproveitar workers reais;
se não houver evidência suficiente, registrar desconhecido. Não marcar como
saudável apenas porque o orçamento impediu uma verificação.

Aceite proposto: overhead medido inferior a 1% da CPU agregada destinada aos
workers na janela e variação de p95 de submissões inferior a 5%, com repetição
e dispersão documentadas. Esses números são metas de piloto, não promessa.

## Etapa 3 — conjunto elegível, primeiro com decisão manual

Elegível requer Ready, ausência de pressão/taints impeditivos, capacidade para
o perfil e evidência funcional recente pelo caminho que o runner efetivamente
usará. Conjunto inicial definido pela administração, nunca por todo nó descoberto.
Sem evidência, estado desconhecido; uma falha isolada fica suspeita. Quarentena
requer repetição e atribuição ao nó, comparando caminhos independentes quando
disponíveis. Proposta inicial: três falhas atribuíveis consecutivas para retirar
e três sucessos espaçados para recuperar; ajustar com dados do modo observador.

Aplicar label dedicada e seletor obrigatório a novos Jobs. Labels não expiram
sozinhas: o runner precisa validar a validade do snapshot antes de criar Jobs.
Observer indisponível/snapshot vencido deve impedir novos agendamentos quando
a política estiver ativa, sem confiar indefinidamente em labels antigas. Fila
mantém solicitações dentro de prazo e capacidade configurados, comunica espera
operacional e expira com erro operacional, sem reprovar aluno nem acumular
indefinidamente. Medir esse trade-off de disponibilidade no piloto.

Retirada afeta novos Jobs; não fazer drain, evict ou matar Jobs em execução.
Não mover PostgreSQL/Redis/frontend automaticamente. Alterar labels de nodes
requer permissões específicas de cluster, ausentes no acesso namespace-admin;
isolar esse privilégio no controller e limitar a ação à label EEVEE.

Aceite: agendamento apenas no conjunto elegível fresco, múltiplos candidatos,
recuperação estável, ausência de flapping e decisão auditável. Começar manual;
automatizar somente após ensaio de falhas e revisão dos falsos positivos.
Rollback: desligar política e restaurar configuração/labels anteriores sob
decisão operacional; não remover seletor automaticamente quando tudo falhar.

## Etapa 4 — coleta de logs resiliente no runner

Separar fatos internos: término do Job, disponibilidade dos logs e diagnóstico
do caminho. Se o Job terminou e os logs ficaram inacessíveis, resultado é
indisponível/desconhecido; não converter automaticamente em erro do exercício.
Retry limitado apenas de coleta, com deadline global, backoff/jitter e retenção
do Pod suficiente. Não reenviar o código nem criar outro Job automaticamente.
401/403 exigem correção de acesso; 404 por Pod expirado é perda de evidência,
não prova de nó ruim. Preservar contrato público até existir migração explícita.

Aceite: recusa transitória recupera o mesmo Job e publica uma vez; falha
permanente encerra dentro do orçamento, com diagnóstico útil e sem penalidade
acadêmica automática. Idempotência da publicação deve ser testada.

## Matriz obrigatória de cenários da POC

| Cenário | Decisão esperada |
|---|---|
| Testes reprovam/compilação falha, logs disponíveis | Resultado do exercício; não retirar nó |
| Processo do aluno excede memória | Limite do exercício; causa de nó não presumida |
| Um control plane falha para vários nós; outros funcionam | Isolar caminho/control plane; não quarentenar todos os nós |
| Um nó falha por vários caminhos saudáveis | Suspeita de nó; confirmar antes de retirar |
| Nenhum caminho funciona | Falha global/desconhecida; alertar, sem culpar todos os nós |
| Ready mas coleta recusada | Ready sozinho não certifica operação |
| Timeout/image pull por registry externo | Dependência compartilhada; não culpar nó sem comparação |
| Job acaba; recusa transitória só na coleta | Retry dos logs do mesmo Job |
| Snapshot vence/observer para | Sem nova admissão em modo obrigatório; fila com prazo |
| Todos os nós ficam inelegíveis | Disponibilidade reduzida explícita; sem fallback silencioso |
| Recuperação intermitente | Histerese; nenhuma alternância por um único sucesso |
| Nova estratégia de worker | Mesma política no builder, sem mudar worker |

Ensaiar falhas primeiro por mocks no runner/observer, depois em cluster de teste
compatível com a versão real. Não injetar falhas na produção para validar a POC.

## Lentidão: medidas por ordem de execução

1. Validar e publicar redução de amplificação SQL; depois DTO de listagem e
   métricas da API. Não aumentar só o heap dentro do mesmo limite do container.
2. Corrigir caminho control plane → kubelet; parar perda de resultados e
   repetições manuais que acrescentam carga. Retry tem orçamento, não é cura
   para backend persistentemente defeituoso.
3. Medir separadamente espera na fila, criação do Job, Pending/agendamento,
   pull, bootstrap/instalação, testes, término e coleta/publicação. Reutilizar
   timestamps Kubernetes e os eventos existentes antes de criar instrumentação
   pesada. Poll de dois segundos acrescenta atraso de detecção de até cerca
   de um intervalo em condições normais; não explica sozinho execução longa.
4. Imagens versionadas e cache; pré-instalar dependências comuns quando o
   bootstrap `npm install` dominar a medição. Evitar cache mutável compartilhado
   entre código de alunos. `Always` não significa baixar todas as camadas sempre.
5. Orçamento agregado de concorrência das duas filas e de recursos dos workers
   e init containers. Cinco consumidores em cada caminho podem gerar dez Jobs
   por réplica: aumentar concorrência sem capacidade pode piorar p95.
6. Retenção de comandos BullMQ por idade/contagem e monitoramento de Redis.
   Não aplicar evicção indiscriminada nem apagar jobs ativos para liberar RAM.

Para paper: comparar scheduler padrão, Ready+seletor estático e política funcional
com o mesmo workload/falhas. Medir taxa de resultados recuperados, falsos
positivos, tempo de detecção/recuperação, overhead e p95; registrar sementes,
versões, recursos e intervalos de confiança. A POC não prevê degradação de VM
sem sinais; avalia detecção e contenção com evidência observável.

## Validação executada e como repetir

Em 2026-10-12, no workspace Windows com Node e dependências instalados:

| Verificação | Resultado |
|---|---|
| API: `npm test -- --runInBand` | 47 suítes, 437 testes passaram após retirar o teste duplicado de paginação |
| API: `npm run build` | Passou |
| Runner: `npm test -- --runInBand` | 7 suítes, 21 testes passaram |
| Rotina: `node --test scripts/validate-state.test.mjs` | 5 testes passaram |
| API: integração PostgreSQL 16 descartável | 3 testes passaram após retirar a cobertura de paginação destinada ao PR #372 |
| YAML dos workflows e `git diff --check` | Sintaxe/whitespace passaram; CI remota ainda não executada |

O ensaio pontual usou 62 membros e 162 tentativas sintéticas. Verificou a coleção
de admin `/assignment/me`, o histórico privado e a preparação de execução.
Não mediu heap/p95, nem reproduziu esgotamento de memória ou executou workers.
O container foi removido após o ensaio. A integração
com PostgreSQL descartável está configurada na CI para verificar compatibilidade
das consultas, sem certificar a correção dos incidentes investigados.

Para repetir localmente, iniciar um PostgreSQL dedicado com banco `eevee_harness`,
definir `EEVEE_TEST_DATABASE_URL` para localhost e executar
`npm --prefix platform-api test -- --testRegex assignment-loading.integration-spec.ts`.
O teste recusa host remoto e banco com outro nome, cria schema exclusivo e remove
somente esse schema. Não reutilizar o banco da aplicação; encerrar o container
descartável após o ensaio.

No sandbox Windows desta sessão foi necessário
`NODE_OPTIONS=--preserve-symlinks --preserve-symlinks-main` e `npm.cmd`.
A CI da API inclui a integração além dos testes/build existentes. A CI da rotina
testa histórico e transições GitHub com HTTP local/mocks. Os workflows precisam
ser publicados para rodar no GitHub; não foram executados remotamente.

Próximo incremento: benchmark SQL/heap reproduzível e observer em modo leitura.
Depois, probe condicional; por último, admissão por elegibilidade e automação
das decisões. Cada etapa depende do aceite anterior, não de prazo fixo.

## Referências

- [TypeORM: processamento e consultas eficientes](https://typeorm.io/docs/performance-optimization/efficient-use-of-query-builder/)
- [Kubernetes: comunicação control plane/node](https://kubernetes.io/docs/concepts/architecture/control-plane-node-communication/)
- [Kubernetes: seletores e afinidade de nós](https://kubernetes.io/docs/tasks/configure-pod-container/assign-pods-nodes-using-node-affinity/)
- [Kubernetes: taints e tolerations](https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/)
- [Kubernetes: health endpoints](https://kubernetes.io/docs/reference/using-api/health-checks/)

## Incremento de revisão local — 2026-10-12

Revisados todos os 16 arquivos diferentes de HEAD: nove modificados e sete
novos, incluindo diagnóstico SQL, documentação, testes e workflows. Nenhuma
correção de código ou alteração de produção foi aplicada nesta revisão.

Ensaio adicional em PostgreSQL 16 descartável: a fixture local ignorada
`.eevee-state/assignment-loading-review.integration-spec.ts` preenche template,
dependência, parâmetro de template e valor de assignment. Os quatro cenários
passaram, inclusive preparação com `findOne(id, false)`. O container foi removido.
Essa cobertura adicional ainda não está na integração versionada/CI: nela,
templates e parâmetros continuam vazios. Não declarar esse caminho preenchido
coberto continuamente apenas com o ensaio local.

Não foi encontrada regressão funcional nas consultas/scheduling revisados.
Continuam pendentes benchmark e DTO enxuto: a estratégia separa relações, mas
as listagens ainda retornam código/relatórios completos das tentativas.

Limites confirmados do monitor: uma resposta HTTP correta com 1.023 ms foi
registrada como saudável e saída 0, pois não há limiar de latência. A execução
agendada não habilita Kubernetes nem testa `pods/log`; portanto não identifica
o connection refused do caminho dos workers se front/API raiz responderem.
O catch de inspeção também reúne acesso, ferramenta e timeout num único sinal;
não usar esse sinal para atribuir falha a um nó. Tratar esses pontos nos próximos
incrementos do observer, preservando a distinção entre indisponibilidade,
lentidão e evidência desconhecida. O resultado desta revisão não certifica a
POC como implementada nem a redução de p95/memória em produção.

## Finalidade da integração e diagnóstico dos incidentes

O serviço PostgreSQL de `ci-platform-api.yaml` e o teste
`assignment-loading.integration-spec.ts` verificam compatibilidade das consultas
após alterações na forma de carregar relações. Para diagnosticar os incidentes,
priorizar evidência diretamente
relacionada aos incidentes: pico de heap/RSS e latência das consultas com carga
representativa; matriz de leitura de logs por control plane/nó; preservação do
resultado do mesmo Job após recusa transitória; limites de concorrência/recursos
e separação entre falha do exercício, do caminho de coleta e do nó. A integração
funcional não mede esses resultados; o benchmark isolado e os ensaios do caminho
de execução continuam pendentes.

## Sobreposição com PRs — 2026-10-12

Consultados pela API do GitHub os oito PRs abertos, incluindo diffs completos
por arquivo, e a lista dos 30 encerrados mais recentemente. A lista web em
cache mostrava somente três abertos; a comparação usa a resposta atual da API.
Base do workspace observada nesta consulta: `5c4c18e`, também base dos PRs
recentes destinados a develop. Nenhum PR foi alterado, integrado ou encerrado.

| PR | Escopo confirmado no diff | Relação com as mudanças locais |
|---|---|---|
| [#372](https://github.com/COCSI-MG/eevee/pull/372) | Campos/DTO enxutos para `/assignment/paginated`; elimina tentativas, membros, boilerplate e decoração de alertas da listagem | Sobreposição direta com `findAllPaginated` e seus testes. Preferir a solução do PR para a tabela administrativa; não reintroduzir coleções ao combinar patches |
| [#369](https://github.com/COCSI-MG/eevee/pull/369) | Dashboard usa contagens em `/dashboard/metrics`; remove `/assignment`; renomeia `findAll` para `findAllForAdminMe` | Complementa a redução de carga e afeta o mesmo serviço/testes. A consulta de admin `/assignment/me` ainda carrega tentativas/membros; adaptar ali a estratégia local de carregamento separado |
| [#374](https://github.com/COCSI-MG/eevee/pull/374) | Reduz campos da lista de templates, mantendo `content` | Mesmo objetivo de reduzir carga, outro endpoint; sem arquivos em comum com o diff local |
| [#376](https://github.com/COCSI-MG/eevee/pull/376) | Lista usuários com id/nome/email/role, sem carregar membros de turmas | Complementar, sem arquivos em comum |
| [#377](https://github.com/COCSI-MG/eevee/pull/377) | Nova tela de desempenho por turma, consultas de notas resumidas e índices | Funcionalidade nova; não substitui as correções das consultas existentes nem a POC operacional |
| [#347](https://github.com/COCSI-MG/eevee/pull/347) | Configuração Jest para decorators; mudanças de deploy/Helm | Outro tipo de falha de worker; não trata coleta de logs, saúde dos nós ou conectividade do control plane |
| [#344](https://github.com/COCSI-MG/eevee/pull/344) | Visualização/download de código por tentativa e endpoint dedicado | Funcionalidade complementar; não corrige as junções da listagem |
| [#371](https://github.com/COCSI-MG/eevee/pull/371) | Cypress para CRUD/acesso de usuários | Outro escopo |

Ainda específicos das mudanças locais: detalhe/preparação de execução sem
histórico desnecessário e sem produto cartesiano, carregamento separado da
coleção usada por admin `/assignment/me`, rotina de estado e harness operacional.
Não foram encontradas implementações de retry de logs, elegibilidade de nós ou
validação funcional por control plane nos oito diffs abertos; esses itens
continuam planejados localmente. Isso não comprova melhora em produção nem
ausência de trabalho equivalente em branches sem PR.

Ao integrar: aproveitar #369/#372, ajustar testes e a integração local que hoje
esperam coleções completas em admin `/assignment/me`, e medir o conjunto
resultante. A paginação e seu novo DTO ficam nos testes do #372. Não abrir uma segunda solução
para a mesma listagem sem reconciliar esses contratos.

## Remoção da sobreposição e revisão dos PRs — 2026-10-12

Retirada exclusivamente a otimização local de `findAllPaginated`: restaurados
joins e clone da base; removidos o teste local adicional de escopo da paginação,
as assertions de SQL paginado e o cenário de paginação da integração. O método
agora deve permanecer idêntico a HEAD. Mantidos o detalhe/execução, o carregamento
separado de admin `/assignment/me`, o monitor e seus testes. A CI com banco
descartável continua para os três cenários próprios restantes. Não foi aplicada
nenhuma alteração nos PRs, merge ou deploy; os pontos abaixo são para os autores.

Os oito commits revisados são os heads consultados pela API e extraídos para
cópias isoladas em `.eevee-state/pr-review/`. As reproduções adicionais ficaram
nessas cópias ignoradas; não foram incorporadas aos PRs.

### Bugs e bloqueios confirmados

**#372 — P1: turma desativada derruba a listagem administrativa.**
Em `platform-api/src/assignment/assignment.service.ts:602`, o DTO acessa
`assignment.class.name` sem tratar a relação nula. O left join do TypeORM
exclui classes com soft delete, mas mantém a atividade. Reproduzido com
PostgreSQL 16 real: listar funciona com turma ativa; após soft delete, rejeita
com `Cannot read properties of null (reading 'name')`, resultando em 500.
Classe pode ser desativada com atividades existentes pelo serviço atual.
Texto para o autor: "Validar `/assignment/paginated` com uma turma desativada
que ainda tenha atividades. Tratar a classe nula e definir explicitamente a
política para atividades de turmas arquivadas. A listagem inteira não deve
falhar. Incluir esse cenário além da paginação normal."
[PR #372](https://github.com/COCSI-MG/eevee/pull/372).

**#376 — P1: três testes quebrados bloqueiam a CI.**
`platform-api/src/user/user.service.ts:85` acrescenta `.select()`, mas o mock
de QueryBuilder em `user.service.spec.ts` não o implementa. Reproduzidos três
`TypeError: ...select is not a function`; sete testes passam. A CI pública
também falhou na etapa Tests, e Build foi pulado.
Texto para o autor: "Atualizar o mock com `select`, conferir a seleção dos
quatro campos e alinhar as expectativas ao DTO sem `userClasses`. Reexecutar
os três cenários de paginação e a suíte antes do merge."
[Check falho](https://github.com/COCSI-MG/eevee/actions/runs/38191353646/job/114624589835).

**#377 — P1: falha de infraestrutura passa a substituir nota válida por zero.**
`platform-api/src/class/class-performance.service.ts:119` seleciona tanto
COMPLETED quanto FAILED, e a linha 134 converte FAILED em zero. Neste sistema,
o processor publica FAILED também quando a coleta de logs recebe connection
refused; a API grava essa causa no report com passes/fails zero. Reprovação de
testes pode chegar como execução COMPLETED com nota zero: os estados não são
equivalentes. Reproduzido no PostgreSQL real: tentativa COMPLETED com score 1,
seguida por FAILED com report de recusa na coleta, passa a aparecer com nota 0,
substituindo a nota 10 anterior e afetando a média.
Texto para o autor: "Validar uma tentativa corrigida seguida por falha apenas
de coleta/rede. Não converter indisponibilidade operacional em reprovação.
Usar resultado acadêmico válido ou apresentar indisponibilidade enquanto não
houver classificação confiável; preservar zero de uma correção válida."
[PR #377](https://github.com/COCSI-MG/eevee/pull/377).

**#344 — P2: URL sem attemptId válido fica em loading permanente.**
Em `front/src/app/assignment/[id]/workspace/users/[userId]/page.tsx:29`, a query
fica disabled com attemptId ausente/inválido; a linha 122 usa isPending para
mostrar Loader antes do estado de erro. Confirmado o estado do QueryObserver
instalado: disabled sem dados tem isPending=true, isLoading=false e fetchStatus
idle. Assim, a mensagem de erro não é alcançada nesse caminho.
Texto para o autor: "Validar IDs e attemptId antes do Loader; mostrar erro
explícito para URL incompleta/inválida. Não usar isPending de query disabled
como indicação de que uma requisição está em andamento."
[PR #344](https://github.com/COCSI-MG/eevee/pull/344).

### Pendências para validar com os autores

**#369:** os 79 testes de assignment/controller/weights passaram e os checks
públicos estão verdes. O dashboard fica mais barato, mas `findAllForAdminMe`
(linhas 513–516) mantém tentativas × membros para admin `/assignment/me`.
Levar a estratégia local de carregamento separado para o helper renomeado e
medir memória/latência com turma de 62 membros. Essa pendência é complementar
ao PR, não uma regressão nova; a mudança local foi preservada.

**#374:** oito testes de TemplateService passaram e os checks públicos estão
verdes. Sem bug novo confirmado no diff. O DTO ainda inclui `template.content`,
usado pelo modal de preview; pedir bytes/pico de memória antes/depois para
comprovar o ganho. Buscar conteúdo sob demanda ao abrir o modal é melhoria
opcional, não bloqueio identificado.

**#347:** os dois jobs de imagens PostgreSQL falharam na etapa **Build**;
Lifecycle smoke tests e publicação foram **pulados**. Não há evidência de smoke
test concluído nesse head. A correção de decorators entra no Jest source, mas
o workflow publica somente as duas imagens PostgreSQL e o runner: não constrói
a imagem comum `worker-node-default-img`, ainda referenciada por tag develop no
chart. Pedir logs do build e confirmar rebuild/publicação/digest da imagem
comum para que o hotfix chegue ao worker node_default; eventual processo manual
de publicação precisa ser validado. A causa dos builds falhos não foi inferida.
[Node PostgreSQL](https://github.com/COCSI-MG/eevee/actions/runs/35392238120/job/105752994879),
[Nest PostgreSQL](https://github.com/COCSI-MG/eevee/actions/runs/35392238120/job/105752994505).

**#344, carga adicional:** a página readonly usa o WorkspaceProvider, que ainda
dispara `useFetchAssignment` do detalhe completo apesar de o endpoint dedicado
já trazer os metadados necessários. Esse hook pode refazer a consulta a cada
cinco segundos se houver tentativas em processamento. Pedir validação das
requisições na página e considerar modo readonly sem carregar todo o histórico.
É uma pendência de performance; o custo não foi quantificado.

**#371:** revisão estática não confirmou bug novo; o check de build está verde.
A configuração de CI não executa `cy:run`, então esse check não comprova os 16
cenários Cypress. Pedir execução contra ambiente isolado após a integração do
#376 e evidência dos fluxos de criação/edição/desativação e acesso de aluno.
Cypress/browser e a aplicação completa não foram iniciados nesta revisão.

### Evidência de validação desta revisão

| Alvo | Resultado |
|---|---|
| Local após remoção de sobreposição | 47 suítes/437 testes da API passaram; build passou; três integrações PostgreSQL passaram |
| #372, AssignmentService | 34 testes existentes passaram; ensaio SQL ativo passou e ensaio de turma desativada reproduziu o bug |
| #369, assignment/controller/weights | 79 testes passaram |
| #374, TemplateService | Oito testes passaram |
| #376, UserService | Sete passaram, três falharam por mock sem select; CI falhou em Tests |
| #377, ClassPerformanceService | 25 testes existentes passaram; ensaio SQL reproduziu nota zero por recusa na coleta; typecheck do front passou |
| #344, attempt/service/controller | 15 testes passaram; estado disabled/pending do QueryObserver confirmado |
| #347, CI pública | Dois builds de imagens falhos; smoke/publish pulados |
| #371, CI pública | Build verde; não executa os cenários Cypress |

O typecheck local do front #344 ficou limitado por `fflate` não instalado no
runtime compartilhado e tipos de matchers em testes de paginação não alterados
pelo PR; não foram atribuídos como regressão. Os checks públicos desse PR estão
verdes. Não houve execução completa de navegador nem build/deploy das imagens
dos workers. O banco descartável foi encerrado após as reproduções. Benchmarks
de p95/heap e verificação do estado de produção permanecem fora desta revisão.

### Âncoras dos comentários no diff — conferidas em 2026-10-13

Os heads dos oito PRs continuam iguais aos revisados. Todas as linhas abaixo
foram conferidas no patch atual, no lado novo/direito (`side=right`). Os quatro
primeiros pontos são bugs confirmados; os demais são pendências/sugestões.

| PR | Arquivo | Linha | Ponto |
|---|---|---|---|
| #372 | `platform-api/src/assignment/assignment.service.ts` | 602 | Relação class nula após soft delete causa TypeError na listagem |
| #376 | `platform-api/src/user/user.service.ts` | 85 | Novo select quebra três testes cujo mock não implementa select |
| #377 | `platform-api/src/class/class-performance.service.ts` | 134 | FAILED de coleta/rede vira zero e substitui resultado acadêmico válido |
| #344 | `front/src/app/assignment/[id]/workspace/users/[userId]/page.tsx` | 122 | Query disabled ainda está pending; URL inválida fica no Loader |
| #347 | `.github/workflows/deploy-assignment-runner.yaml` | 109 | Confirmar publicação da imagem comum node-default além das variantes PostgreSQL |
| #369 | `platform-api/src/assignment/assignment.service.ts` | 516 | Consulta de admin /assignment/me ainda combina tentativas e membros |
| #374 | `platform-api/src/template/template.service.ts` | 99 | Content segue no payload; medir ganho e avaliar preview sob demanda |
| #371 | `front/package.json` | 19 | cy:run não é chamado pela CI de build; confirmar execução dos cenários |

As falhas de Build do #347 devem ser comentadas também no resumo do PR/checks:
não foi localizada uma linha causal com logs completos, então não atribuir
essas falhas arbitrariamente à linha 109. Nenhum comentário foi publicado.

### Reprodução visual do #372 — 2026-10-13

Frontend do head revisado em localhost, mesma página `/admin/assignments`, com
sessão fictícia de administrador. Servidor local de demonstração usa o serviço
AssignmentService do PR e PostgreSQL 16 real em schema exclusivo; autenticação
e rotas auxiliares usam dados fictícios, sem acesso à produção.

Antes: duas atividades aparecem, uma da turma Matemática e outra da turma
Física. Depois de soft delete apenas da turma Matemática, a mesma consulta
paginação rejeita em `assignment.service.ts:602`, com class nula. O servidor
de reprodução devolve HTTP 500 e o frontend do PR mostra seu QueryErrorState:
"Não foi possível carregar os assignments", descrição de falha e botão
"Tentar novamente". Menu e título continuam renderizando; tabela/filtros da
listagem são substituídos pelo estado de erro. Portanto não é uma página branca
nem indisponibilidade de todo o frontend. O efeito se limita às consultas que
incluem atividades cuja relação class ficou nula; a outra atividade ativa na
mesma página também não é exibida.

Prints reais do navegador, sem montagem:
`.eevee-state/pr-review/pr372-before.jpg` e `pr372-after.jpg`.
O helper está na cópia ignorada do PR, em
`platform-api/scripts/repro-screenshot372.ts`. Ajuste de ambiente: o Next foi
executado sem flags de preserve-symlinks para evitar conflito de compilação
CSS; nenhuma lógica da página/consulta do PR foi modificada. Encerrar os dois
servidores locais e o PostgreSQL descartável após capturar os prints.

Referência operacional: [handoff de autenticação EEVEE](../../../../../Pessoal/personal-agent/eevee-daniel-diagnostico-20261014/handoff-autenticacao-eevee.md).
