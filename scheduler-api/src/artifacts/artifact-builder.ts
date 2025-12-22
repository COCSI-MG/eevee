import { WorkerType } from 'src/worker/enum/worker-type.enum';
import { CreateWorkerDto } from 'src/worker/dto/create-worker.dto';
import { normalizeTestFiles } from 'src/worker/strategies/worker-strategy-helpers';

export interface ArtifactFile {
  path: string; // absolute path inside container, e.g. /app/app.ts
  content: string;
}

function assertAbsolute(path: string) {
  if (!path.startsWith('/')) {
    throw new Error(`ArtifactFile.path must be absolute: ${path}`);
  }
}

export function buildWorkerArtifactFiles(
  workerType: WorkerType,
  createWorkerData: CreateWorkerDto,
): ArtifactFile[] {
  const files: ArtifactFile[] = [];

  const normalizedTestFiles = normalizeTestFiles(
    createWorkerData.testFilesContent ?? [],
    createWorkerData.testFiles,
  );

  switch (workerType) {
    case WorkerType.NODE_DEFAULT: {
      files.push({
        path: '/app/app.ts',
        content: createWorkerData.applicationFileContent,
      });
      files.push({
        path: '/app/template-variables.ts',
        content: createWorkerData.templateVariablesModuleContent ?? '',
      });
      normalizedTestFiles.forEach((testFile, index) => {
        files.push({
          path: `/app/validation${index}.test.ts`,
          content: testFile.content,
        });
      });
      break;
    }

    case WorkerType.NODE_GRPCJS: {
      files.push({
        path: '/app/server.ts',
        content: createWorkerData.applicationFileContent,
      });
      files.push({
        path: '/app/app.ts',
        content: "export * from './server';\n",
      });
      files.push({
        path: '/app/template-variables.ts',
        content: createWorkerData.templateVariablesModuleContent ?? '',
      });
      normalizedTestFiles.forEach((testFile, index) => {
        files.push({
          path: `/app/validation${index}.test.ts`,
          content: testFile.content,
        });
      });
      break;
    }

    case WorkerType.NODE_NESTJS: {
      files.push({
        path: '/app/src/app.module.ts',
        content: createWorkerData.applicationFileContent,
      });
      files.push({
        path: '/app/test/template-variables.ts',
        content: createWorkerData.templateVariablesModuleContent ?? '',
      });
      normalizedTestFiles.forEach((testFile, index) => {
        files.push({
          path: `/app/test/validation${index}.e2e-spec.ts`,
          content: testFile.content,
        });
      });
      break;
    }

    case WorkerType.NODE_NEXTJS_CYPRESS: {
      files.push({
        path: '/app/student.tsx',
        content: createWorkerData.applicationFileContent,
      });
      files.push({
        path: '/app/template-variables.ts',
        content: createWorkerData.templateVariablesModuleContent ?? '',
      });
      normalizedTestFiles.forEach((testFile, index) => {
        files.push({
          path: `/app/cypress/e2e/validation${index}.cy.ts`,
          content: testFile.content,
        });
      });
      break;
    }

    default:
      throw new Error(
        `Unsupported workerType for artifact build: ${workerType}`,
      );
  }

  files.forEach((f) => assertAbsolute(f.path));
  return files;
}
