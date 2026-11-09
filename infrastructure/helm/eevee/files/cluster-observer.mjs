import https from 'node:https';
import http from 'node:http';
import { readFile, mkdir, writeFile, rename, readdir, unlink } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export function quantity(raw) {
  const match = String(raw ?? '').match(/^([0-9]+(?:\.[0-9]+)?)(n|u|m|Ki|Mi|Gi|Ti|K|M|G|T|k)?$/);
  if (!match) return null;
  const factors = { n: 1e-9, u: 1e-6, m: 1e-3, Ki: 1024, Mi: 1024 ** 2,
    Gi: 1024 ** 3, Ti: 1024 ** 4, k: 1e3, K: 1e3, M: 1e6, G: 1e9, T: 1e12 };
  return Number(match[1]) * (factors[match[2]] ?? 1);
}
export function isFresh(timestamp, now, maxSeconds = 180) {
  const age = now - Date.parse(timestamp);
  return Number.isFinite(age) && age >= -5000 && age <= maxSeconds * 1000;
}
export function nextNode(observation, previous, successesRequired = 3, now = Date.now(), ttl = 180) {
  // Stale history cannot contribute to a run of consecutive successes.
  const prior = previous && isFresh(previous.observedAt, now, ttl) ? previous : {};
  const success = observation.ready === true && observation.schedulable === true &&
    observation.pressureFree === true && observation.resourcesOk === true && observation.logAccess === true;
  const successes = success ? (prior.successes || 0) + 1 : 0;
  // Withdrawal is immediate; only re-admission waits for repeated successes.
  return { ...observation, observedAt: new Date(now).toISOString(), successes,
    eligible: success && successes >= successesRequired,
    reason: !success ? 'missing or unsuccessful readiness/resource/log evidence'
      : successes < successesRequired ? 'warming up/recovering' : 'stable diagnostic samples' };
}

export function request(url, { ca, token, method = 'GET', body, timeout = 4000, text = false } = {}) {
  return new Promise((resolve, reject) => {
    const transport = new URL(url).protocol === 'https:' ? https : http;
    const req = transport.request(url, { ca, method, headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/merge-patch+json' } : {}),
    } }, res => {
      let value = '', bytes = 0;
      res.on('data', chunk => { bytes += chunk.length; if (bytes > 8 * 1024 * 1024) req.destroy(new Error('response-limit')); else value += chunk; });
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) { reject(new Error(`HTTP-${res.statusCode}`)); return; }
        try { resolve(text ? value : JSON.parse(value)); } catch { reject(new Error('invalid-json')); }
      });
      res.on('error', reject);
    });
    // Absolute deadline, including DNS/connect/TLS, not just socket inactivity.
    const deadline = setTimeout(() => req.destroy(new Error('timeout')), timeout);
    req.on('close', () => clearTimeout(deadline)); req.on('error', reject);
    req.end(body ? JSON.stringify(body) : undefined);
  });
}

