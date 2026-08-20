export function hasAllTestsPassed(report: string): boolean {
  if (!report?.trim()) return false;

  const hasFail = report.includes('FAIL ');
  const hasFailed = /\b[1-9]\d*\s+failed\b/i.test(report);
  const hasErrors = /error TS\d+:/i.test(report);
  const hasFailedTests = report.includes('●');

  const hasPassedSuite = report.includes('PASS ');
  const hasPassedTests = /\b[1-9]\d*\s+passed\b/i.test(report);
  const hasPositiveResult = hasPassedSuite || hasPassedTests;

  return hasPositiveResult && !hasFail && !hasFailed && !hasErrors && !hasFailedTests;
}

export function parseRawReport(report: string): string {
  const lines = report.split('\n');
  const parts: string[] = [];

  const failures = extractFailures(lines);
  if (failures.length > 0) {
    parts.push('\nTestes que falharam:');
    failures.forEach((f) => parts.push(`\n${f}`));
  }

  const passes = extractPasses(lines);
  if (passes.length > 0) {
    parts.push('\nTestes que passaram:');
    passes.forEach((p) => parts.push(`• ${p}`));
  }

  const summary = extractSummary(lines);
  if (summary) parts.push(`\nResumo: ${summary}`);

  return parts.length
    ? parts.join('\n')
    : 'Não foi possível processar o resultado automaticamente.';
}

function extractSummary(lines: string[]): string | null {
  const summary = lines.find(
    (l) => l.includes('Tests:') && (l.includes('failed') || l.includes('total')),
  );
  return summary ? summary.trim() : null;
}

function formatFailure(block: string[]): string {
  return block
    .join('\n')
    .replace(/\s+Expected:/g, '\nExpected:')
    .replace(/\s+Received:/g, '\nReceived:')
    .trim();
}

function extractFailures(lines: string[]): string[] {
  const failures: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('●')) {
      if (current.length) {
        failures.push(formatFailure(current));
        current = [];
      }
      current.push(trimmed);
      continue;
    }

    if (current.length) {
      if (
        trimmed.startsWith('✓') ||
        trimmed.startsWith('●') ||
        line.includes('Test Suites:') ||
        line.includes('Tests:')
      ) {
        failures.push(formatFailure(current));
        current = [];
      } else {
        current.push(line);
      }
    }
  }

  if (current.length) failures.push(formatFailure(current));

  return failures;
}

function extractPasses(lines: string[]): string[] {
  return lines.filter((l) => l.trim().startsWith('✓')).map((l) => l.trim());
}
