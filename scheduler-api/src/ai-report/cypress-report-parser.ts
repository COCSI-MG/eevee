function extractCypressJson(report: string): any | null {
  const statsIdx = report.indexOf('"stats":');
  if (statsIdx === -1) return null;

  const start = report.lastIndexOf('{', statsIdx);
  if (start === -1) return null;

  let end = report.length;
  const errorIdx = report.indexOf('\nError: Command failed', start);
  const markerIdx = report.indexOf('EEVEE_TEST_OUTPUT_START', start);
  if (errorIdx !== -1) end = Math.min(end, errorIdx);
  if (markerIdx !== -1) end = Math.min(end, markerIdx);

  const slice = report.slice(start, end).trim();

  try {
    return JSON.parse(slice);
  } catch {}
  try {
    return JSON.parse(slice + '\n}');
  } catch {}

  return null;
}

export function hasAllCypressTestsPassed(report: string): boolean {
  return /\bFailing:\s*0\b/.test(report) && /\bPassing:\s*[1-9]/.test(report);
}

export function parseCypressRawReport(report: string): string {
  const json = extractCypressJson(report);
  if (!json) return 'Não foi possível processar o resultado do Cypress automaticamente.';

  const parts: string[] = [];

  const failures: any[] = json.failures ?? [];
  if (failures.length > 0) {
    parts.push('\nTestes que falharam:');
    for (const f of failures) {
      parts.push(`\n● ${f.fullTitle || f.title}`);
      if (f.err?.message) parts.push(`  ${f.err.message}`);
    }
  }

  const passes: any[] = json.passes ?? [];
  if (passes.length > 0) {
    parts.push('\nTestes que passaram:');
    for (const p of passes) {
      parts.push(`• ${p.fullTitle || p.title}`);
    }
  }

  if (json.stats) {
    const { passes: p, failures: f, tests: t } = json.stats;
    parts.push(`\nResumo: ${p} passed, ${f} failed, ${t} total`);
  }

  return parts.length > 0
    ? parts.join('\n')
    : 'Não foi possível processar o resultado automaticamente.';
}
