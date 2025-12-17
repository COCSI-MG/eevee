import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";

function checkupDependencies() {
  // When compiled, this file runs from `/app/dist`, but the scheduler writes
  // the injected files into `/app`.
  const directoryPath = path.resolve(__dirname, "..");

  const studentPath = path.join(directoryPath, "student.tsx");
  if (!fs.existsSync(studentPath)) {
    throw new Error("student.tsx does not exist.");
  }

  const cypressE2eDir = path.join(directoryPath, "cypress", "e2e");
  if (!fs.existsSync(cypressE2eDir)) {
    throw new Error("cypress/e2e does not exist.");
  }

  const hasAtLeastOneSpec = fs
    .readdirSync(cypressE2eDir)
    .some((file) => file.startsWith("validation") && file.endsWith(".cy.ts"));

  if (!hasAtLeastOneSpec) {
    throw new Error("No validation*.cy.ts file found under cypress/e2e.");
  }
}

function runTests() {
  const result = spawnSync("npm", ["test"], {
    stdio: "inherit",
    env: process.env,
  });

  if (typeof result.status === "number") {
    process.exit(result.status);
  }

  if (result.error) {
    throw result.error;
  }

  process.exit(1);
}

function main() {
  console.log("Checking dependencies...");
  checkupDependencies();
  console.log("Dependencies checked!");

  console.log("Running Next.js build + Cypress...");
  runTests();
}

main();
