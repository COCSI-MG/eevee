import { loadWorkerDefinition } from "./worker-definition.js";
import { createFilesAndDirectoriesFromJson } from "./file-handler.js";
import { mergeTemplateSnapshotFiles, readTemplateSnapshot } from "./template-snapshot.js";
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

  const templateFiles: Record<string, Buffer> = Object.create(null);
  for (const snapshot of definition.templateSnapshots ?? []) {
    const files = await readTemplateSnapshot(snapshot);
    mergeTemplateSnapshotFiles(
      templateFiles,
      files,
      definition.testFiles ?? {},
      definition.testPath,
    );
  }
  await createFilesAndDirectoriesFromJson(templateFiles, definition.testPath);
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