export async function collect(settings, get, now = Date.now()) {
  const started = Date.now();
  const observationTime = () => now + (Date.now() - started);
  const errors = [];
  const safe = async (path, endpoint) => {
    try { return await get(path, endpoint); } catch (e) { errors.push({ path: path.split('?')[0], endpoint: endpoint?.name || 'in-cluster', error: e.message }); return null; }
  };
  const ns = encodeURIComponent(settings.namespace);
  const [pods, nodes, podMetrics, nodeMetrics, previous] = await Promise.all([
    safe(`/api/v1/namespaces/${ns}/pods`), safe('/api/v1/nodes'),
    safe(`/apis/metrics.k8s.io/v1beta1/namespaces/${ns}/pods`), safe('/apis/metrics.k8s.io/v1beta1/nodes'),
    safe(`/api/v1/namespaces/${ns}/configmaps/${settings.reportConfigMap}`),
  ]);
  let prior = {};
  try { prior = JSON.parse(previous?.data?.['snapshot.json'] || '{}'); } catch {}
  // Always test the runner's default path, even when individual backends are supplied.
  const endpoints = [{ name: 'in-cluster' }, ...settings.endpoints];
  const observations = [];
  for (const name of settings.candidateNodes) {
    const node = nodes?.items?.find(n => n.metadata.name === name);
    const usage = nodeMetrics?.items?.find(n => n.metadata.name === name);
    const conditions = node?.status?.conditions || [];
    const ready = node ? conditions.find(c => c.type === 'Ready')?.status === 'True' : null;
    const pressureFree = node ? ['MemoryPressure', 'DiskPressure', 'PIDPressure']
      .every(type => conditions.find(c => c.type === type)?.status === 'False') : null;
    const memory = usage && isFresh(usage.timestamp, observationTime()) ? quantity(usage.usage.memory) : null;
    const allocatable = quantity(node?.status?.allocatable?.memory);
    const resourcesOk = memory !== null && allocatable > 0 ? memory / allocatable < settings.maxNodeMemoryFraction : null;
    const canary = pods?.items?.find(p => p.spec.nodeName === name && !p.metadata.deletionTimestamp &&
      p.metadata.labels?.['eevee-observer-canary'] === 'true' && p.status.phase === 'Running' &&
      p.status.conditions?.some(c => c.type === 'Ready' && c.status === 'True'));
    const paths = [];
    for (const endpoint of endpoints) {
      const t = performance.now();
      const log = canary ? await safe(`/api/v1/namespaces/${ns}/pods/${encodeURIComponent(canary.metadata.name)}/log?container=canary&tailLines=1&limitBytes=256`, { ...endpoint, text: true }) : null;
      const stamp = typeof log === 'string' ? log.trim().match(/^EEVEE_CANARY (\d+)$/)?.[1] : null;
      paths.push({ endpoint: endpoint.name, ok: stamp ? isFresh(new Date(Number(stamp) * 1000).toISOString(), observationTime(), 90) : null,
        durationMs: Math.round(performance.now() - t) });
    }
    observations.push(nextNode({ name, labels: node?.metadata.labels || {}, ready,
      schedulable: node ? !node.spec?.unschedulable : null, pressureFree, resourcesOk,
      memoryBytes: memory, allocatableMemoryBytes: allocatable,
      cpuCores: usage && isFresh(usage.timestamp, observationTime()) ? quantity(usage.usage.cpu) : null,
      logAccess: canary ? paths.every(p => p.ok === true) : null, paths },
      isFresh(prior.timestamp, now) ? prior.nodes?.find(n => n.name === name) : null,
      settings.successesRequired, observationTime(), settings.ttlSeconds));
  }
  const processSamples = [];
  for (const pod of (pods?.items || []).filter(p => p.metadata.labels?.app === 'platform-api' && p.status.podIP && !p.metadata.deletionTimestamp)) {
    try {
      const ip = pod.status.podIP.includes(':') ? `[${pod.status.podIP}]` : pod.status.podIP;
      const sample = await get(`http://${ip}:${settings.apiMetricsPort}/metrics`, { process: true });
      if (sample.schemaVersion !== 1 || !isFresh(sample.timestamp, observationTime())) throw new Error('stale-or-incompatible-metrics');
      processSamples.push({ pod: pod.metadata.name, uid: pod.metadata.uid, node: pod.spec.nodeName, sample });
    } catch (e) { errors.push({ component: 'api-process', pod: pod.metadata.name, error: e.message }); }
  }
  const podSamples = (pods?.items || []).map(p => {
    const metric = podMetrics?.items?.find(m => m.metadata.name === p.metadata.name);
    const fresh = metric && isFresh(metric.timestamp, observationTime());
    return { name: p.metadata.name, uid: p.metadata.uid, node: p.spec.nodeName, phase: p.status.phase,
      ready: p.status.conditions?.some(c => c.type === 'Ready' && c.status === 'True') || false,
      metricTimestamp: metric?.timestamp || null, metricWindow: metric?.window || null,
      containers: (p.spec.containers || []).map(c => {
        const m = fresh ? metric.containers.find(m => m.name === c.name) : null;
        const status = p.status.containerStatuses?.find(s => s.name === c.name);
        return { name: c.name, cpuCores: quantity(m?.usage.cpu), memoryBytes: quantity(m?.usage.memory),
          memoryLimitBytes: quantity(c.resources?.limits?.memory), cpuLimitCores: quantity(c.resources?.limits?.cpu),
          restarts: status?.restartCount || 0,
          lastTermination: status?.lastState?.terminated ? { reason: status.lastState.terminated.reason,
            exitCode: status.lastState.terminated.exitCode, finishedAt: status.lastState.terminated.finishedAt } : null };
      }) };
  });
  const finished = observationTime();
  return { schemaVersion: 1, namespace: settings.namespace, timestamp: new Date(finished).toISOString(),
    expiresAt: new Date(finished + settings.ttlSeconds * 1000).toISOString(),
    nodes: observations, pods: podSamples, apiProcesses: processSamples, errors,
    limitations: ['Samples can miss short peaks', 'Log access is not a complete worker execution',
      'Shared backend failures do not establish node faults', 'Metrics Server memory is working set, not V8 heap',
      'No node labels or running Jobs are modified'] };
}

