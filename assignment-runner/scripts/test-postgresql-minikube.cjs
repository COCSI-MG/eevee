// Run after `npm run build` and loading the three images described in the README.
// All kubectl operations explicitly target Minikube and a fresh test namespace.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { inspect } = require('node:util');

const namespace = `eevee-pg-check-${Date.now()}`;
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'eevee-pg-kube-'));
const output = path.resolve(__dirname, '../test-results/postgresql-minikube.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
const results = [];
const report = (name, details = {}) => {
  const result = { name, ...details, at: new Date().toISOString() };
  results.push(result);
  fs.writeFileSync(output, JSON.stringify({ namespace, results }, null, 2));
  process.stdout.write(JSON.stringify(result) + '\n');
};
function kubectl(...args) {
  return execFileSync('kubectl', ['--context=minikube', '-n', namespace, ...args],
    { encoding: 'utf8', timeout: 30000 });
}
const configPath = path.join(temp, 'config');
fs.writeFileSync(configPath, kubectl('config', 'view', '--minify', '--raw', '--flatten'), { mode: 0o600 });
process.env.KUBECONFIG = configPath;
process.env.K8S_NAMESPACE = namespace;
process.env.K8S_JOB_IMAGE_PULL_POLICY = 'Never';
process.env.WORKER_BOOTSTRAP_IMAGE = 'eevee-worker-bootstrap:latest';
process.env.WORKER_IMAGE_NODE_DEFAULT_POSTGRESQL = 'eevee-postgresql-node:latest';
process.env.WORKER_IMAGE_NODE_NESTJS_POSTGRESQL = 'eevee-postgresql-nest:latest';
delete process.env.KUBERNETES_SERVICE_HOST;
delete process.env.KUBERNETES_SERVICE_PORT;
require('tsconfig-paths').register({ baseUrl: path.resolve(__dirname, '../dist'), paths: { 'src/*': ['*'] } });
const { KubernetesService } = require('../dist/kubernetes/kubernetes.service');
const { NodeDefaultPostgresqlJestStrategy } = require('../dist/worker/strategies/node-default-postgresql-jest.strategy');
const { NodeNestJsPostgresqlJestStrategy } = require('../dist/worker/strategies/node-nestjs-postgresql-jest.strategy');
const service = new KubernetesService();
const strategies = [new NodeDefaultPostgresqlJestStrategy(), new NodeNestJsPostgresqlJestStrategy()];
// Preserve diagnostic service logs without flooding the terminal.
console.log = (...args) => fs.appendFileSync(output + '.log', args.map(x => inspect(x)).join(' ') + '\n');
console.error = console.log;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
async function until(check, timeout = 60000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await check()) return;
    await sleep(1000);
  }
  throw new Error('Condition timed out');
}
function definition(strategy, seeded = true) {
  const query = seeded ? 'SELECT value FROM seed' : 'SELECT 42 AS value';
  const data = {
    files: { 'main.ts': 'export {};' },
    testFilesContent: [`const { Client } = require('pg');
      test('database round trip', async () => {
        const c = new Client({host:'localhost', user:'postgres', password:'postgres', database:'eevee'});
        await c.connect();
        try { expect((await c.query('${query}')).rows[0].value).toBe(42); }
        finally { await c.end(); }
      }); export {};`],
  };
  const encoded = Buffer.from(JSON.stringify(strategy.buildWorkerPayload(data, []))).toString('base64');
  const options = strategy.buildJobOptions(encoded,
    seeded ? 'CREATE TABLE seed(value integer); INSERT INTO seed VALUES(42);' : undefined);
  assert.equal(options.activeDeadlineSeconds, 210);
  assert.equal(options.ttlSecondsAfterFinished, 900);
  // Exercise the TTL controller quickly; assert the production default above.
  options.ttlSecondsAfterFinished = 15;
  return { data, options };
}
function inspectJob(name) {
  const job = JSON.parse(kubectl('get', 'job', name, '-o', 'json'));
  const podSpec = job.spec.template.spec;
  assert.deepEqual(podSpec.initContainers.map(c => c.name), ['eevee-worker-bootstrap']);
  assert.equal(podSpec.containers.length, 1);
  assert.equal(job.spec.activeDeadlineSeconds, 210);
  assert.equal(podSpec.containers[0].resources.limits.memory, '768Mi');
  const pods = JSON.parse(kubectl('get', 'pods', '-l', `job-name=${name}`, '-o', 'json')).items;
  for (const pod of pods) {
    assert.deepEqual(pod.spec.initContainers.map(c => c.name), ['eevee-worker-bootstrap']);
    assert.equal(pod.spec.containers.length, 1);
  }
  return job;
}
async function deleted(name) {
  await until(() => {
    const job = kubectl('get', 'job', name, '--ignore-not-found', '-o', 'name').trim();
    const pods = JSON.parse(kubectl('get', 'pods', '-l', `job-name=${name}`, '-o', 'json')).items;
    const seed = kubectl('get', 'configmap', `${name}-seed`, '--ignore-not-found', '-o', 'name').trim();
    return !job && !pods.length && !seed;
  }, 90000);
}
const httpCommand = ['/usr/local/bin/eevee-postgresql-entrypoint', 'node', '-e',
  'require("http").createServer().listen(3000, () => console.log("HTTP_READY"))'];

