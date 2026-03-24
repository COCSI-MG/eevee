/// <reference types="node" />

import fs from "node:fs";
import { spawn } from "node:child_process";

type CypressJsonResult = {
  stats?: {
    tests?: number;
    passes?: number;
    failures?: number;
  };
};

const ROOT_WORKDIR = "/app";
const WORKSPACE_WORKDIR = "/app/workspace";
const APP_SRC_PATH = `${ROOT_WORKDIR}/src`;
const APP_CYPRESS_E2E_PATH = `${ROOT_WORKDIR}/cypress/e2e`;
const WORKSPACE_SRC_PATH = `${WORKSPACE_WORKDIR}/src`;
const WORKSPACE_CYPRESS_E2E_PATH = `${WORKSPACE_WORKDIR}/cypress/e2e`;
const TEST_OUTPUT_START_MARKER = "EEVEE_TEST_OUTPUT_START";
const TEST_OUTPUT_END_MARKER = "EEVEE_TEST_OUTPUT_END";
const CYPRESS_RESULTS_PATH = "cypress-results.json";

function resolveRuntimeWorkdir() {
  if (fs.existsSync(WORKSPACE_WORKDIR)) {
    return WORKSPACE_WORKDIR;
  }

  if (fs.existsSync(ROOT_WORKDIR)) {
    return ROOT_WORKDIR;
  }

  throw new Error("Unable to determine runtime workdir.");
}

const RUNTIME_WORKDIR = resolveRuntimeWorkdir();
const RUNTIME_RESULTS_PATH = `${RUNTIME_WORKDIR}/${CYPRESS_RESULTS_PATH}`;

function ensureCleanDirectory(path: string) {
  fs.rmSync(path, { recursive: true, force: true });
  fs.mkdirSync(path, { recursive: true });
}

function syncWorkspaceFiles() {
  if (!fs.existsSync(WORKSPACE_WORKDIR)) {
    return;
  }

  if (fs.existsSync(WORKSPACE_SRC_PATH)) {
    ensureCleanDirectory(APP_SRC_PATH);
    fs.cpSync(WORKSPACE_SRC_PATH, APP_SRC_PATH, { recursive: true });
    console.log(`Synchronized source files from ${WORKSPACE_SRC_PATH}`);
  }

  if (fs.existsSync(WORKSPACE_CYPRESS_E2E_PATH)) {
    ensureCleanDirectory(APP_CYPRESS_E2E_PATH);
    fs.cpSync(WORKSPACE_CYPRESS_E2E_PATH, APP_CYPRESS_E2E_PATH, {
      recursive: true,
    });
    console.log(`Synchronized test files from ${WORKSPACE_CYPRESS_E2E_PATH}`);
  }
}

function runNpmTest(): Promise<{ exitCode: number; completeTrace: string }> {
  return new Promise((resolve) => {
    const outputChunks: string[] = [];

    const child = spawn("npm", ["test"], {
      cwd: RUNTIME_WORKDIR,
      stdio: ["ignore", "pipe", "pipe"],
    });

    child.stdout.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      outputChunks.push(text);
      process.stdout.write(text);
    });

    child.stderr.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      outputChunks.push(text);
      process.stderr.write(text);
    });

    child.on("close", (code: number | null) => {
      resolve({
        exitCode: code ?? 1,
        completeTrace: outputChunks.join(""),
      });
    });
  });
}

function parseCypressJsonResult(): CypressJsonResult | undefined {
  if (!fs.existsSync(RUNTIME_RESULTS_PATH)) {
    return undefined;
  }

  const rawResults = fs.readFileSync(RUNTIME_RESULTS_PATH, "utf-8");
  return JSON.parse(rawResults) as CypressJsonResult;
}

function parseCountFromLog(
  completeTrace: string,
  pattern: RegExp,
): number | undefined {
  const match = completeTrace.match(pattern);
  if (!match) {
    return undefined;
  }

  return Number(match[1]);
}

function parseCypressStatsFromTrace(
  completeTrace: string,
): { passes?: number; failures?: number; tests?: number } | undefined {
  const statsMatch = completeTrace.match(
    /"stats"\s*:\s*\{[\s\S]*?"tests"\s*:\s*(\d+)[\s\S]*?"passes"\s*:\s*(\d+)[\s\S]*?"failures"\s*:\s*(\d+)/i,
  );

  if (!statsMatch) {
    return undefined;
  }

  const [, tests, passes, failures] = statsMatch;
  return {
    tests: Number(tests),
    passes: Number(passes),
    failures: Number(failures),
  };
}

function buildSummary(
  completeTrace: string,
  jsonResult: CypressJsonResult | undefined,
  exitCode: number,
) {
  const traceStats = parseCypressStatsFromTrace(completeTrace);
  const jsonPasses = jsonResult?.stats?.passes;
  const jsonFailures = jsonResult?.stats?.failures;
  const jsonTotal = jsonResult?.stats?.tests;

  const logPasses = parseCountFromLog(completeTrace, /(\d+)\s+passing/i);
  const logFailures = parseCountFromLog(completeTrace, /(\d+)\s+failing/i);

  const passes = jsonPasses ?? traceStats?.passes ?? logPasses ?? 0;
  const failures =
    jsonFailures ??
    traceStats?.failures ??
    logFailures ??
    (exitCode === 0 ? 0 : 1);
  const total = jsonTotal ?? traceStats?.tests ?? passes + failures;

  return { passes, failures, total };
}

function emitTestEnvelope(passes: number, failures: number, total: number) {
  console.log(TEST_OUTPUT_START_MARKER);
  console.log(`Passing: ${passes}`);
  console.log(`Failing: ${failures}`);
  console.log(`Tests: ${passes} passed, ${total} total`);
  console.log(TEST_OUTPUT_END_MARKER);
}

async function main() {
  syncWorkspaceFiles();

  console.log("Running tests...");

  const { exitCode, completeTrace } = await runNpmTest();
  const jsonResult = parseCypressJsonResult();
  const { passes, failures, total } = buildSummary(
    completeTrace,
    jsonResult,
    exitCode,
  );

  emitTestEnvelope(passes, failures, total);

  if (jsonResult) {
    console.log(`ResultsFile: ${RUNTIME_RESULTS_PATH}`);
  }

  console.log("Tests run!");
  process.exit(exitCode);
}

main().catch((error) => {
  console.error("Error executing trigger:", error);
  process.exit(1);
});