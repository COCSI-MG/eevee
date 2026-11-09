# EEVEE — handoff para a noite de 29/10/2026

Corte: 29/10/2026 11:10:21 Brasília.

Registro histórico da validação. Os caminhos de protótipos e artefatos de teste
abaixo se referem aos checkouts daquela data. Para o layout atual, consulte a
[File Storage API](../../file-storage-api/README.md), o
[guia local](../../docs/local-development.md#iniciar-a-file-storage-api), o
[guia de implantação](../../docs/file-storage-rollout/SOURCE-STORAGE.md) e o
[guia de backup](../../infrastructure/file-storage/BACKUP.md).

## Escopo e preservação

As quatro sessões originais estavam idle/notLoaded antes das edições. Foi usado
um agente interno por destino distinto; nenhuma nova sessão de trabalho externa,
branch ou worktree foi criada. Os diffs anteriores foram preservados.
Não houve commit, push, merge/rebase, deploy, alteração no cluster, submissão em produção,
uso/limpeza de dados reais, mudança de credenciais/permissões persistentes,
controle do Claude, alteração no wakelock/energia/sessões nem mudança da rotina
`validar-estado-do-eevee`. Containers temporários de teste usaram imagens já locais,
rede externa desativada e dados sintéticos descartáveis. O smoke genuíno criou
preview/submissão apenas nesse banco e Redis descartáveis, sem consumer/worker.
Não são implantação ou submissão em produção.

## 1. Armazenamento — revisão local avançada, limites explícitos

- Workspace: `C:/Users/João Vitor Coimbra/Projects/CEFET/Pesquisa/eevee-storage-prototype-phase1-20261029`.
- HEAD destacado `c10482839ab2e15116977b560f90168d42fe14ef`; mantido assim, sem criar branch.
- Transferência original 24/24 hashes é histórica; o código agora contém novos fixes.
- Dependências frontend/API instaladas dos lockfiles via npm oficial com `--ignore-scripts`.
- Novos `prototypes/file-storage/durability.cjs` e `durability.test.cjs`:
  rejeição Windows antes de qualquer escrita, fsync estrito de arquivo/diretórios
  Linux, entradas de diretórios novos, cleanup apenas de temporário próprio,
  propagação de resultado incerto após rename, reflush em retry idempotente.
- `store.cjs`: backup/restore com cópia atômica verificada e publicação sincronizada;
  snapshot existente validado por hash antes de aceitar idempotência. Regressão
  de corrupção adicionada em `store.test.cjs`.
- Frontend: valida versão/escopo/manifests/hash/tamanho/UTF-8 e colisões antes da adoção;
  mantém BOM; revoga baseline antigo até consentimento explícito; congela bytes do
  envio antes de awaits; ignora respostas de conta/atividade anterior/desmontagem;
  relê IndexedDB após download ou falha para preservar edições salvas durante espera.
- Teste HTTP de conflito atualizado para estabelecer baseline explicitamente aceito
  antes de simular edição concorrente, conforme o novo contrato.

### Testes finais executados

| Verificação                                                              | Resultado real                                               |
| ------------------------------------------------------------------------ | ------------------------------------------------------------ |
| Windows: `node --test prototypes/file-storage/durability.test.cjs`       | 10/10; fault injection, não prova de durabilidade Windows    |
| Linux isolado: store + durability                                        | 18 passaram, 1 assertion exclusiva Windows pulada; 19 totais |
| Linux: integração storage/API + scheduling service/controller            | 3 suítes, 23/23                                              |
| Linux: frontend completo, inclusive HTTP storage e recuperação           | 18 suítes, 80/80; `NODE_ENV=test` explícito                  |
| Frontend mocked regressions no host                                      | 27/27 (incluídas na suíte completa Linux)                    |
| Build API                                                                | passou                                                       |
| Build frontend com preparação de assets locais                           | passou; quatro avisos lint anteriores fora da frente         |
| Typecheck frontend final (`--noEmit --incremental false`)                | passou                                                       |
| Lint dos cinco arquivos frontend da frente, sem fixes                    | passou                                                       |
| Prettier nos arquivos de persistência/docs alterados; `git diff --check` | passou                                                       |

O build frontend ainda avisa dependências de hooks em auth-provider e assignment-form
(e uma diretiva eslint-disable antiga). Não houve supressão ou alteração fora da frente.

Falhas anteriores preservadas como diagnóstico, não contadas como sucesso:

- Baseline Windows: 8/8 testes standalone falharam em directory fsync EPERM após rename.
- Integração API no host: 19 passaram, 4 storage falharam no novo gate Windows; teardown
  também reportou servidor inexistente. O runtime nativo é explicitamente incompatível.
- Primeira preparação Linux API não resolvia junction Windows de execution-contracts;
  pacote foi montado explicitamente read-only e o rerun passou 23/23.
- Primeiro HTTP frontend tinha expectativa antiga de baseline; corrigido consentimento
  no teste, sem enfraquecer comportamento. Suíte final passou.
- Primeira suíte frontend Linux herdou NODE_ENV=production da imagem e falhou em React.act
  (9 suítes/26 testes); rerun com NODE_ENV=test passou 18 suítes/77 testes.

### Limites / próximo passo exato

**Native Windows storage ainda não é suportado.** Ignorar EPERM ou remover flush
romperia o contrato. O gate agora falha cedo e sem publicação parcial. Não foi criado
adaptador nativo Windows nem afirmada equivalência de MoveFileExW com parent fsync.
Use runtime Linux com filesystem Linux, sem dados reais, para próxima validação.
Testes tmpfs não simulam queda de energia/controladora.

**CAS transacional implementado na continuação:** getFileTreeSnapshot e
compareAndReplaceFileTree leem/comparam/gravam na mesma transação IndexedDB nativa;
revision+generation+árvore impedem confirmação obsoleta e exclusão/recriação ABA.
Save/update/delete aguardam commit. UI e baseline remota só avançam após sucesso;
conflito exibe a edição local mais recente. Não é merge/editor colaborativo.

Browser local: **13 checks passaram** em Chrome155.0.8059.86, perfil temporário,
IndexedDB real e duas abas, com hook/transporte/Filestash reais. Verificou CAS,
ABA, delete/recreate, edições paralelas, aceitar/recusar, corrupção, unmount/troca
conta atrasada, conflito remoto, abort após put e falha de rede preservando edição.
A tentativa de editar outra aba durante confirm nativo ficou pausada pelo modal do
Chrome; o caso foi reproduzido com segunda conexão IDB enfileirada na fronteira da
confirmação, mantendo os testes separados de diálogos reais. Resultado agregado em
`prototypes/file-storage/browser-e2e-results.json`; script `browser-e2e.cjs`.

O browser harness usa adaptador de grant sintético; não modifica autenticação nem
adiciona rota ao produto. Não valida a aplicação Next completa com login/Monaco,
trabalho corrigido por worker ou UX de merge colaborativo. A base do protótipo
continua antiga e exige revisão contra develop antes de incorporar a feature.

Detalhes: `prototypes/file-storage/README.md` (seção Local review on 2026-10-29).

## 2. Tooling — pronto para revisão local, sem integração

- Workspace: `C:/Users/João Vitor Coimbra/Projects/CEFET/Pesquisa/eevee-tooling`.
- Branch `chore/tooling-standardization`; diffs amplos anteriores preservados.
- Corrigido middleware ignorado pelo Next: `front/middleware.ts` movido para
  `front/src/middleware.ts`. URL auth preserva `/api/v1` e base relativa.
- Seis testes de autorização/ausência de sessão/configuração/prefixos.
- Final: 508 testes aplicação (429 API, 58 front, 21 runner), 8 tooling;
  typechecks três apps, build frontend registrando middleware, format 870 arquivos,
  lint 670 arquivos, whitespace check. Smoke localhost admin sem sessão -> 307/login;
  login e asset -> 200. Processo temporário próprio encerrado.
- Não repetidos: E2E autenticado, builds API/runner e runtimes Python/PostgreSQL.
- Node host v22.12.0 abaixo do recomendado 22.13+; nenhuma instalação de runtime alterada.
- Próximo: revisar diff amplo, política de admin/auth e integração deliberada, preservando
  as regras de autorização; não publicar apenas por ter build verde.
- Handoff: `.github/specs/tooling-handoff-20261029.md` nesse workspace.

## 3. Realtime — pronto para revisão local, sem integração

- Workspace: `C:/Users/João Vitor Coimbra/.codex/worktrees/worker-completion-realtime/eevee`.
- Branch `fix/worker-completion-realtime`.
- Revisão acrescentou invalidação de class-assignments-progress, class-performance,
  examStudents no provider persistente. Manteve salas/autorização do proprietário.
- Novas regressões: navegação/reconexão repetidas, 3 ciclos login/logout sem listeners
  retidos, watch encerrado/reaberto, perda 403 e execução após timeout com cleanup.
- Final: 48 runner (10 suítes), build runner; 57 frontend (16 suítes), typecheck,
  lint/format focados e whitespace. Os subconjuntos15 observer e14 realtime estão
  incluídos nos totais, não somar como testes independentes.
- Sem browser E2E, cluster real, teste em produção ou medição pós-patch. Causa precisa
  da latência do nó continua não resolvida; acesso negado a logs kubelet não foi repetido.
- Próximo: revisão do diff, browser com backend sintético; posteriormente rollout
  autorizado com RBAC/watch verificado e medição de ponta a ponta.
- Handoff: `REALTIME-HANDOFF-20261029.md` nesse workspace.

## 4. Cluster — plano offline e fixes prontos para revisão, sem ativação

- Workspace: `C:/Users/João Vitor Coimbra/.codex/worktrees/cluster-diagnostics-rollout/eevee`.
- Branch `fix/cluster-diagnostics-rollout`, base `709b217` de origin/develop em cache.
- Corrigidos timestamp canário fora do intervalo (não aborta relatório) e contador
  malformado/fracionário de recuperação (reinicia confiança em uma amostra válida).
  Ambas as regressões foram reproduzidas antes de corrigir.
- Final: 13 testes operacionais, 37 runner (8 suítes),1 API metrics/auth;
  TypeScript, Helm default+enabled sintético, ConfigMap divergente rejeitado,
  bash syntax, deploy com mocks e whitespace. Flags continuam desligadas.
- Sem consulta/ativação real do observer ou piloto. O estado observado de whx-ba na
  checagem diária anterior não foi corrigido por este trabalho.
- Próximo: revisar pré-requisitos reais RBAC, Secret, CNI/PVC e conectividade apenas
  com autorização, depois piloto somente observação >=24h e aceite antes da preferência.
- Handoff: `.github/specs/cluster-rollout-handoff-20261029.md` nesse workspace.

## Integração conjunta — ainda NÃO validada

Não misturei branches. Cluster e realtime alteram a harness e
`assignment-runner/src/kubernetes/kubernetes.service.spec.ts`; preservar ambas as
coberturas ao conciliar. Tooling formata centenas de arquivos e exige revisão de
conflitos sem substituir cegamente conteúdo funcional. Protótipo storage usa uma
base anterior e também altera scheduling/workspace; revisar contratos contra develop
atual antes de incorporá-lo. Os testes acima validam cada frente isolada, não a soma.

Para a noite: abrir os quatro handoffs, decidir integração/base/runtime e políticas
pendentes; revisar diffs; só depois testar a composição em ambiente sintético.
Nenhuma aprovação de deploy/push/merge de PR está implícita neste handoff.

## Continuação — ambiente e compatibilidade concreta

Linux isolado: Docker Desktop/WSL2 já existente neste PC, kernel
5.15.146.1-microsoft-standard-WSL2 x64; Nodev24.21.0 na imagem API em cache
sha256:1b684933e2f4c41bb8ca9057a3e3423584af146eecfbcead8e87deaddeb0da2e.
Sem rede, sem portas, código read-only e dados/cache /tmp tmpfs. Imagem frontend
cache sha256:9058e936aaf41f404f08965b37a3c77a89abdc73ff49490c657a41dd20a84404.
Chrome foi o executável local já instalado, em contextos novos; sessões existentes
não foram usadas. Para browser, protocolo real storage passou por proxy loopback
para stdio do container. Teste de tmpfs não prova persistência contra queda de energia.

Windows nativo: esta implementação Node exige fsync do diretório pai após rename;
libuv/FlushFileBuffers nesse handle retorna EPERM. O gate evita a gravação parcial.
Não foi demonstrada equivalência de MoveFileExW/WRITE_THROUGH com o contrato completo,
nem implementado adaptador nativo; não significa que todo armazenamento Windows seja
impossível. Fontes primárias e detalhes estão no README do storage.

### Compatibilidade realtime/cluster revisada, sem misturar diffs

- Bases709b217 e81a661f têm ancestral d4f1a04; delta entre bases é frontend/docs,
  sem delta nos três arquivos Kubernetes analisados.
- Sobreposição exata: harness e kubernetes.service.spec.ts. Hunk clusterfixture37–41
  adiciona pressureFree/resourcesOk/observedAt; realtime adiciona teste perto272.
- Hunks disjuntos, mas copiar o arquivo realtime inteiro perde esses campos; leitor
  cluster estrito rejeita o fixture e affinity fica undefined. Preservar ambos.
- Não unificar catches: relatório ConfigMap403/timeout -> scheduling normal;
  watch indisponível -> Job polling; Job-read401/403 -> erro de autorização.
- Diagnóstico1.5/2s antes de criarJob; observação realtime5s/deadline200s são budgets
  diferentes. Flags cluster desligadas não revertem código realtime da imagem.
- Integração conjunta ainda depende de escolher/aplicar a base alvo, sem sobrescrever
  os diffs existentes. Ordem sugerida develop acordado -> cluster -> realtime ->
  tooling por último, mantendo lockfile do alvo (#384).
- Teste conjunto exato: relatório válido + maincontainer termina; depois relatório
  ausente/403/timeout/sem elegíveis, watch indisponível, Job403, cancelamento/retry/
  timeout, assert de resultado único e streams/timers limpos. Então suites/build/
  typecheck/Helm da árvore integrada. Nenhuma árvore integrada foi criada.
- Nota detalhada no handoff cluster, seção Focused realtime/cluster compatibility audit.

## Complemento final — smoke genuíno com autenticação (29/10, 11h07 Brasília)

Reprodução local: `prototypes/local-runtime/run-docker-smoke.ps1` (wrapper Windows)
e `run-docker-smoke.sh` (container). Evidência completa:
`prototypes/local-runtime/smoke-results-docker-20261029.md`.
O script de auth agora exige `EEVEE_SYNTHETIC_LOCAL_RUNTIME=1`.

Passou com API local compilada real, bcrypt Linux, PostgreSQL17, Redis e storage:

- grant sem autenticação401; login/cookies e grant sintético200;
- upload por hash, workspace/snapshot round-trip; conflito409 e outra scope403;
- snapshot de propósito errado400, inclusive com preview já pendente;
- preview e submissão locais201; exatamente dois comandos Redis waiting sem consumer;
- os dois comandos mantiveram a fonte original inline, limitação phase1;
- PostgreSQL receivedWork manteve snapshot original depois de editar workspace;
- payloads de fixture medidos: tentativa1099 bytes e preview1120 bytes;
- rerun do estado final com guard também passou; cleanup conferiu zero recursos
  próprios eevee-storage-auth-smoke-\* restantes.

Isolamento diferente do Jest/browser: rede Docker `--internal` (sem saída), nenhuma
porta publicada, namespace loopback compartilhado entre processos de teste, dados
tmpfs, env-i e fixtures literais. `.env` inesperado da imagem é rejeitado; nenhuma
credencial ou configuração real foi montada. Os dist/contratos/protótipos atuais
entraram read-only. Imagens cache --pull=never; nenhum runner/K8s/mail/AI/rede externa.

Limites concretos: dependências runtime/bcrypt Linux vêm da imagem API cached, não
uma nova imagem reproduzida integralmente do lockfile. Schema criado por synchronize
somente sintético: a cadeia de migrations continua não validada e tem lacuna histórica
em attempt.createdAt. Browser13 valida o hook/IndexedDB/transporte com adapter de grant
sintético; este smoke separado valida login/API/PG/Redis reais. Não afirmar que ambos
formam uma única jornada da aplicação Next completa ou correção real por worker.
Uma jornada com worker exigiria um consumer/ambiente Kubernetes isolado e criação de
Jobs; não foi iniciada dentro da restrição de não alterar cluster.

Tentativas de preparação: CRLF no novo shell script e ausência de tsconfig-paths
na imagem de produção falharam antes da inicialização; LF e mounts read-only de
módulos JS existentes corrigiram a preparação. Não se tratou de falha de dados reais.

Próximo passo para a noite: revisar a feature com as evidências acima e escolher a
base de integração. CAS/recuperação não estão mais apenas planejados. Restam decisões
reais: armazenamento Linux persistente ou adaptador Windows verificado; política de
merge colaborativo (não implementada); correção/validação das migrations antes de
qualquer banco novo real; composição dos diffs e validação na árvore integrada.
Nenhuma autorização de produção ou de novos recursos de cluster foi presumida.
