import { loadWorkerDefinition } from "./worker-definition.js";
import { createFilesAndDirectoriesFromJson } from "./file-handler.js";
import { readSourceSnapshot } from "./source-snapshot.js";

async function main() {
  console.log("Starting worker from definition...");
  const definition = await loadWorkerDefinition();

  const files = definition.sourceSnapshot
    ? await readSourceSnapshot(definition.sourceSnapshot)
    : definition.files ?? {};
  await createFilesAndDirectoriesFromJson(files, definition.srcPath);

  await createFilesAndDirectoriesFromJson(
    definition.testFiles ?? {},
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
