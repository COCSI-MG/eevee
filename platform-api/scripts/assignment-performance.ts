import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { fork, execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { monitorEventLoopDelay, performance } from 'node:perf_hooks';
import { AssignmentService } from '../src/assignment/assignment.service';
import { Assignment } from '../src/assignment/entities/assignment.entity';
import { AssignmentParam } from '../src/assignment/entities/assignment-param.entity';
import { AssignmentTemplate } from '../src/assignment/entities/assignment-template.entity';
import { Template } from '../src/template/entities/template.entity';
import { TemplateParam } from '../src/template/entities/template-param.entity';
import { Attempt } from '../src/attempt/entities/attempt.entity';
import { Class } from '../src/class/entities/class.entity';
import { User } from '../src/user/entities/user.entity';
import { UserClass } from '../src/user-class/entities/user-class.entity';
import { UserRole } from '../src/user/user-role';
import { WorkerType } from '../src/worker/enum/worker-type.enum';

// Never load application .env. The coordinator owns a unique disposable schema.
const target = new URL(process.env.EEVEE_TEST_DATABASE_URL || 'http://missing');
if (!['postgres:', 'postgresql:'].includes(target.protocol) ||
    !['localhost', '127.0.0.1'].includes(target.hostname) ||
    target.pathname !== '/eevee_harness' || target.search || target.hash) {
  throw new Error('Explicit disposable local eevee_harness database required');
}
const profile = process.env.EEVEE_BENCH_PROFILE || 'smoke';
if (!['smoke', 'representative'].includes(profile)) throw new Error('Unknown profile');
const fixture = profile === 'representative'
  ? { assignments: 33, members: 62, attempts: 463, payloadBytes: 8192, templates: 2, params: 2 }
  : { assignments: 4, members: 16, attempts: 40, payloadBytes: 1024, templates: 1, params: 1 };
const integer = (key: string, fallback: number, max = 1000) => {
  const n = Number(process.env[key] || fallback);
  if (!Number.isInteger(n) || n < 1 || n > max) throw new Error(`Invalid ${key}`);
  return n;
};
const cycles = integer('EEVEE_BENCH_CYCLES', 4);
const requests = integer('EEVEE_BENCH_REQUESTS', 10);
const rounds = integer('EEVEE_BENCH_ROUNDS', 3, 20);
const schema = process.env.EEVEE_BENCH_SCHEMA || `perf_${process.pid}_${Date.now()}`;
if (!/^perf_\d+_\d+$/.test(schema)) throw new Error('Invalid schema');
const source = new DataSource({ type: 'postgres', url: target.href, schema,
  extra: { max: 10 }, entities: [__dirname + '/../src/**/*.entity.ts'] });
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const quantile = (xs: number[], p: number) => [...xs].sort((a, b) => a - b)[Math.max(0, Math.ceil(xs.length * p) - 1)] || 0;
const median = (xs: number[]) => {
  const sorted = [...xs].sort((a, b) => a - b), middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};
const gc = async () => { (global as any).gc(); await sleep(30); (global as any).gc(); };
// Preserve every returned field; sort entity collections to ignore join traversal order.
const canonical = (value: any): any => Array.isArray(value)
  ? value.map(canonical).sort((a, b) => typeof a?.id === 'number' && typeof b?.id === 'number' ? a.id - b.id : 0)
  : value && typeof value === 'object' && !(value instanceof Date)
    ? Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])])) : value;

