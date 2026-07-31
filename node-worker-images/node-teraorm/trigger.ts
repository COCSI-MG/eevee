import fs from "fs";
import { spawn } from "child_process";

type JestJsonResult = {
  numPassedTests: number;
  numFailedTests: number;
  numTotalTests: number;
};

const ROOT_WORKDIR = "/app";

function resolveRuntimeWorkdir() {
  if (fs.existsSync(ROOT_WORKDIR)) {
    return ROOT_WORKDIR;
  }

  throw new Error("Unable to determine runtime workdir.");
}

const RUNTIME_WORKDIR = resolveRuntimeWorkdir();
const JEST_RESULTS_PATH = `${RUNTIME_WORKDIR}/test-results.json`;

function runJestWithJson(): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn("npm", ["test"], {
      cwd: RUNTIME_WORKDIR,
      env: {
        ...process.env,
        NODE_ENV: "test",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    child.stdout.on("data", (chunk) => {
      process.stdout.write(chunk.toString());
    });

    child.stderr.on("data", (chunk) => {
      process.stderr.write(chunk.toString());
    });

    child.on("close", (code) => {
      resolve(code ?? 1);
    });
  });
}

function loadJestJsonResult(): JestJsonResult {
  if (!fs.existsSync(JEST_RESULTS_PATH)) {
    throw new Error(`Jest JSON output not found at ${JEST_RESULTS_PATH}`);
  }

  const resultContent = fs.readFileSync(JEST_RESULTS_PATH, "utf-8");
  const result = JSON.parse(resultContent) as JestJsonResult;

  return result;
}

async function main() {
  console.log("Running tests...");
  const exitCode = await runJestWithJson();

  const jestJsonResult = loadJestJsonResult();
  console.log(
    `Tests:       ${jestJsonResult.numPassedTests} passed, ${jestJsonResult.numTotalTests} total`,
  );
  console.log(`Failed:      ${jestJsonResult.numFailedTests}`);
  console.log(`ResultsFile: ${JEST_RESULTS_PATH}`);
  console.log("Tests run!");

  process.exit(exitCode);
}

main().catch((error) => {
  console.error("Error executing trigger:", error);
  process.exit(1);
});
