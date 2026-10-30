const BLOCK_HEADER = /^_{3,} (.+?) _{3,}$/;
const SECTION_HEADER = /^={3,}( .* ={3,})?$/;
const SEPARATOR = /^-{3,} .* -{3,}$/;
const SUMMARY = /Tests:\s+(\d+) passed, (\d+) total/g;
const MAX_LINES_PER_FAILURE = 25;

function lastSummary(report: string): { passed: number; total: number } | null {
  const matches = [...report.matchAll(SUMMARY)];
  const last = matches[matches.length - 1];
  return last ? { passed: Number(last[1]), total: Number(last[2]) } : null;
}

export function hasAllPytestTestsPassed(report: string): boolean {
  const summary = report ? lastSummary(report) : null;
  return !!summary && summary.total > 0 && summary.passed === summary.total;
}

function failureMessage(lines: string[]): string {
  const errorLines = lines
    .filter((line) => line.startsWith('E '))
    .map((line) => line.replace(/^E {1,3}/, '').trimEnd());
  const message = errorLines.length
    ? errorLines
    : lines.map((line) => line.trimEnd());
  return message
    .filter((line) => line.trim())
    .slice(0, MAX_LINES_PER_FAILURE)
    .join('\n');
}

function extractFailures(lines: string[]): { name: string; message: string }[] {
  const failures: { name: string; message: string }[] = [];
  let name: string | null = null;
  let body: string[] = [];

  const close = () => {
    if (name) failures.push({ name, message: failureMessage(body) });
    name = null;
    body = [];
  };

  for (const line of lines) {
    const header = BLOCK_HEADER.exec(line.trim());
    if (header) {
      close();
      name = header[1];
      continue;
    }
    if (SECTION_HEADER.test(line.trim()) || SEPARATOR.test(line.trim())) {
      close();
      continue;
    }
    if (name) body.push(line);
  }
  close();

  return failures;
}

export function parsePytestRawReport(report: string): string {
  const lines = (report ?? '').split('\n');
  const parts: string[] = [];

  const failures = extractFailures(lines);
  if (failures.length > 0) {
    parts.push('\nTestes que falharam:');
    failures.forEach((f) => parts.push(`\n● ${f.name}\n${f.message}`));
  }

  const summary = lastSummary(report ?? '');
  if (summary) {
    parts.push(
      `\nResumo: ${summary.passed} de ${summary.total} testes passaram.`,
    );
  }

  return parts.length
    ? parts.join('\n')
    : 'Não foi possível processar o resultado automaticamente.';
}
