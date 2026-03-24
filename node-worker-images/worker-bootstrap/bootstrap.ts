import { loadWorkerDefinition } from "./worker-definition.js";
import { createFilesAndDirectoriesFromJson } from "./file-handler.js";

async function main() {
  console.log("Starting worker from definition...");
  const definition = await loadWorkerDefinition();

  await createFilesAndDirectoriesFromJson(
    definition.files,
    definition.srcPath
  );

  await createFilesAndDirectoriesFromJson(
    definition.testFiles, 
    definition.testPath
  );
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