export async function persist(report, dir, maxReports = 1440) {
  await mkdir(dir, { recursive: true });
  const name = `sample-${Date.parse(report.timestamp)}.json`;
  await writeFile(`${dir}/${name}`, JSON.stringify(report));
  await writeFile(`${dir}/latest.tmp`, JSON.stringify(report));
  await rename(`${dir}/latest.tmp`, `${dir}/latest.json`);
  const names = (await readdir(dir)).filter(n => /^sample-\d+\.json$/.test(n)).sort();
  for (const old of names.slice(0, Math.max(0, names.length - maxReports))) await unlink(`${dir}/${old}`);
}

export async function main() {
  const settings = JSON.parse(await readFile('/observer/settings.json', 'utf8'));
  if (!settings.candidateNodes?.length || settings.ttlSeconds < 60 || settings.ttlSeconds > 600 ||
      settings.successesRequired < 1 || settings.successesRequired > 10 ||
      !Number.isInteger(settings.maxReports) || settings.maxReports < 1 || settings.maxReports > 10080 ||
      !(settings.maxNodeMemoryFraction > 0 && settings.maxNodeMemoryFraction <= 1)) throw new Error('Invalid observer policy');
  for (const endpoint of settings.endpoints) {
    const url = new URL(endpoint.url);
    if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('Control-plane endpoints must be HTTPS origins');
  }
  const root = '/var/run/secrets/kubernetes.io/serviceaccount';
  const ca = await readFile(`${root}/ca.crt`), token = (await readFile(`${root}/token`, 'utf8')).trim();
  const host = process.env.KUBERNETES_SERVICE_HOST;
  const base = `https://${host.includes(':') ? `[${host}]` : host}:${process.env.KUBERNETES_SERVICE_PORT}`;
  const get = (path, endpoint) => endpoint?.process
    ? request(path, { token: process.env.EEVEE_METRICS_TOKEN })
    : request(new URL(path, endpoint?.url || base), { ca, token, text: endpoint?.text });
  const report = await collect(settings, get);
  // Only the small scheduling snapshot is in ConfigMap; detailed history stays on the PVC.
  await request(new URL(`/api/v1/namespaces/${encodeURIComponent(settings.namespace)}/configmaps/${settings.reportConfigMap}`, base),
    { ca, token, method: 'PATCH', body: { data: { 'snapshot.json': JSON.stringify({
      schemaVersion: report.schemaVersion, namespace: report.namespace, timestamp: report.timestamp,
      expiresAt: report.expiresAt, nodes: report.nodes }) } } });
  await persist(report, '/reports', settings.maxReports);
  console.log(JSON.stringify({ timestamp: report.timestamp, eligibleNodes: report.nodes.filter(n => n.eligible).map(n => n.name),
    podSamples: report.pods.length, apiProcesses: report.apiProcesses.length, errors: report.errors }));
  if (report.errors.length || report.nodes.some(n => !n.eligible)) process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(e => { console.error(e.message); process.exitCode = 2; });
