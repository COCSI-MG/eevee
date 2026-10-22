# Scripts para automatizar tarefas

## Diagnóstico no cluster e comparação de desempenho

A rotina periódica agora fica no chart Kubernetes, não em cron do GitHub.
`diagnostics.enabled` ativa o observer; `platformApi.metrics.enabled` ativa o
listener interno. `assignmentRunner.nodeEligibility.enabled` faz o builder dos
workers usar o snapshot como **preferência**, nunca como bloqueio. Sem evidência
confiável, o runner usa o scheduler normal; também pode usar outro nó se os
preferidos não tiverem capacidade. Consulte o
[harness atualizado](../.github/specs/eevee-operational-harness.md) e o
[README do chart](../infrastructure/helm/eevee/README.md) para permissões e ativação.

O observer guarda amostras detalhadas no PVC `/reports` (`latest.json` e
`sample-<timestamp>.json`, 1.440 arquivos por padrão). O snapshot pequeno fica em
`eevee-node-report`, com validade padrão de 180 segundos. `metrics.k8s.io` fornece
CPU/working set de containers, não heap V8. O listener da API fornece métricas de
processo/requests; CPU e contadores são acumulados e devem ser comparados por
UID do pod/uptime. As amostras por minuto podem perder picos curtos. Nenhum probe
executa código de estudante, cria worker Job ou força GC em produção.

O benchmark usa PostgreSQL descartável explicitamente configurado, sem `.env`:

```powershell
cd platform-api
$env:EEVEE_TEST_DATABASE_URL = 'postgresql://harness:SENHA-LOCAL@127.0.0.1:55439/eevee_harness'
$env:EEVEE_BENCH_PROFILE = 'representative' # smoke é o padrão
$env:EEVEE_BENCH_CONCURRENCY = '1,5'        # padrão: 1,5,10
$env:EEVEE_BENCH_ROUNDS = '2'
node -r ts-node/register/transpile-only -r tsconfig-paths/register scripts/assignment-performance.ts
```

Não usar banco persistente: o script cria e remove apenas um schema exclusivo
em um banco localhost chamado `eevee_harness`. Usa processos separados por
variante, baseline de consultas de `5c4c18e`, mesma fixture, aquecimento e ordem
A/B–B/A. Mede linhas/consultas, volume JSON equivalente, latência incluindo
serialização, heap/RSS/external/arrayBuffers, CPU e tendência pós-GC. A baseline
não é uma cópia de toda a aplicação. Políticas/alertas são stubs e o ensaio não
inclui servidor HTTP, Redis ou execução de worker. Picos amostrados são limites
inferiores; maxRSS inclui fases de diagnóstico/aquecimento. Throughput inclui
repouso/GC dos ciclos, não representa capacidade sustentada sem essa pausa.

Relatórios: `.eevee-state/performance/run-<timestamp>/summary.json` e um JSON por
variante/cenário/repetição. A CI usa Node 24 como a imagem de produção e guarda
artifacts por 90 dias. Falhas do patch ou diferenças de contrato reprovam.
Sem limites calibrados, latência/memória permanecem em modo de medição.
`EEVEE_BENCH_LIMITS_FILE` recebe um JSON com `maxP95Ratio`, `maxPeakHeapBytes` e
`maxRetainedGrowthBytes`. Na CI, `EEVEE_PERFORMANCE_LIMITS_JSON` é a variável de
repositório equivalente. Calibrar por perfil, versão e runner; não transportar
automaticamente limites de Windows/Node 22 para Linux/Node 24.

`EEVEE_BENCH_RETAIN_RESPONSES=true` é exclusivamente um controle negativo com
dados sintéticos: mantém respostas intencionalmente para validar o gate de
retenção. Não ativar em medições normais. Ensaios curtos não provam ausência de
vazamentos; o resultado local e as limitações estão registrados no harness.

`diagnostics/production-snapshot.py` pode ser enviado para `python3 -` no jump
host para um snapshot **somente leitura**, antes do deploy. Faz inventário
sanitizado, metrics API, `pods/log --tail=0` e leitura de RSS/cgroup. Não retorna
ambientes, credenciais nem conteúdo de logs; não instala recursos. Preserva
falhas de permissão e não inventa heap/GC a partir de RSS.

## Validar estado e rastrear incidentes

Node.js 22, sem dependências extras. Configure URLs explicitamente (a API deve
apontar para a raiz que retorna `All systems online!`):

```powershell
$env:EEVEE_ENVIRONMENT = 'production'
$env:EEVEE_FRONT_URL = 'https://SEU-FRONT'
$env:EEVEE_API_URL = 'https://SUA-API'
node scripts/validate-state.mjs
```

Para verificar também o cluster do contexto kubectl atual, defina
`EEVEE_KUBERNETES=true` e, opcionalmente, `EEVEE_NAMESPACE` (padrão
`eevee-cefetrj`). A rotina consulta deployments, pods e jobs sem alterar o
cluster. Jobs falhos são observações (`ok: null`): reprovação, erro de compilação
ou limite de recursos de um exercício não provam defeito de infraestrutura.
Pods de Jobs não entram na verificação de disponibilidade dos serviços.
Uma observação inconclusiva não abre nem fecha incidentes no GitHub.
Disponibilidade de pods não comprova conectividade com banco/Redis nem uma
submissão completa de exercício.