async function seed() {
  await source.query(`CREATE SCHEMA "${schema}"`);
  await source.synchronize();
  const users = await source.getRepository(User).save(Array.from({ length: fixture.members + 1 }, (_, n) => ({
    email: `u${n}@benchmark.invalid`, name: `Synthetic ${n}`, passwordHash: 'not-a-login',
    role: n ? UserRole.STUDENT : UserRole.TEACHER,
  })));
  const cls = await source.getRepository(Class).save({ name: 'Synthetic class', teacherId: users[0].id });
  await source.getRepository(UserClass).save(users.slice(1).map(u => ({ classId: cls.id, userId: u.id })));
  const assignments = await source.getRepository(Assignment).save(Array.from({ length: fixture.assignments }, (_, n) => ({
    title: `Assignment ${n}`, description: 'Synthetic', classId: cls.id, maxAttempts: 1000,
    workerType: WorkerType.NODE_DEFAULT, boilerplateContent: 'module.exports = 1;',
  })));
  const templates = await source.getRepository(Template).save(Array.from({ length: fixture.templates }, (_, n) => ({
    classId: cls.id, title: `Template ${n}`, content: 'test content', workerType: WorkerType.NODE_DEFAULT,
  })));
  for (const template of templates) {
    const params = await source.getRepository(TemplateParam).save(Array.from({ length: fixture.params }, (_, n) => ({
      templateId: template.id, name: `p${n}`,
    })));
    await source.getRepository(AssignmentTemplate).save(assignments.map(a => ({ assignmentId: a.id, templateId: template.id, weight: 1 })));
    await source.getRepository(AssignmentParam).save(assignments.flatMap(a => params.map(p => ({
      assignmentId: a.id, templateParamsId: p.id, value: 'synthetic',
    }))));
  }
  // Match the historical first-two-assignments concentration in the large profile.
  const attemptRows = Array.from({ length: fixture.attempts }, (_, n) => {
    const a = profile === 'representative'
      ? assignments[n < 162 ? Math.floor(n / 81) : 2 + (n - 162) % 31]
      : assignments[n % assignments.length];
    return { assignmentId: a.id, userId: users[1 + n % fixture.members].id, attempt: n + 1,
      isAcceptable: true, score: 1, passes: 1, fails: 0,
      receivedWork: { code: 'x'.repeat(fixture.payloadBytes) }, report: 'r'.repeat(fixture.payloadBytes),
      createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, n)) };
  });
  await source.getRepository(Attempt).save(attemptRows, { chunk: 50 });
}