async function run() {
  kubectl('create', 'namespace', namespace);
  const { options: deadlineOptions } = definition(strategies[0]);
  await service.createJob('deadline', strategies[0].workerConfig.imageName, httpCommand, deadlineOptions);
  const deadlineStarted = Date.now();
  inspectJob('deadline');
  report('deadline-started', { seconds: 210 });
  const deadlineResult = until(async () => {
    const job = await service.getJob('deadline');
    return job?.body?.status?.conditions?.some(c => c.type === 'Failed' && c.reason === 'DeadlineExceeded');
  }, 250000).then(async () => {
    report('kubernetes-deadline', { elapsedSeconds: Math.round((Date.now() - deadlineStarted) / 1000) });
    await deleted('deadline');
    report('deadline-ttl-cleanup');
  });
  // Observe rejections immediately, while retaining them for the final await.
  deadlineResult.catch(() => {});

  // Start the real application timeout concurrently with other test cases.
  const { options: timeoutOptions } = definition(strategies[0]);
  const timeoutStarted = Date.now();
  const timeoutResult = service.createAndWaitForJobCompletion('timeout', strategies[0].workerConfig.imageName,
    httpCommand, timeoutOptions).then(() => { throw new Error('Expected timeout'); }, async error => {
      assert.match(error.message, /did not finish within 200000ms/);
      await deleted('timeout');
      report('application-timeout-cleanup', { elapsedSeconds: Math.round((Date.now() - timeoutStarted) / 1000) });
    });
  timeoutResult.catch(() => {});

  for (const [index, strategy] of strategies.entries()) {
    for (const seeded of [true, false]) {
      const name = `pass-${index}-${seeded}`;
      const { data, options } = definition(strategy, seeded);
      const result = await service.createAndWaitForJobCompletion(name, strategy.workerConfig.imageName,
        strategy.buildExecutionJobCommand(data), options);
      assert.equal(result.status, 'Succeeded');
      assert.match(result.message, /1 passed/);
      inspectJob(name);
      report(name, { logsCollected: true });
      await deleted(name);
      report(`${name}-ttl-cleanup`, { ttlSeconds: 15 });
    }
  }
  const { data, options } = definition(strategies[0]);
  options.seedSql.content = 'INVALID SQL;';
  const failed = await service.createAndWaitForJobCompletion('bad-sql', strategies[0].workerConfig.imageName,
    strategies[0].buildExecutionJobCommand(data), options);
  assert.equal(failed.status, 'Failed');
  assert.match(failed.message, /syntax error/);
  report('invalid-sql', { logsCollected: true });
  await deleted('bad-sql');

  const { options: cancelOptions } = definition(strategies[0]);
  await service.createJob('cancel', strategies[0].workerConfig.imageName, httpCommand, cancelOptions);
  await until(async () => {
    const pods = await service.getJobPods('cancel');
    if (!pods.length) return false;
    try { return (await service.getJobLogs(pods[0].metadata.name, 'cancel')).includes('HTTP_READY'); }
    catch { return false; }
  });
  await service.deleteJobAndPods('cancel');
  await deleted('cancel');
  report('active-job-cancellation');

  await Promise.all([deadlineResult, timeoutResult]);
  report('PASS');
}
run().catch(error => {
  report('FAIL', { error: error.stack });
  try { process.stderr.write(kubectl('get', 'pods', '-o', 'wide')); } catch {}
  process.exitCode = 1;
}).finally(() => {
  kubectl('delete', 'namespace', namespace, '--wait=false');
  fs.unlinkSync(configPath);
  fs.rmdirSync(temp);
});
