import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { monitorEventLoopDelay, PerformanceObserver } from 'node:perf_hooks';
import { getHeapStatistics } from 'node:v8';

/** Dedicated internal port. No student data, URLs, heap snapshots or forced GC. */
export function startProcessMetrics(port: number, token: string) {
  if (!token || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('Internal metrics require a port and EEVEE_METRICS_TOKEN');
  }
  const loop = monitorEventLoopDelay({ resolution: 20 }); loop.enable();
  const requests = { active: 0, completed: 0, errors: 0, totalDurationMs: 0, maxDurationMs: 0,
    bucketsMs: [10, 50, 100, 250, 500, 1000, 5000], buckets: [0, 0, 0, 0, 0, 0, 0, 0] };
  let afterGc: { timestamp: string; heapUsed: number } | null = null;
  let gcCount = 0, gcDurationMs = 0;
  const gcObserver = new PerformanceObserver(list => {
    for (const entry of list.getEntries()) { gcCount++; gcDurationMs += entry.duration; }
    // Sample at callback delivery, not an atomic measurement at the GC boundary.
    afterGc = { timestamp: new Date().toISOString(), heapUsed: process.memoryUsage().heapUsed };
  });
  gcObserver.observe({ entryTypes: ['gc'] });
  let eventLoop = { p95Ms: 0, maxMs: 0, windowSeconds: 10 };
  const windowTimer = setInterval(() => {
    eventLoop = { p95Ms: loop.percentile(95) / 1e6, maxMs: loop.max / 1e6, windowSeconds: 10 };
    loop.reset();
  }, 10000); windowTimer.unref();
  const snapshot = () => ({ schemaVersion: 1, timestamp: new Date().toISOString(), pid: process.pid,
    uptimeSeconds: process.uptime(), memory: process.memoryUsage(), heapLimitBytes: getHeapStatistics().heap_size_limit,
    cpuMicroseconds: process.cpuUsage(), gc: { count: gcCount, durationMs: gcDurationMs, afterGcSample: afterGc },
    eventLoop, requests });
  const expected = Buffer.from(`Bearer ${token}`);
  const server = createServer((req, res) => {
    const supplied = Buffer.from(req.headers.authorization || '');
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
      res.writeHead(401); res.end(); return;
    }
    if (req.method !== 'GET' || req.url !== '/metrics') { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(snapshot()));
  });
  const middleware = (_req: any, res: any, next: () => void) => {
    const start = performance.now(); requests.active++;
    let finished = false;
    const end = () => {
      if (finished) return; finished = true;
      const ms = performance.now() - start;
      requests.active--; requests.completed++; requests.totalDurationMs += ms;
      requests.maxDurationMs = Math.max(requests.maxDurationMs, ms);
      if (res.statusCode >= 500 || !res.writableFinished) requests.errors++;
      requests.buckets[requests.bucketsMs.findIndex(bound => ms <= bound) < 0
        ? requests.bucketsMs.length : requests.bucketsMs.findIndex(bound => ms <= bound)]++;
    };
    res.once('finish', end); res.once('close', end); next();
  };
  const ready = new Promise<void>((resolve, reject) => {
    server.once('error', reject); server.listen(port, '0.0.0.0', () => { server.removeListener('error', reject); resolve(); });
  });
  const close = () => { clearInterval(windowTimer); loop.disable(); gcObserver.disconnect(); server.close(); };
  return { server, ready, middleware, snapshot, close };
}