async function measure(variant: string, operation: string, concurrency: number) {
  await source.initialize();
  const repo = source.getRepository(Assignment);
  const service = new AssignmentService(repo, source.getRepository(AssignmentTemplate),
    source.getRepository(AssignmentParam), source.getRepository(Template), source.getRepository(TemplateParam),
    source.getRepository(Attempt), {} as any, source,
    { getUser: () => ({ userId: 1, role: UserRole.ADMIN }) } as any,
    { decorateAssignments: async (rows: any) => rows, assertCurrentUserNotSuspended: async () => {} } as any,
    { assertAssignmentAccess: async () => {} } as any);
  // Frozen baseline: HEAD 5c4c18e findAll/findOne admin query shapes, same presentation.
  const joinedDetail = () => repo.createQueryBuilder('assignment')
    .leftJoinAndSelect('assignment.class', 'class')
    .leftJoinAndSelect('assignment.assignmentParams', 'assignmentParams')
    .leftJoinAndSelect('assignment.assignmentTemplates', 'assignmentTemplates')
    .leftJoinAndSelect('assignmentTemplates.template', 'template')
    .leftJoinAndSelect('template.templateParams', 'templateParams')
    .leftJoinAndSelect('assignment.examAssignment', 'detailsExamAssignment')
    .leftJoinAndSelect('detailsExamAssignment.exam', 'detailsExam')
    .leftJoinAndSelect('class.userClasses', 'userClasses')
    .leftJoinAndSelect('assignment.assignmentAttempts', 'assignmentAttempts')
    .where('assignment.id = :id', { id: 1 }).orderBy('assignmentAttempts.createdAt', 'DESC');
  const load = async () => variant === 'patch'
    ? operation === 'admin-me' ? service.findAllUserAssignments() : service.findOne(1, operation !== 'execution')
    : (service as any).presentAssignments(operation === 'admin-me'
      ? await repo.find({ relationLoadStrategy: 'join', relations: ['assignmentAttempts', 'class', 'class.userClasses'] })
      : [await joinedDetail().getOne()]).then((rows: any) => operation === 'admin-me' ? rows : rows[0]);
  let queries = 0, rawRows = 0, sqlMs = 0, diagnostic = false, rowJsonBytes = 0;
  let peaks = process.memoryUsage();
  const samples: any[] = [];
  const sample = () => {
    const m = process.memoryUsage();
    for (const k of Object.keys(m)) peaks[k] = Math.max(peaks[k], m[k]);
    return m;
  };
  const createRunner = source.createQueryRunner.bind(source);
  source.createQueryRunner = (...args: any[]) => {
    const runner = createRunner(...args);
    const query = runner.query.bind(runner);
    runner.query = async (...args: any[]) => {
      const start = performance.now();
      const result = await query(...args);
      sqlMs += performance.now() - start;
      queries++;
      const rows = Array.isArray(result) ? result : result?.records || [];
      rawRows += rows.length;
      // Do not allocate a second giant string for the whole SQL result.
      if (diagnostic) for (const row of rows) rowJsonBytes += Buffer.byteLength(JSON.stringify(row));
      sample(); // captures allocation after driver decoding, before synchronous ORM hydration
      return result;
    };
    return runner;
  };
  // Query footprint/correctness phase is excluded from timing and sampled peak phase.
  console.error('benchmark phase: footprint');
  diagnostic = true;
  const inspectPayload = async () => {
    const value = await load();
    const semantic = operation === 'execution' ? { ...value, assignmentAttempts: undefined,
      class: { ...value.class, userClasses: undefined } } : value;
    return {
      hash: createHash('sha256').update(JSON.stringify(canonical(semantic))).digest('hex'),
      footprint: { queries, rawRows, rowJsonBytes, responseBytes: Buffer.byteLength(JSON.stringify(value)) },
    };
  };
  const { hash, footprint } = await inspectPayload();
  diagnostic = false;
  // Warm up the exact call and serialization, then discard all responses.
  console.error('benchmark phase: warmup');
  for (let n = 0; n < 2; n++) JSON.stringify(await load());
  await gc();
  const idleStart = sample();
  peaks = { ...idleStart };
  queries = rawRows = sqlMs = 0;
  const delay = monitorEventLoopDelay({ resolution: 10 }); delay.enable();
  const timer = setInterval(() => { const m = sample(); if (samples.length < 20000) samples.push({ ms: performance.now(), ...m }); }, 10);
  const durations: number[] = [], postGc: any[] = [];
  const retainedResponses: string[] = []; // Optional negative control, synthetic data only.
  const cpuStart = process.cpuUsage();
  const start = performance.now();
  console.error('benchmark phase: measured workload');
  for (let cycle = 0; cycle < cycles; cycle++) {
    let next = 0;
    await Promise.all(Array.from({ length: concurrency }, async () => {
      while (next++ < requests) {
        const t = performance.now();
        const serialized = JSON.stringify(await load());
        if (process.env.EEVEE_BENCH_RETAIN_RESPONSES === 'true') retainedResponses.push(serialized);
        sample(); durations.push(performance.now() - t);
      }
    }));
    await gc(); postGc.push({ cycle, ...sample() });
  }
  const elapsedMs = performance.now() - start;
  clearInterval(timer); delay.disable();
  await source.destroy();
  return { variant, operation, concurrency, fixture, hash, footprint, requests: durations.length,
    p50Ms: quantile(durations, .5), p95Ms: quantile(durations, .95),
    elapsedMs, throughput: durations.length / (elapsedMs / 1000),
    cpu: process.cpuUsage(cpuStart), sqlMs, queries, rawRows, idleStart, peaks, postGc,
    processMaxRssBytes: process.resourceUsage().maxRSS * 1024,
    eventLoopP95Ms: delay.percentile(95) / 1e6, eventLoopMaxMs: delay.max / 1e6,
    samples, durations, node: process.version, platform: process.platform, heapLimitMiB: 768,
    intentionallyRetainedResponses: retainedResponses.length,
    limitations: 'Service + JSON serialization; stubbed policies/alerts; excludes HTTP, Redis and workers. Sampled peaks are lower bounds. Short retention test is not leak proof.' };
}

