import fs from "node:fs";
import { spawn } from "node:child_process";

const ROOT_WORKDIR = "/app";
const runtimeWorkdir = fs.existsSync(ROOT_WORKDIR)
  ? ROOT_WORKDIR
  : process.cwd();
const jestResultsPath = `${runtimeWorkdir}/test-results.json`;

function runJestWithJson() {
  return new Promise((resolve) => {
    const child = spawn("npm", ["test"], {
      cwd: runtimeWorkdir,
      env: {
        PATH: process.env.PATH ?? "",
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

function loadJestJsonResult() {
  if (!fs.existsSync(jestResultsPath)) {
    throw new Error(`Jest JSON output not found at ${jestResultsPath}`);
  }

  return JSON.parse(fs.readFileSync(jestResultsPath, "utf-8"));
}

async function main() {
  console.log("Running JavaScript tests...");
  const exitCode = await runJestWithJson();
  const result = loadJestJsonResult();

  console.log(`Tests:       ${result.numPassedTests} passed, ${result.numTotalTests} total`);
  console.log(`Failed:      ${result.numFailedTests}`);
  console.log(`ResultsFile: ${jestResultsPath}`);
  console.log("Tests run!");

  process.exit(exitCode);
}

main().catch((error) => {
  console.error("Error executing JavaScript worker trigger:", error);
  process.exit(1);
});
