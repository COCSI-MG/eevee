export class NodeReportUnavailableError extends Error {
  constructor(message: string) { super(`Node diagnostics unavailable: ${message}`); }
}

/** Prefer stable nodes; diagnostics must never exclude the last usable option. */
export function eligibleNodeAffinity(raw: string, namespace: string,
  selector: Record<string, string> | null, maxAgeSeconds: number, now = Date.now()) {
  let report: any;
  try { report = JSON.parse(raw); } catch { throw new NodeReportUnavailableError('malformed report'); }
  const age = now - Date.parse(report.timestamp);
  const expiry = Date.parse(report.expiresAt);
  if (report.schemaVersion !== 1 || report.namespace !== namespace ||
      !Number.isFinite(age) || age < -5000 || age > maxAgeSeconds * 1000 ||
      !Number.isFinite(expiry) || expiry <= now || !Array.isArray(report.nodes)) {
    throw new NodeReportUnavailableError('missing, stale or incompatible report');
  }
  const names = report.nodes.filter((node: any) => node.eligible === true && node.ready === true &&
    node.schedulable === true && node.logAccess === true &&
    typeof node.name === 'string' && /^[a-z0-9][a-z0-9.-]{0,252}$/.test(node.name) &&
    Object.entries(selector || {}).every(([key, value]) => node.labels?.[key] === value))
    .map((node: any) => node.name);
  if (!names.length) return undefined;
  return { nodeAffinity: { preferredDuringSchedulingIgnoredDuringExecution: [{
    weight: 100,
    preference: { matchFields: [{ key: 'metadata.name', operator: 'In', values: [...new Set(names)] }] },
  }] } };
}
