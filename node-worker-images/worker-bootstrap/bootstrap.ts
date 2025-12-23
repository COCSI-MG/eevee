import { readFile, writeFile, mkdir } from "node:fs/promises";
import { WorkerDefinition } from "./types/worker-definition.type";
import { promisify } from "node:util";
import { existsSync, readdirSync } from "node:fs";
import { copyFile } from "node:fs/promises";
import { join } from "node:path";
import { exec as cpExec} from "node:child_process";

const exec = promisify(cpExec);

async function getDefaultWorkerDefinition(): Promise<WorkerDefinition> {
  const defaultWorkerDefinitionInput = await readFile(
    "/app/worker-definition.json",
    { encoding: "utf-8" }
  );
  if (!defaultWorkerDefinitionInput) {
    throw new Error("Default worker definition file not found");
  }
  return JSON.parse(defaultWorkerDefinitionInput);
}

async function runTestCommands(testCommands: string[]) {
  // in this moment we will only run the first test
  if (testCommands.length === 0) {
    console.log("No test commands to run");
    return;
  }

  const command = testCommands[0];
  console.log(`Running test command: ${command}`);

  try {
    const { stdout, stderr } = await exec(command, {
      env: process.env,
      shell: "/bin/bash",
      maxBuffer: 10 * 1024 * 1024, // 10 MB
    }); 
    console.log("stdout:", stdout);
    if (stderr) {
      console.error(`stderr: ${stderr}`);
    }
    console.log("Test command completed");
  } catch (error) {
    console.error("Error running test command:", error);
  }
}

async function handleFileNodeFromDefinition(
  node: WorkerDefinition["files"],
  currentPath: string
) {
  if (node.type === "file") {
    if (node.content) {
      const fileName = join(currentPath, node.id); // assuming id is the file name
      await writeFile(fileName, node.content, { encoding: "utf-8" });
      console.log(`Created file: ${fileName}`);
    } else {
      console.warn(`File node has no content: ${JSON.stringify(node)}`);
    }
  } else if (node.type === "folder" && node.children) {
    const isSourceFolder = node.id === "src";

    const currentFolderPath = isSourceFolder
      ? currentPath
      : join(currentPath, node.id);
    if (!existsSync(currentFolderPath)) {
      await mkdir(currentFolderPath, { recursive: true });
    }

    for (const child of node.children) {
      await handleFileNodeFromDefinition(child, currentFolderPath);
    }
  }
}

async function main() {
  console.log("Starting worker from definition...");

  const workerDefinitionInput = await readFile(
    "/app/inputs/worker-definition.json",
    { encoding: "utf-8" }
  );
  if (!workerDefinitionInput) {
    throw new Error("Worker definition file not found");
  }

  // carregando configurações padrão do worker e mesclando com a definição fornecida
  const defaultWorkerDefinition = await getDefaultWorkerDefinition();
  const workerDefinition: WorkerDefinition = JSON.parse(workerDefinitionInput);
  const mergedWorkerDefinition = Object.assign(
    workerDefinition,
    defaultWorkerDefinition
  );

  console.log(
    "Worker Definition:",
    JSON.stringify(mergedWorkerDefinition, null, 2)
  );

  await handleFileNodeFromDefinition(
    mergedWorkerDefinition.files,
    mergedWorkerDefinition.srcPath
  );

  const testsInput = readdirSync("/app/inputs/tests", {
    encoding: "utf-8",
  });
  if (testsInput.length === 0) {
    console.log("No test files found in /app/inputs/tests");
  } else {
    if (mergedWorkerDefinition.testPath === undefined) {
      throw new Error("testPath is not defined in worker definition");
    }

    if (!existsSync(mergedWorkerDefinition.testPath)) {
      await mkdir(mergedWorkerDefinition.testPath, { recursive: true });
    }

    for (const testFile of testsInput) {
      if (testFile.startsWith(".")) {
        continue; // skip hidden files, genereted by config map mounts, the correct way is using init containers
      }

      await copyFile(
        `/app/inputs/tests/${testFile}`,
        join(mergedWorkerDefinition.testPath, testFile)
      );
    }
  }

  if (
    mergedWorkerDefinition.dependencies &&
    mergedWorkerDefinition.dependencies.length > 0
  ) {
    const dependencies = mergedWorkerDefinition.dependencies.join(" ");
    const npmCommandToInstallDependencies = `npm install ${dependencies}`;
    const { stdout, stderr } = await exec(
      npmCommandToInstallDependencies,
      {
        shell: "/bin/bash",
        cwd: "/app",
      }
    );
    console.log(`stdout: ${stdout}`);
    if (stderr) {
      console.error("Error installing dependencies", stderr);
    }
  }

  await runTestCommands(mergedWorkerDefinition.testCommands);
}

main()
  .then(() => {
    console.log("Worker execution completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error in worker execution:", error);
    process.exit(1);
  });