async function main() {
  if (process.argv[2] === 'child') {
    const result = await measure(process.argv[3], process.argv[4], Number(process.argv[5]));
    process.send?.(result); return;
  }
  const output = resolve(process.env.EEVEE_BENCH_OUTPUT || '../.eevee-state/performance', `run-${Date.now()}`);
  mkdirSync(output, { recursive: true });
  const concurrencies = (process.env.EEVEE_BENCH_CONCURRENCY || '1,5,10').split(',').map(Number);
  const operations = (process.env.EEVEE_BENCH_OPERATIONS || 'admin-me,detail,execution').split(',');
  if (concurrencies.some(n => ![1,5,10].includes(n)) || operations.some(n => !['admin-me','detail','execution'].includes(n))) throw new Error('Invalid workload');
  const results: any[] = [];
  await source.initialize();
  try {
    await seed();
    const databaseVersion = (await source.query('select version()'))[0].version;
    for (const operation of operations) for (const concurrency of concurrencies) for (let round = 0; round < rounds; round++) {
      for (const variant of round % 2 ? ['patch', 'baseline'] : ['baseline', 'patch']) {
        const result: any = await new Promise(resolveResult => {
          const child = fork(__filename, ['child', variant, operation, String(concurrency)], {
            execArgv: ['--expose-gc', '--max-old-space-size=768', '-r', 'ts-node/register/transpile-only', '-r', 'tsconfig-paths/register'],
            env: { ...process.env, EEVEE_BENCH_SCHEMA: schema }, silent: true,
          });
          let report: any, stderr = '';
          const timer = setTimeout(() => child.kill(), 180000);
          child.stdout!.resume();
          child.stderr!.on('data', data => { stderr = (stderr + data).slice(-3000); });
          child.on('message', data => { report = data; });
          child.on('error', error => { clearTimeout(timer); resolveResult({ variant, operation, concurrency, error: error.message }); });
          child.on('exit', (code, signal) => { clearTimeout(timer); resolveResult(report || { variant, operation, concurrency, error: `exit=${code} signal=${signal}`, stderr }); });
        });
        result.round = round; results.push(result);
        writeFileSync(resolve(output, `${operation}-${concurrency}-${round}-${variant}.json`), JSON.stringify(result, null, 2));
        console.log(JSON.stringify({ variant, operation, concurrency, round, p95Ms: result.p95Ms, peakHeapMiB: result.peaks?.heapUsed / 1048576, error: result.error }));
      }
    }
    const comparisons = operations.flatMap(operation => concurrencies.map(concurrency => {
      const a = results.filter(r => r.operation === operation && r.concurrency === concurrency && r.variant === 'baseline');
      const b = results.filter(r => r.operation === operation && r.concurrency === concurrency && r.variant === 'patch');
      const goodA = a.filter(r => !r.error), goodB = b.filter(r => !r.error);
      const hashes = new Set([...goodA, ...goodB].map(r => r.hash));
      const ratio = (field: (r: any) => number) => goodA.length && goodB.length
        ? median(goodB.map(field)) / median(goodA.map(field)) : null;
      return { operation, concurrency, baselineFailures: a.length - goodA.length, patchFailures: b.length - goodB.length,
        equivalent: !goodA.length ? null : hashes.size === 1 && goodB.length === rounds,
        medianP95Ratio: ratio(r => r.p95Ms), medianPeakHeapRatio: ratio(r => r.peaks.heapUsed),
        medianPeakRssRatio: ratio(r => r.peaks.rss), baseline: goodA.map(r => ({ p95Ms: r.p95Ms, footprint: r.footprint })),
        patch: goodB.map(r => ({ p95Ms: r.p95Ms, footprint: r.footprint })) };
    }));
    const summary: any = { timestamp: new Date().toISOString(), profile, fixture, cycles, requests, rounds,
      databaseVersion, node: process.version, comparisons, output,
      intentionallyRetainedResponses: process.env.EEVEE_BENCH_RETAIN_RESPONSES === 'true',
      gate: 'measurement only: no calibrated thresholds configured',
      limitations: 'Baseline is frozen query shapes from 5c4c18e, not full baseline application. No HTTP/E2E or production leak certification.' };
    try { summary.sha = execFileSync('git', ['-c', 'safe.directory=*', 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch {}
    if (process.env.EEVEE_BENCH_LIMITS_FILE) {
      const limits = JSON.parse(readFileSync(process.env.EEVEE_BENCH_LIMITS_FILE, 'utf8'));
      if (!(limits.maxP95Ratio > 0) || !(limits.maxPeakHeapBytes > 0) ||
          !(limits.maxRetainedGrowthBytes >= 0) ||
          ![limits.maxP95Ratio, limits.maxPeakHeapBytes, limits.maxRetainedGrowthBytes].every(Number.isFinite)) throw new Error('All benchmark limits must be explicit');
      const violations = comparisons.filter(c => !c.equivalent || c.patchFailures ||
        c.medianP95Ratio === null || c.medianP95Ratio > limits.maxP95Ratio);
      const memoryFailures = results.filter(r => r.variant === 'patch' && (r.error ||
        r.peaks.heapUsed > limits.maxPeakHeapBytes ||
        r.postGc.at(-1).heapUsed - r.postGc[0].heapUsed > limits.maxRetainedGrowthBytes));
      summary.gate = violations.length || memoryFailures.length ? 'fail' : 'pass';
      summary.limits = limits;
      if (summary.gate === 'fail') process.exitCode = 1;
    }
    if (results.some(r => r.variant === 'patch' && r.error) || comparisons.some(c => c.equivalent === false)) process.exitCode = 1;
    writeFileSync(resolve(output, 'summary.json'), JSON.stringify(summary, null, 2));
    console.log(`Reports: ${output}`);
  } finally {
    await source.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await source.destroy();
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 2; });
