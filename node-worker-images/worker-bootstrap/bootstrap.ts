import { readFile, writeFile, mkdir } from "node:fs/promises";
import { WorkerDefinition } from "./types/worker-definition.type";
import { exec, spawn } from "node:child_process";
import { promisify } from "node:util";
import { existsSync, readdirSync } from "node:fs";
import { copyFile } from "node:fs/promises";
import { join } from "node:path";

async function execCommand(
  command: string
): Promise<{ stdout: string; stderr: string }> {
  const execPromise = promisify(exec);
  return execPromise(command);
}

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

async function startServer(command: string) {
  console.log(`Starting server with command: ${command}`);

  const child = spawn(command, {
    shell: true,
    stdio: "inherit",
    detached: false,
  });

  child.on("error", (error) => {
    console.error(`Error starting server: ${error}`);
  });

  console.log("Server process spawned (background)");
}

async function waitForUrl(url: string, timeout: number = 30000) {
  console.log(`Waiting for URL to be available: ${url}`);

  try {
    // it uses wait-on lib to wait until the url is avaliable
    await execCommand(`npx wait-on ${url} --timeout ${timeout}`);
    console.log(`URL is now available: ${url}`);
  } catch (e) {
    console.error(`Timeout waiting for URL: ${url}`);
  }
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
    const { stdout, stderr } = await execCommand(command);
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

  // this is the case when we have to start an application server before running tests, like a React or Next.js app
  if (mergedWorkerDefinition.startCommands.length > 0) {
    const targetUrl = process.env.TARGET_APP_URL || "http://localhost:3000";
    console.log(`Running ${targetUrl} start commands...`);
    for (const command of mergedWorkerDefinition.startCommands) {
      if (command.includes("start") || command.includes("dev")) {
        await startServer(command);
        // waiting for the application to be available at the provided target
        await waitForUrl(targetUrl, 60000);
      } else {
        console.log(`Executing start command: ${command}`);
        const { stdout, stderr } = await execCommand(command);
        console.log("stdout:", stdout);
        if (stderr) {
          console.error(`stderr: ${stderr}`);
        }
      }
    }
    console.log("Start commands completed");
  }

  if (
    mergedWorkerDefinition.dependencies &&
    mergedWorkerDefinition.dependencies.length > 0
  ) {
    const dependencies = mergedWorkerDefinition.dependencies.join(" ");
    const npmCommandToInstallDependencies = `npm install ${dependencies}`;
    const { stdout, stderr } = await execCommand(
      npmCommandToInstallDependencies
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