Cada execução acrescenta um registro em `.eevee-state/history.jsonl` e gera
`latest.json` e `latest.md`. Códigos de saída: 0 saudável, 1 falha operacional,
2 erro de configuração, persistência ou sincronização. Os relatórios não
incluem corpos HTTP, logs de alunos, URLs ou credenciais.

`--sync-github` usa `GITHUB_TOKEN` com permissão de issues e
`GITHUB_REPOSITORY=COCSI-MG/eevee`. Cria uma issue por ambiente/verificação,
fecha na recuperação e reabre na recorrência, com comentários nas transições.
Falhas contínuas não geram comentários repetidos; cada execução fica no
histórico. A sincronização só fecha issues com o marcador desta rotina.

O workflow `validate-state.yaml` é somente manual. Para usá-lo,
publique os arquivos e configure as variáveis do repositório
`EEVEE_FRONT_URL` e `EEVEE_API_URL`. O workflow verifica HTTP; Kubernetes é
opcional na execução com acesso ao cluster. Os artifacts guardam relatórios
por 90 dias; as issues mantêm as transições além desse prazo.

Para aparecerem no GitHub Projects, configure a inclusão automática de issues
desse repositório no board desejado. A rotina não presume um Project específico.

Validação da rotina: `node --test scripts/validate-state.test.mjs`.
Plano incremental, critérios de elegibilidade de nós, orçamento dos probes e
validação da API com PostgreSQL real:
[`harness operacional`](../.github/specs/eevee-operational-harness.md).

Para estimar o volume repetido nas junções de atividades/tentativas/membros,
use `diagnostics/assignment-query-footprint.sql` com
`psql -X -v ON_ERROR_STOP=1 -f scripts/diagnostics/assignment-query-footprint.sql`
na conexão escolhida. A consulta tem transação somente leitura e timeout de
15 segundos, retorna apenas agregados e não exporta código de alunos. Os
tamanhos representam JSON equivalente repetido; não são uma medida do heap.

Esse documento auxilia no entendimento e execução dos script presentes nessa pasta, que tem como objetivo automatizar algumas tarefas.

## Executar migrations no banco de produção pelo Windows

O PostgreSQL de produção roda dentro do cluster Kubernetes (`postgres-service`
no namespace `eevee-cefetrj`) e não é acessível diretamente. O script conecta
via SSH no host configurado em `SSH_TARGET` e na porta `SSH_PORT` e executa `kubectl port-forward` no próprio
servidor, encaminhando o resultado para `127.0.0.1:15432` na máquina local.

Abra o túnel em um terminal PowerShell e mantenha-o aberto:

Configure `SSH_TARGET` e `SSH_PORT` no ambiente local antes de executar.
Ambos s?o obrigat?rios, sem valores de produ??o embutidos. No PowerShell,
`-SshTarget` e `-SshPort` podem sobrescrever essas vari?veis. Mantenha os valores
reais em configura??o privada fora do versionamento.

```powershell
.\scripts\open-production-db-tunnel.ps1
```

No macOS/Linux, use o script bash equivalente (mesmos parâmetros via variáveis
de ambiente: `SSH_TARGET`, `SSH_PORT`, `LOCAL_PORT`, `REMOTE_PORT`, `NAMESPACE`, `SERVICE`):

```bash
./scripts/open-production-db-tunnel.sh
```

Em outro terminal, confira as migrations pendentes sem alterar o banco:

```powershell
npm --prefix platform-api run migration:show
```

Depois de revisar a lista, aplique-as explicitamente:

```powershell
npm --prefix platform-api run migration:run
```

O runner usa o ambiente local de `platform-api/.env`, que deve apontar para
`PG_HOST=127.0.0.1` e `PG_PORT=15432`. O túnel encaminha essa conexão local para
o PostgreSQL do cluster. O arquivo de ambiente não deve ser versionado.

## Carregar imagens docker para o cluster do k3s

Esse script é útil para carregar imagens docker diretamente para o cluster do k3s, evitando a necessidade de fazer push para um registry externo. Serve muito bem para o caso das imagens do worker, que não são publicadas em um registry e tem necessidade de serem carregadas offline para economizar tempo de pull e inicio do job no cluster.

### Uso

Ele espera que o k3s esteja rodando em uma vps, então precisa passar alguns parâmetros para o script, esses abaixo como variáveis de ambiente:

- `VPS_USER`: O usuário para acessar a vps (ex: `root` ou `ubuntu`) - opcional, padrão é `root`
- `VPS_HOST`: O endereço IP ou hostname da vps onde o k3s está rodando - obrigatório
- `VPS_PORT`: A porta SSH para acessar a vps - opcional, padrão é `22`

Um parametro obrigatório é a imagem que deseja carregar para o cluster, que deve ser passada como argumento para o script:

```bash
./load-image.sh <nome-da-imagem:tag>
```

### Processo

O script via `scp` a imagem docker para a vps, e depois executa o comando `k3s ctr images import` para importar a imagem para o cluster do k3s. Após isso, a imagem estará disponível para ser usada nos pods do cluster.
