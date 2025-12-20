import { WorkerResponse } from '../worker.interfaces';

export function parseJestLogResult(log: string): WorkerResponse {
  const logLines = log.split('\n');

  const testSummaryLine = logLines.find((line) => line.includes('Tests:'));

  let passedCount = 0;
  let totalCount = 0;

  if (testSummaryLine) {
    const passedMatch = testSummaryLine.match(/(\d+)\s+passed/);
    const totalMatch = testSummaryLine.match(/(\d+)\s+total/);

    if (passedMatch) passedCount = parseInt(passedMatch[1], 10);
    if (totalMatch) totalCount = parseInt(totalMatch[1], 10);
  }

  return {
    failures: totalCount - passedCount,
    passes: passedCount,
    completeTrace: log,
  };
}

export function parseCypressLogResult(log: string): WorkerResponse {
  // Cypress typically prints a Mocha-style summary with lines like:
  //   Passing:        2
  //   Failing:        0
  // If it doesn't, we fall back to the Jest parser, which will yield 0/0.
  const lines = log.split('\n');

  const passingLine = lines.find((l) => l.includes('Passing:'));
  const failingLine = lines.find((l) => l.includes('Failing:'));

  const parseCount = (line?: string) => {
    if (!line) return undefined;
    const match = line.match(/(\d+)/);
    if (!match) return undefined;
    return parseInt(match[1], 10);
  };

  const passes = parseCount(passingLine);
  const failures = parseCount(failingLine);

  if (typeof passes === 'number' && typeof failures === 'number') {
    return { passes, failures, completeTrace: log };
  }

  return parseJestLogResult(log);
}
