import { WorkerResponse } from '../worker.interfaces';
import { Logger } from '@nestjs/common';
import { tailLines } from '../../common/log-tail.util';

const TEST_OUTPUT_START_MARKER = "EEVEE_TEST_OUTPUT_START";
const TEST_OUTPUT_END_MARKER = "EEVEE_TEST_OUTPUT_END";

function extractTestOutput(log: string): string {
  const startIndex = log.lastIndexOf(TEST_OUTPUT_START_MARKER);
  if (startIndex === -1) {
    return log;
  }

  const contentStartIndex = startIndex + TEST_OUTPUT_START_MARKER.length;
  const endIndex = log.indexOf(TEST_OUTPUT_END_MARKER, contentStartIndex);
  if (endIndex === -1) {
    return log;
  }

  return log.slice(contentStartIndex, endIndex).trim();
}

export function parseJestLogResult(log: string): WorkerResponse {
  const logger = new Logger('WorkerLogParser');
  logger.debug('Parsing Jest log result...');
  logger.debug(`Raw log (tail): ${tailLines(log)}`);

  const logLines = log.split("\n");

  const testSummaryLine = logLines.find((line) => line.includes("Tests:"));
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

/**
 * Parses the stable summary emitted by the Python worker's trigger.
 *
 * Collection and syntax errors can happen before pytest creates any test
 * cases. In that situation the trigger reports `0 total` together with a
 * non-zero `Failed:` value, which the Jest-compatible parser cannot express.
 */
export function parsePytestLogResult(log: string): WorkerResponse {
  const logLines = log.split("\n");
  const testSummaryLine = [...logLines]
    .reverse()
    .find((line) => line.includes("Tests:"));

  const failedSummaryLine = [...logLines]
    .reverse()
    .find((line) => line.includes("Failed:"));

  const passedCount = Number(
    testSummaryLine?.match(/(\d+)\s+passed/i)?.[1] ?? 0,
  );

  const totalCount = Number(testSummaryLine?.match(/(\d+)\s+total/i)?.[1] ?? 0);

  const explicitFailureCount = Number(
    failedSummaryLine?.match(/Failed:\s*(\d+)/i)?.[1] ?? 0,
  );

  return {
    failures: Math.max(explicitFailureCount, totalCount - passedCount, 0),
    passes: passedCount,
    completeTrace: log,
  };
}

export function parseCypressLogResult(log: string): WorkerResponse {
  // Cypress typically prints a Mocha-style summary with lines like:
  //   Passing:        2
  //   Failing:        0
  // If it doesn't, we fall back to the Jest parser, which will yield 0/0.
  const lines = log.split("\n");

  const passingLine = lines.find((l) => l.includes("Passing:"));
  const failingLine = lines.find((l) => l.includes("Failing:"));

  const parseCount = (line?: string) => {
    if (!line) return undefined;
    const match = line.match(/(\d+)/);
    if (!match) return undefined;
    return parseInt(match[1], 10);
  };

  const passes = parseCount(passingLine);
  const failures = parseCount(failingLine);

  if (typeof passes === "number" && typeof failures === "number") {
    return { passes, failures, completeTrace: log };
  }

  return parseJestLogResult(log);
}

export function parseCypressLogResultFromTestEnvelope(
  log: string,
): WorkerResponse {
  const isolatedTestOutput = extractTestOutput(log);
  const { passes, failures } = parseCypressLogResult(isolatedTestOutput);
  return { passes, failures, completeTrace: log };
}

export interface ParsedWorkerResult extends WorkerResponse {
  total: number;
  isSuccess: boolean;
}

export function parseJestLogResultWithSuiteCheck(
  completeTrace: string,
  exitCode?: number,
): ParsedWorkerResult {
  const lines = completeTrace.split("\n");

  const testSuitesLine = lines.find((line) => line.includes("Test Suites:"));
  const testsLine = lines.find((line) => line.includes("Tests:"));

  const extractCount = (summaryLine: string | undefined, label: string) => {
    if (!summaryLine) return 0;
    const match = summaryLine.match(new RegExp(`(\\d+)\\s+${label}`, "i"));
    return match ? Number(match[1]) : 0;
  };

  const failedSuites = extractCount(testSuitesLine, "failed");
  const failedTests = extractCount(testsLine, "failed");
  const passedTests = extractCount(testsLine, "passed");
  const totalTests = extractCount(testsLine, "total");
  const computedFailures = failedTests > 0 ? failedTests : failedSuites;

  const isSuccess =
    (exitCode === undefined || exitCode === 0) &&
    failedSuites === 0 &&
    failedTests === 0;

  return {
    failures: computedFailures,
    passes: passedTests,
    total: totalTests,
    isSuccess,
    completeTrace,
  };
}
